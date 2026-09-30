"""Database connection, session management, and write-after-compute persistence layer.

Connects to PostgreSQL (or a configured DATABASE_URL). If DATABASE_URL is not set
or unreachable, functions safely no-op to guarantee zero impact on existing in-memory
operations and test suites.
"""

from __future__ import annotations

import logging
import os
from contextlib import contextmanager
from typing import Any, Dict, List, Optional, Sequence

from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker

from models import (
    Base,
    Block,
    Conflict,
    Disruption,
    HardwareEvent,
    JunctionDecision,
    KPISnapshot,
    ScheduleResult,
    ScheduleRun,
    Train,
)
from simulator import BLOCKS, TRAINS

logger = logging.getLogger("train_traffic.database")

# Environment-configurable database connection string
DATABASE_URL = os.environ.get("DATABASE_URL")

engine = None
SessionLocal = None
_db_initialized = False


def get_engine():
    """Lazy initialize and return SQLAlchemy engine if DATABASE_URL is set."""
    global engine, SessionLocal
    url = os.environ.get("DATABASE_URL")
    if not url:
        return None

    if engine is None or str(engine.url) != url:
        # Standardize postgres:// to postgresql:// for SQLAlchemy compatibility
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)

        connect_args = {}
        if url.startswith("sqlite"):
            connect_args["check_same_thread"] = False

        engine = create_engine(url, echo=False, connect_args=connect_args)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    return engine


@contextmanager
def get_db_session():
    """Provide a transactional scope around a series of operations."""
    current_engine = get_engine()
    if current_engine is None or SessionLocal is None:
        yield None
        return

    session: Session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception as exc:
        session.rollback()
        logger.warning(f"Database session rolled back due to error: {exc}")
        raise
    finally:
        session.close()


def init_db(target_engine=None) -> bool:
    """Initialize database tables and seed static topology (trains & blocks)."""
    global _db_initialized
    eng = target_engine or get_engine()
    if eng is None:
        logger.info("DATABASE_URL not set; running in pure in-memory mode without DB persistence.")
        return False

    try:
        Base.metadata.create_all(bind=eng)

        # Seed static fleet and topology if not already present
        SessionMaker = sessionmaker(bind=eng)
        with SessionMaker() as session:
            # Seed trains
            existing_train_ids = set(session.scalars(select(Train.id)).all())
            for t in TRAINS:
                if t["id"] not in existing_train_ids:
                    train_row = Train(
                        id=t["id"],
                        name=t["name"],
                        type=t["type"],
                        priority=t["priority"],
                        weight=t["weight"],
                        colour=t.get("colour", "#6366f1"),
                        origin_station="A",
                        dest_station="D",
                    )
                    session.add(train_row)

            # Seed blocks
            existing_block_ids = set(session.scalars(select(Block.id)).all())
            for b in BLOCKS:
                if b["id"] not in existing_block_ids:
                    block_row = Block(
                        id=b["id"],
                        name=b["name"],
                        from_station=b["from"],
                        to_station=b["to"],
                        length_km=float(b.get("length_km", 15.0)),
                        max_speed_kmh=110,
                    )
                    session.add(block_row)

            session.commit()

        _db_initialized = True
        logger.info(f"Database successfully initialized with topology at {eng.url}")
        return True
    except Exception as exc:
        logger.warning(f"Failed to initialize database tables: {exc}")
        return False


def persist_disruption(disruption_data: Dict[str, Any]) -> Optional[str]:
    """Write-after-compute persistence for an injected disruption."""
    try:
        with get_db_session() as session:
            if session is None:
                return None

            disp_id = str(disruption_data.get("id"))
            existing = session.get(Disruption, disp_id)
            if existing:
                return existing.id

            disp = Disruption(
                id=disp_id,
                type=disruption_data.get("type", "signal_delay"),
                label=disruption_data.get("label", "Disruption"),
                train_id=disruption_data.get("train_id"),
                block_id=disruption_data.get("block_id"),
                minutes=disruption_data.get("minutes"),
                start_minute=disruption_data.get("start"),
                end_minute=disruption_data.get("end"),
                reason=disruption_data.get("reason"),
            )
            session.add(disp)
            return disp.id
    except Exception as exc:
        logger.warning(f"Failed to persist disruption: {exc}")
        return None


def persist_schedule_run(
    run_type: str,
    schedule: Dict[str, Any],
    solver_info: Optional[Dict[str, Any]] = None,
    validation: Optional[Dict[str, Any]] = None,
    kpis: Optional[Dict[str, Any]] = None,
    disruptions_count: int = 0,
) -> Optional[int]:
    """Write-after-compute persistence for a candidate timetable run, results, conflicts, and KPIs."""
    try:
        with get_db_session() as session:
            if session is None:
                return None

            s_info = solver_info or {}
            run = ScheduleRun(
                run_type=run_type,
                solver_status=s_info.get("status"),
                is_optimal=s_info.get("optimal"),
                wall_time_ms=s_info.get("wall_time_ms"),
                variables=s_info.get("variables"),
                constraints=s_info.get("constraints"),
                num_conflicts=s_info.get("num_conflicts"),
                num_branches=s_info.get("num_branches"),
                objective_value=s_info.get("objective_value"),
                best_objective_bound=s_info.get("best_objective_bound"),
                disruptions_count=disruptions_count,
            )
            session.add(run)
            session.flush()  # populate run.id

            # Persist per-train block timings
            if schedule and "trains" in schedule:
                for train_id, train_data in schedule["trains"].items():
                    final_delay = train_data.get("final_delay", 0)
                    for block_id, block_timing in train_data.get("blocks", {}).items():
                        res = ScheduleResult(
                            run_id=run.id,
                            train_id=train_id,
                            block_id=block_id,
                            entry_minute=block_timing.get("entry", 0),
                            entry_label=block_timing.get("entry_label", ""),
                            exit_minute=block_timing.get("exit", 0),
                            exit_label=block_timing.get("exit_label", ""),
                            hold_min=block_timing.get("hold_min", 0),
                            run_min=block_timing.get("run_min", 0),
                            final_delay_min=final_delay,
                        )
                        session.add(res)

            # Persist validation conflicts & warnings
            if validation and isinstance(validation.get("conflicts"), list):
                for finding in validation["conflicts"]:
                    if not isinstance(finding, dict):
                        continue
                    t_val = finding.get("trains")
                    t1 = t_val[0] if (isinstance(t_val, list) and len(t_val) > 0) else None
                    t2 = t_val[1] if (isinstance(t_val, list) and len(t_val) > 1) else None
                    conf = Conflict(
                        run_id=run.id,
                        conflict_code=str(finding.get("id", "CF-0")),
                        type=str(finding.get("type", "unknown")),
                        severity=str(finding.get("severity", "warning")),
                        check_id=str(finding.get("check", "unknown")),
                        block_id=finding.get("block_id"),
                        station_id=finding.get("station_id") or finding.get("hold_station"),
                        train_1=t1,
                        train_2=t2,
                        start_min=finding.get("start_min"),
                        end_min=finding.get("end_min"),
                        message=str(finding.get("message", "")),
                    )
                    session.add(conf)

            # Persist KPI snapshot if provided
            if kpis:
                kpi_row = KPISnapshot(
                    run_id=run.id,
                    active_schedule=kpis.get("active_schedule", run_type),
                    total_delay_min=kpis.get("total_delay_min", 0),
                    max_delay_min=kpis.get("max_delay_min", 0),
                    trains_scheduled=kpis.get("trains_scheduled", 0),
                    on_time_trains=kpis.get("on_time_trains", 0),
                    delayed_trains=kpis.get("delayed_trains", 0),
                    delayed_train_ids=kpis.get("delayed_train_ids", []),
                    critical_conflicts=kpis.get("conflicts", 0),
                    warnings=kpis.get("warnings", 0),
                    cascade_total_delay_min=kpis.get("cascade_total_delay_min"),
                    rule_based_total_delay_min=kpis.get("rule_based_total_delay_min"),
                    optimized_total_delay_min=kpis.get("optimized_total_delay_min"),
                    recovered_vs_rule_based_min=kpis.get("recovered_vs_rule_based_min"),
                    disruptions_count=kpis.get("disruptions", disruptions_count),
                )
                session.add(kpi_row)

            return run.id
    except Exception as exc:
        logger.warning(f"Failed to persist schedule run: {exc}")
        return None


def persist_hardware_event(
    event_payload: Dict[str, Any],
    client_ip: Optional[str],
    action_taken: str,
    signals: Dict[str, str],
    reason: str,
    active_trains: Optional[List[str]] = None,
    junction_decision: Optional[Dict[str, Any]] = None,
) -> Optional[int]:
    """Write-after-compute persistence for a hardware sensor event and any resulting junction decision."""
    try:
        with get_db_session() as session:
            if session is None:
                return None

            hw_event = HardwareEvent(
                source=str(event_payload.get("source", "")),
                seq=int(event_payload.get("seq", 0)),
                block_id=str(event_payload.get("block_id", "")),
                state=str(event_payload.get("state", "")),
                event_type=str(event_payload.get("event_type", "sensor_triggered")),
                client_ip=client_ip,
                event_timestamp=int(event_payload.get("timestamp", 0)),
                action_taken=action_taken,
                signal_a=signals.get("A", "PROCEED"),
                signal_b=signals.get("B", "PROCEED"),
                active_trains=active_trains or [],
                reason=reason,
            )
            session.add(hw_event)
            session.flush()  # populate hw_event.id

            # If optimize_junction_conflict() was invoked, persist structured numbers
            if junction_decision:
                jd = JunctionDecision(
                    hardware_event_id=hw_event.id,
                    ready_time_a=junction_decision.get("ready_time_a", 0),
                    ready_time_b=junction_decision.get("ready_time_b", 0),
                    weight_a=junction_decision.get("weight_a", 0),
                    weight_b=junction_decision.get("weight_b", 0),
                    entry_a=junction_decision.get("entry_a", 0),
                    entry_b=junction_decision.get("entry_b", 0),
                    delay_a=junction_decision.get("delay_a", 0),
                    delay_b=junction_decision.get("delay_b", 0),
                    proceed_train=junction_decision.get("proceed_train", "A"),
                    hold_train=junction_decision.get("hold_train", "B"),
                    objective_value=junction_decision.get("objective_value"),
                    wall_time_ms=junction_decision.get("wall_time_ms"),
                )
                session.add(jd)

            return hw_event.id
    except Exception as exc:
        logger.warning(f"Failed to persist hardware event: {exc}")
        return None


def persist_kpi_snapshot(kpis: Dict[str, Any], run_id: Optional[int] = None) -> Optional[int]:
    """Write-after-compute persistence for standalone KPI snapshot (e.g. after simulation reset)."""
    try:
        with get_db_session() as session:
            if session is None:
                return None

            kpi_row = KPISnapshot(
                run_id=run_id,
                active_schedule=kpis.get("active_schedule", "active"),
                total_delay_min=kpis.get("total_delay_min", 0),
                max_delay_min=kpis.get("max_delay_min", 0),
                trains_scheduled=kpis.get("trains_scheduled", 0),
                on_time_trains=kpis.get("on_time_trains", 0),
                delayed_trains=kpis.get("delayed_trains", 0),
                delayed_train_ids=kpis.get("delayed_train_ids", []),
                critical_conflicts=kpis.get("conflicts", 0),
                warnings=kpis.get("warnings", 0),
                cascade_total_delay_min=kpis.get("cascade_total_delay_min"),
                rule_based_total_delay_min=kpis.get("rule_based_total_delay_min"),
                optimized_total_delay_min=kpis.get("optimized_total_delay_min"),
                recovered_vs_rule_based_min=kpis.get("recovered_vs_rule_based_min"),
                disruptions_count=kpis.get("disruptions", 0),
            )
            session.add(kpi_row)
            session.flush()
            return kpi_row.id
    except Exception as exc:
        logger.warning(f"Failed to persist KPI snapshot: {exc}")
        return None
