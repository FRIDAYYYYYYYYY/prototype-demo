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

Physical junction hardware (ESP32):

``GET  /hardware/contract``  the locked sensor / GPIO contract
``GET  /hardware/status``    full hardware state + audit trail
``POST /sensor-event``       receive one debounced ESP32 sensor event
``GET  /block-state``        signal aspect per logical block (polled)
``POST /sensor-event/reset`` reset junction hardware state (demo/test utility)
"""

from __future__ import annotations

import logging
import os
import sys
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Literal, Optional

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator, model_validator

from database import (
    init_db,
    persist_disruption,
    persist_hardware_event,
    persist_kpi_snapshot,
    persist_schedule_run,
)
import junction_adapter
from hardware_state import (
    EVENT_TYPES,
    JUNCTION_TRAIN_MAP,
    LOGICAL_BLOCK_IDS,
    SENSOR_CONTRACT,
    SENSOR_IDS,
    contract_table,
    get_hardware_state,
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


# ---------------------------------------------------------------------------
# Hardware request models (Phase B)
# ---------------------------------------------------------------------------

class SensorEventRequest(BaseModel):
    """One ESP32 sensor event, validated against the locked hardware contract.

    ``block_id`` carries the **sensor ID** (``A1``/``A2``/``B1``/``B2``), exactly as
    specified by the contract.  The logical block (``A``/``B``) is derived from
    :data:`hardware_state.SENSOR_CONTRACT`.
    """

    block_id: str = Field(description="Sensor ID: A1, A2, B1 or B2")
    state: str = Field(description="'occupied' for A1/B1, 'free' for A2/B2")
    event_type: str = Field(default="sensor_triggered", description="contract event type")
    timestamp: int = Field(description="epoch milliseconds", gt=0)
    device_ms: Optional[int] = Field(default=None, description="ESP32 device monotonic timestamp in milliseconds from millis()")
    source: str = Field(min_length=1, description="idempotency key, e.g. 'sensor_A1'")
    seq: int = Field(ge=0, description="monotonically increasing per source")

    @field_validator("block_id")
    @classmethod
    def _known_sensor(cls, value: str) -> str:
        if value not in SENSOR_CONTRACT:
            raise ValueError(
                f"unknown sensor '{value}' (expected one of {', '.join(SENSOR_IDS)})"
            )
        return value

    @field_validator("event_type")
    @classmethod
    def _known_event_type(cls, value: str) -> str:
        if value not in EVENT_TYPES:
            raise ValueError(
                f"unknown event_type '{value}' (expected one of {', '.join(EVENT_TYPES)})"
            )
        return value

    @field_validator("source")
    @classmethod
    def _non_empty_source(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("'source' must be a non-empty string")
        return value

    @model_validator(mode="after")
    def _state_matches_sensor(self) -> "SensorEventRequest":
        """A1/B1 may only report ``occupied``; A2/B2 may only report ``free``."""
        expected = SENSOR_CONTRACT[self.block_id]["target_state"]
        if self.state != expected:
            raise ValueError(
                f"sensor {self.block_id} must report state '{expected}', "
                f"got '{self.state}'"
            )
        return self

    @property
    def logical_block(self) -> str:
        return SENSOR_CONTRACT[self.block_id]["block_id"]

    @property
    def train_id(self) -> str:
        return SENSOR_CONTRACT[self.block_id]["train_id"]

# Alias for backwards compatibility
SensorEventPayload = SensorEventRequest


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
            "GET /hardware/contract",
            "GET /hardware/status",
            "POST /sensor-event",
            "GET /block-state",
            "POST /sensor-event/reset",
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
        get_hardware_state().reset()
        junction_adapter.reset_run_counter()
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


@app.get("/eta-forecast", summary="Advisory ETA predictions to junction")
def read_eta_forecast() -> Dict[str, Any]:
    from eta_forecast import get_eta_forecasts

    return get_eta_forecasts(get_state())


# ---------------------------------------------------------------------------
# Hardware endpoints (Phases B / C / D)
# ---------------------------------------------------------------------------

logger = logging.getLogger("junction.hardware")


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")


def _record_event(state_obj, sensor_id: str, **extra: Any) -> None:
    """Append an entry to the bounded in-memory audit trail."""
    state_obj.log_event({"at": _utc_now(), "sensor_id": sensor_id, **extra})


def _recompute_decision(state_obj) -> Optional[Dict[str, Any]]:
    """Re-evaluate the junction and store the result on the hardware state.

    The optimizer is only invoked when the *occupancy signature* changes, so a
    repeated or ignored event can never re-run the solver.
    """
    occupancy = dict(state_obj.occupancy)
    occupied = tuple(b for b in LOGICAL_BLOCK_IDS if occupancy.get(b) == "occupied")
    conflict_key = "|".join(occupied)

    if conflict_key == state_obj._last_conflict_key:
        return state_obj.decision

    decision = junction_adapter.decide_junction(occupancy, dict(state_obj.arrival_times))
    if len(occupied) >= 2:
        state_obj.optimizer_calls += 1
    state_obj.decision = decision
    state_obj._last_conflict_key = conflict_key
    return decision


@app.get("/hardware/contract", summary="Locked sensor / GPIO contract")
def read_hardware_contract() -> Dict[str, Any]:
    """The hardware contract, served by the API so the ESP32 and the docs agree."""
    return contract_table()


@app.get("/hardware/status", summary="Full hardware state and audit trail")
def read_hardware_status() -> Dict[str, Any]:
    state_obj = get_hardware_state()
    return {"state": state_obj.snapshot(), "events": list(state_obj.event_log)}


@app.post("/sensor-event", summary="Receive one ESP32 sensor event")
def post_sensor_event(request: SensorEventRequest) -> Dict[str, Any]:
    """Ingest a sensor event: validate, de-duplicate, update state, decide.

    A malformed payload never mutates state and never crashes the service (Pydantic
    rejects it with 422 before this handler runs).
    """
    state_obj = get_hardware_state()
    sensor_id = request.block_id
    block_id = request.logical_block
    source = request.source

    with state_obj._lock:
        last_seq = state_obj.last_accepted_seq.get(source)
        if last_seq is not None and request.seq <= last_seq:
            logger.info(
                "hardware.duplicate source=%s seq=%s last_accepted_seq=%s sensor=%s",
                source, request.seq, last_seq, sensor_id,
            )
            _record_event(
                state_obj, sensor_id, status="ignored",
                reason="duplicate_or_stale_seq", source=source, seq=request.seq,
            )
            active_trains = [JUNCTION_TRAIN_MAP[b] for b in sorted(state_obj.occupied_blocks()) if b in JUNCTION_TRAIN_MAP]
            return {
                "status": "ignored",
                "action_taken": "duplicate_ignored",
                "reason": "duplicate_or_stale_seq",
                "sensor_id": sensor_id,
                "block_id": block_id,
                "seq": request.seq,
                "last_accepted_seq": last_seq,
                "optimizer_triggered": False,
                "active_trains": active_trains,
            }

        current_state = state_obj.occupancy.get(block_id, "free")
        if current_state == request.state:
            # New seq, but logically redundant: no transition would occur.
            state_obj.last_accepted_seq[source] = request.seq
            state_obj.last_event_received_at = time.time()
            state_obj.last_event = request.model_dump()
            logger.info(
                "hardware.state_redundant source=%s seq=%s sensor=%s current_state=%s",
                source, request.seq, sensor_id, current_state,
            )
            _record_event(
                state_obj, sensor_id, status="ignored", reason="state_redundant",
                source=source, seq=request.seq, current_state=current_state,
            )
            active_trains = [JUNCTION_TRAIN_MAP[b] for b in sorted(state_obj.occupied_blocks()) if b in JUNCTION_TRAIN_MAP]
            return {
                "status": "ignored",
                "action_taken": "duplicate_ignored",
                "reason": "state_redundant",
                "sensor_id": sensor_id,
                "block_id": block_id,
                "seq": request.seq,
                "current_state": current_state,
                "optimizer_triggered": False,
                "active_trains": active_trains,
            }

        # -- the event is accepted -----------------------------------------
        state_obj.occupancy[block_id] = request.state
        state_obj.last_accepted_seq[source] = request.seq
        state_obj.last_event_received_at = time.time()
        state_obj.last_event = request.model_dump()
        if request.state == "occupied":
            state_obj.arrival_times[block_id] = float(request.timestamp)
        else:
            state_obj.arrival_times.pop(block_id, None)

        logger.info(
            "hardware.accepted source=%s seq=%s sensor=%s block=%s train=%s state=%s",
            source, request.seq, sensor_id, block_id, request.train_id, request.state,
        )
        _record_event(
            state_obj, sensor_id, status="accepted", source=source, seq=request.seq,
            block_id=block_id, train_id=request.train_id, state=request.state,
        )

        decision = _recompute_decision(state_obj)

    active_trains = [JUNCTION_TRAIN_MAP[b] for b in sorted(state_obj.occupied_blocks()) if b in JUNCTION_TRAIN_MAP]
    action_taken = (
        "conflict_evaluated" if (decision and decision.get("conflict"))
        else ("signal_granted" if request.state == "occupied" else "state_updated")
    )

    # Persistence integration
    try:
        client_ip = "127.0.0.1"
        persist_hardware_event(
            event_payload=request.model_dump(),
            client_ip=client_ip,
            action_taken=action_taken,
            signals={"A": "PROCEED" if decision and "A" in decision.get("proceed", []) else ("PROCEED" if not (decision and decision.get("conflict")) else "HOLD"),
                     "B": "PROCEED" if decision and "B" in decision.get("proceed", []) else ("HOLD" if (decision and decision.get("conflict")) else "PROCEED")},
            reason=decision.get("reason", "") if decision else "",
            active_trains=active_trains,
            junction_decision=decision,
        )
    except Exception as e:
        logger.warning(f"Persistence error: {e}")

    return {
        "status": "accepted",
        "action_taken": action_taken,
        "sensor_id": sensor_id,
        "block_id": block_id,
        "train_id": request.train_id,
        "state": request.state,
        "seq": request.seq,
        "active_trains": active_trains,
        "optimizer_triggered": bool(decision and decision.get("conflict")),
        "decision": decision,
    }


@app.post("/sensor-event/reset", summary="Reset junction hardware state (demo/test utility)")
def reset_hardware_state() -> Dict[str, Any]:
    """Clear occupancy, seq counters, decision and event log.

    Demo / rehearsal / test utility only.  Unauthenticated by design; never expose
    it outside a controlled prototype network.
    """
    state_obj = get_hardware_state()
    state_obj.reset()
    junction_adapter.reset_run_counter()
    logger.info("hardware.reset requested")
    return {
        "status": "reset",
        "message": (
            "Junction hardware state cleared (occupancy, seq counters, decision, "
            "event log). Demo/test utility."
        ),
        "state": state_obj.snapshot(),
    }


@app.get("/block-state", summary="Current signal aspect per logical block")
def read_block_state() -> Dict[str, Any]:
    """Signal aspect for blocks A and B, polled by the ESP32 every 1-2 seconds."""
    state_obj = get_hardware_state()
    decision = state_obj.decision
    stale = state_obj.is_stale()
    occupied = set(state_obj.occupied_blocks())

    blocks: List[Dict[str, str]] = []
    for block_id in LOGICAL_BLOCK_IDS:
        if decision and decision.get("conflict"):
            signal = "PROCEED" if block_id in decision.get("proceed", []) else "HOLD"
        else:
            signal = "PROCEED"
        train_id = JUNCTION_TRAIN_MAP.get(block_id)
        blocks.append({"block_id": block_id, "signal": signal, "train_id": train_id})

    if state_obj.last_event_received_at is None:
        reason = "No hardware data yet - signals are advisory defaults, not a clearance."
    elif stale:
        reason = (
            "Hardware data is stale (no event for more than "
            f"{state_obj.snapshot()['stale_threshold_s']} s); the last known aspect "
            "is being repeated."
        )
    elif decision and decision.get("conflict"):
        reason = decision["reason"]
    elif occupied:
        only = sorted(occupied)[0]
        reason = (
            f"{JUNCTION_TRAIN_MAP[only]} is approaching the junction on block {only} "
            "and no other train is detected, so it may proceed."
        )
    else:
        reason = "Junction is clear - both approaches are free."

    payload: Dict[str, Any] = {
        "blocks": blocks,
        "reason": reason,
        "timestamp": _utc_now(),
        "stale": stale,
    }
    if decision:
        payload["decision"] = {
            "source": decision.get("decision_source"),
            "run_id": decision.get("run_id"),
            "conflict": decision.get("conflict"),
        }
    return payload


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

