"""FastAPI backend for the AI powered train traffic control prototype.

Decision-support / simulation prototype - **not** autonomous train control.
Every endpoint returns advisory information for a human dispatcher.

Endpoints
---------
``GET  /``            service index
``GET  /health``      liveness probe
``GET  /state``       topology, booked / cascade / rule-based / optimised plans
``GET  /scenarios``   ready made demo disturbances
``POST /disruption``  inject a signal delay or a block possession
``POST /optimize``    run the CP-SAT re-planning model
``POST /validate``    rule based safety validation of any plan
``GET  /results``     KPIs + validation + before/after comparison + advice
``POST /reset``       restore the booked baseline
"""

from __future__ import annotations

import datetime
import os
import sys
from typing import Any, Dict, List, Optional

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from database import (
    init_db,
    persist_disruption,
    persist_hardware_event,
    persist_kpi_snapshot,
    persist_schedule_run,
)
from optimizer import optimize_schedule, optimizer_summary
from recommender import build_recommendation
from simulator import (
    BOOKED_ORDER,
    DISCLAIMER,
    ROUTE_BLOCK_IDS,
    TRAINS,
    format_minute,
    get_state,
)
from validator import summarise, validate_schedule

# The Vite dev server and preview server origins are allowed to talk to this API.
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:5175",
    "http://127.0.0.1:5175",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
]

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(
    title="AI Train Traffic Control Prototype",
    version="1.0.0",
    lifespan=lifespan,
    description=(
        "Decision-support simulator: normal operation -> disruption injection -> "
        "delay propagation -> CP-SAT re-planning -> rule based safety validation -> "
        "dispatcher recommendation.  Not autonomous train control."
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Request models
# ---------------------------------------------------------------------------

class DisruptionRequest(BaseModel):
    """A disturbance the dispatcher injects into the corridor."""

    type: str = Field(
        default="signal_delay",
        description="'signal_delay' (train held in a block) or 'block_closure' (possession)",
    )
    train_id: Optional[str] = Field(default=None, description="e.g. 'T204' (signal_delay)")
    block_id: Optional[str] = Field(default=None, description="e.g. 'BL2'")
    minutes: Optional[int] = Field(default=None, ge=1, le=180, description="delay in minutes")
    start_minute: Optional[int] = Field(default=None, ge=0, description="possession start")
    end_minute: Optional[int] = Field(default=None, gt=0, description="possession end")
    reason: Optional[str] = Field(default=None, description="free text reason for the closure")


class OptimizeRequest(BaseModel):
    time_limit_s: float = Field(default=8.0, gt=0.1, le=60.0)
    seed: int = Field(default=42, ge=0)


class ValidateRequest(BaseModel):
    schedule: str = Field(
        default="active",
        description="'active' | 'baseline' | 'legacy_cascade' | 'rule_based' | 'optimized'",
    )


class ResetRequest(BaseModel):
    clear_disruptions: bool = Field(
        default=True, description="false keeps the disturbances but drops the optimized plan"
    )


class SensorEventPayload(BaseModel):
    block_id: str = Field(..., description="Hardware sensor ID: 'A1', 'A2', 'B1', 'B2'")
    state: str = Field(..., description="Occupancy state: 'occupied' or 'free'")
    event_type: str = Field(default="sensor_triggered", description="Event type")
    timestamp: int = Field(..., description="Unix epoch timestamp in milliseconds")
    source: str = Field(..., description="Sensor source identifier, e.g. 'sensor_A1'")
    seq: int = Field(..., description="Strictly monotonic sequence number per source")



#: Ready made disturbances used by the demo preset buttons in the UI.
DEMO_SCENARIOS: List[Dict[str, Any]] = [
    {
        "id": "signal-delay-15",
        "name": "Signal failure: T204 held 15 min in Block 2",
        "description": (
            "Intercity passenger T204 loses 15 minutes between Northgate and Riverside. "
            "The legacy single-hop cascade delays T305 but leaves Superfast Express T408 "
            "running into the same blocks."
        ),
        "request": {
            "type": "signal_delay",
            "train_id": "T204",
            "block_id": "BL2",
            "minutes": 15,
        },
    },
    {
        "id": "signal-delay-25",
        "name": "Freight held 25 min leaving Central Junction",
        "description": (
            "Coal freight T305 is held for 25 minutes in Block 1, which pushes both "
            "T305 and the express behind it."
        ),
        "request": {
            "type": "signal_delay",
            "train_id": "T305",
            "block_id": "BL1",
            "minutes": 25,
        },
    },
    {
        "id": "possession-bl3",
        "name": "Track possession: Block 3 10:50-11:05",
        "description": (
            "An emergency possession closes Block 3 for 15 minutes. Every train that "
            "booked the block inside the window must be re-planned around it."
        ),
        "request": {
            "type": "block_closure",
            "block_id": "BL3",
            "start_minute": 50,
            "end_minute": 65,
            "reason": "Emergency track possession",
        },
    },
]

# ---------------------------------------------------------------------------
# Dashboard aggregation
# ---------------------------------------------------------------------------

def compute_kpis(state) -> Dict[str, Any]:
    """Headline numbers for the KPI cards."""
    active = state.active_schedule()
    active_validation = validate_schedule(active, state.disruptions, reference=state.baseline)
    cascade_validation = validate_schedule(
        state.legacy, state.disruptions, reference=state.baseline
    )
    delayed_ids = [
        train_id
        for train_id in BOOKED_ORDER
        if active["trains"][train_id]["final_delay"] > 0
    ]
    optimized_total = (
        state.optimized["totals"]["total_delay_min"] if state.optimized is not None else None
    )
    rule_based_total = state.rule_based["totals"]["total_delay_min"]

    return {
        "active_schedule": state.active_name(),
        "active_schedule_label": {
            "baseline": "Booked timetable",
            "legacy_cascade": "Legacy cascade projection",
            "optimized": "CP-SAT re-planned timetable",
        }.get(state.active_name(), state.active_name()),
        "total_delay_min": active["totals"]["total_delay_min"],
        "max_delay_min": active["totals"]["max_delay_min"],
        "trains_scheduled": active["totals"]["trains"],
        "on_time_trains": active["totals"]["trains"] - len(delayed_ids),
        "delayed_trains": len(delayed_ids),
        "delayed_train_ids": delayed_ids,
        "conflicts": active_validation["critical_conflicts"],
        "warnings": active_validation["warnings"],
        "cascade_conflicts": cascade_validation["critical_conflicts"],
        "cascade_total_delay_min": state.legacy["totals"]["total_delay_min"],
        "rule_based_total_delay_min": rule_based_total,
        "rule_based_conflicts": 0,
        "optimized_total_delay_min": optimized_total,
        "optimized_conflicts": (
            validate_schedule(
                state.optimized, state.disruptions, reference=state.baseline
            )["critical_conflicts"]
            if state.optimized is not None
            else None
        ),
        "recovered_vs_rule_based_min": (
            rule_based_total - optimized_total if optimized_total is not None else None
        ),
        "disruptions": len(state.disruptions),
    }


def compute_comparison(state) -> Dict[str, Any]:
    """Booked vs legacy cascade vs CP-SAT re-plan, per train."""
    rows: List[Dict[str, Any]] = []
    for train_id in BOOKED_ORDER:
        booked = state.baseline["trains"][train_id]
        cascade = state.legacy["trains"][train_id]
        optimized = state.optimized["trains"][train_id] if state.optimized is not None else None
        focus = optimized or cascade
        holds = [
            {
                "station_id": station_id,
                "station_name": stop["station_id"],
                "hold_min": stop["hold_min"],
                "depart_label": stop["depart_label"],
            }
            for station_id, stop in focus["stations"].items()
            if stop["hold_min"] > 0
        ]
        rows.append(
            {
                "train_id": train_id,
                "name": booked["name"],
                "type": booked["type"],
                "priority": booked["priority"],
                "colour": booked["colour"],
                "booked_arrival": booked["final_arrival"],
                "booked_arrival_label": booked["final_arrival_label"],
                "cascade_arrival": cascade["final_arrival"],
                "cascade_arrival_label": cascade["final_arrival_label"],
                "cascade_delay": cascade["final_delay"],
                "optimized_arrival": optimized["final_arrival"] if optimized else None,
                "optimized_arrival_label": optimized["final_arrival_label"] if optimized else None,
                "optimized_delay": optimized["final_delay"] if optimized else None,
                "delay_vs_booked": focus["final_delay"],
                "holds": holds,
            }
        )

    return {
        "rows": rows,
        "totals": {
            "booked_total_delay_min": 0,
            "cascade_total_delay_min": state.legacy["totals"]["total_delay_min"],
            "rule_based_total_delay_min": state.rule_based["totals"]["total_delay_min"],
            "optimized_total_delay_min": (
                state.optimized["totals"]["total_delay_min"]
                if state.optimized is not None
                else None
            ),
        },
    }

def build_results(state) -> Dict[str, Any]:
    """Everything the dashboard needs: KPIs, validation, comparison, advice."""
    active = state.active_schedule()
    validation = validate_schedule(active, state.disruptions, reference=state.baseline)
    cascade_validation = validate_schedule(
        state.legacy, state.disruptions, reference=state.baseline
    )
    kpis = compute_kpis(state)
    recommendation = build_recommendation(
        state.active_name(),
        validation,
        active,
        kpis,
        state.disruptions,
        state.solver_info,
    )
    return {
        "active_schedule": state.active_name(),
        "active_schedule_label": kpis["active_schedule_label"],
        "optimized": state.is_optimized(),
        "kpis": kpis,
        "validation": validation,
        "validation_summary": summarise(validation),
        "cascade_validation": cascade_validation,
        "cascade_validation_summary": summarise(cascade_validation),
        "comparison": compute_comparison(state),
        "recommendation": recommendation,
        "solver_info": state.solver_info,
        "solver_summary": optimizer_summary(state.solver_info),
        "cascade_notes": state.legacy.get("notes", []),
        "plan_notes": active.get("notes", []),
    }


def dashboard(state, event: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Combined payload returned by every mutating endpoint."""
    payload: Dict[str, Any] = {"state": state.snapshot(), "results": build_results(state)}
    if event is not None:
        payload["event"] = event
    return payload


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/", summary="Service index")
def read_index() -> Dict[str, Any]:
    return {
        "service": "AI Train Traffic Control Prototype",
        "version": app.version,
        "mode": "decision-support simulation",
        "disclaimer": DISCLAIMER,
        "corridor": [station["id"] for station in get_state().snapshot()["topology"]["stations"]],
        "blocks": ROUTE_BLOCK_IDS,
        "trains": [train["id"] for train in TRAINS],
        "endpoints": [
            "GET /health",
            "GET /state",
            "GET /scenarios",
            "POST /disruption",
            "POST /optimize",
            "POST /validate",
            "GET /results",
            "POST /reset",
            "POST /sensor-event",
            "GET /block-state",
            "GET /eta-forecast",
        ],
    }


@app.get("/health", summary="Liveness probe")
def read_health() -> Dict[str, Any]:
    return {"status": "ok", "disclaimer": DISCLAIMER}


@app.get("/state", summary="Topology plus every candidate plan")
def read_state() -> Dict[str, Any]:
    return get_state().snapshot()


@app.get("/scenarios", summary="Ready made demo disturbances")
def read_scenarios() -> Dict[str, Any]:
    return {"scenarios": DEMO_SCENARIOS, "default_optimize_seconds": 8.0}

@app.post("/disruption", summary="Inject a signal delay or a block possession")
def inject_disruption(request: DisruptionRequest) -> Dict[str, Any]:
    state = get_state()
    try:
        disruption = state.add_disruption(request.model_dump(exclude_none=True))
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    res = dashboard(
        state,
        event={
            "type": "disruption",
            "disruption": disruption,
            "cascade_notes": state.legacy.get("notes", []),
            "message": f"Injected: {disruption['label']}",
        },
    )
    # Write-after-compute persistence
    persist_disruption(disruption)
    persist_schedule_run(
        run_type=state.active_name(),
        schedule=state.active_schedule(),
        solver_info=state.solver_info,
        validation=res["results"]["validation"],
        kpis=res["results"]["kpis"],
        disruptions_count=len(state.disruptions),
    )
    return res


@app.post("/optimize", summary="Run the CP-SAT re-planning model")
def run_optimizer(request: Optional[OptimizeRequest] = None) -> Dict[str, Any]:
    state = get_state()
    time_limit_s = request.time_limit_s if request else 8.0
    seed = request.seed if request else 42
    result = optimize_schedule(
        state.disruptions, state.booked, time_limit_s=time_limit_s, seed=seed
    )
    schedule = result["schedule"]
    if schedule is None:
        raise HTTPException(
            status_code=409,
            detail=result["solver"].get("message", "CP-SAT found no feasible plan"),
        )
    state.set_optimized(schedule, result["solver"])
    res = dashboard(
        state,
        event={
            "type": "optimize",
            "solver": result["solver"],
            "message": optimizer_summary(result["solver"]),
        },
    )
    # Write-after-compute persistence
    persist_schedule_run(
        run_type="optimized",
        schedule=state.active_schedule(),
        solver_info=state.solver_info,
        validation=res["results"]["validation"],
        kpis=res["results"]["kpis"],
        disruptions_count=len(state.disruptions),
    )
    return res


@app.post("/validate", summary="Rule based safety validation")
def validate_plan(request: Optional[ValidateRequest] = None) -> Dict[str, Any]:
    state = get_state()
    name = (request.schedule if request else "active") or "active"
    if name == "active":
        name = state.active_name()
    schedule = state.schedule(name)
    if schedule is None:
        raise HTTPException(status_code=404, detail=f"no schedule named '{name}'")
    validation = validate_schedule(schedule, state.disruptions, reference=state.baseline)
    return {
        "schedule": name,
        "valid": validation["valid"],
        "summary": summarise(validation),
        "validation": validation,
    }


@app.get("/results", summary="KPIs, validation, comparison and advice")
def read_results() -> Dict[str, Any]:
    return build_results(get_state())


@app.post("/reset", summary="Restore the booked baseline")
def reset_simulation(request: Optional[ResetRequest] = None) -> Dict[str, Any]:
    state = get_state()
    clear_disruptions = request.clear_disruptions if request else True
    if clear_disruptions:
        state.reset()
    else:
        state.optimized = None
        state.solver_info = None
    res = dashboard(
        state,
        event={
            "type": "reset",
            "cleared_disruptions": clear_disruptions,
            "message": (
                "Simulation reset to the booked timetable."
                if clear_disruptions
                else "Optimized plan discarded - back to the cascade projection."
            ),
        },
    )
    # Write-after-compute persistence
    persist_kpi_snapshot(res["results"]["kpis"])
    return res


@app.post("/sensor-event", summary="Hardware sensor occupancy event intake")
def receive_sensor_event(payload: SensorEventPayload, request: Request) -> Dict[str, Any]:
    client_ip = request.client.host if request.client else "unknown"
    client_port = request.client.port if request.client else "unknown"
    now_iso = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]

    print("\n" + "=" * 78, flush=True)
    print(f">> [HARDWARE SENSOR EVENT RECEIVED] @ {now_iso}", flush=True)
    print(f"   Origin: {client_ip}:{client_port} -> POST /sensor-event", flush=True)
    print(f"   Payload: block_id={payload.block_id!r} | state={payload.state!r} | source={payload.source!r} | seq={payload.seq} | timestamp={payload.timestamp}", flush=True)

    state = get_state()
    result = state.process_sensor_event(payload.model_dump())

    print(f"   Result: status={result.get('status')} | action={result.get('action_taken')} | seq={result.get('seq')}", flush=True)
    print(f"   Signals: {state.hardware_signals} | Active Trains: {result.get('active_trains', [])}", flush=True)
    print(f"   Reason: {state.hardware_reason}", flush=True)
    print("=" * 78 + "\n", flush=True)

    # Write-after-compute persistence
    persist_hardware_event(
        event_payload=payload.model_dump(),
        client_ip=client_ip,
        action_taken=result.get("action_taken", "unknown"),
        signals=state.hardware_signals,
        reason=state.hardware_reason,
        active_trains=result.get("active_trains", []),
        junction_decision=state.last_junction_decision,
    )

    return result


@app.get("/block-state", summary="Advisory signal polling endpoint for hardware")
def read_block_state() -> Dict[str, Any]:
    return get_state().get_hardware_block_state()


@app.get("/eta-forecast", summary="Advisory ETA predictions to junction")
def read_eta_forecast() -> Dict[str, Any]:
    from eta_forecast import get_eta_forecasts

    return get_eta_forecasts(get_state())


if __name__ == "__main__":  # pragma: no cover - manual launch helper
    import uvicorn

    host = os.environ.get("HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", "8000"))
    print("=" * 78)
    print(" AI Train Traffic Control Prototype - decision-support simulation backend")
    print(f" API  : http://{host}:{port}   docs: http://{host}:{port}/docs")
    print(" Safety: advisory only - never use this for real train movements.")
    print("=" * 78)
    uvicorn.run(app, host=host, port=port, log_level="info")
