"""Tests for PostgreSQL persistence layer using a local test DB stand-in.

Verifies:
1. Schema initialization & static topology seeding (trains & blocks).
2. Write-after-compute persistence of disruptions, candidate schedule runs,
   block-level train timings, validation conflicts, and KPI snapshots.
3. Hardware sensor events and structured 2-train converging junction decisions
   (optimize_junction_conflict numbers captured in junction_decisions table).
"""

import os
import pytest
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker

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
import database
from simulator import get_state
from main import app
from fastapi.testclient import TestClient


@pytest.fixture(name="test_db")
def fixture_test_db(tmp_path):
    """Provide a temporary SQLite file as a test-only stand-in for PostgreSQL."""
    db_file = tmp_path / "test_persistence.db"
    test_url = f"sqlite:///{db_file}"
    orig_url = os.environ.get("DATABASE_URL")
    os.environ["DATABASE_URL"] = test_url

    # Reset simulator state
    get_state().reset()

    # Reset engine in database module
    database.engine = None
    database.SessionLocal = None
    engine = database.get_engine()

    database.init_db(engine)

    yield {"url": test_url, "engine": engine}

    # Teardown
    get_state().reset()
    if orig_url:
        os.environ["DATABASE_URL"] = orig_url
    else:
        os.environ.pop("DATABASE_URL", None)
    database.engine = None
    database.SessionLocal = None


def test_topology_seeding(test_db):
    """Verify trains and blocks are seeded on DB init."""
    engine = test_db["engine"]
    Session = sessionmaker(bind=engine)
    with Session() as session:
        trains = session.scalars(select(Train)).all()
        blocks = session.scalars(select(Block)).all()

        assert len(trains) == 4
        train_ids = {t.id for t in trains}
        assert train_ids == {"T101", "T204", "T305", "T408"}

        assert len(blocks) == 3
        block_ids = {b.id for b in blocks}
        assert block_ids == {"BL1", "BL2", "BL3"}


def test_api_disruption_and_optimization_persistence(test_db):
    """Verify /disruption and /optimize endpoints write to DB."""
    client = TestClient(app)

    # 1. Inject a disruption
    disp_resp = client.post(
        "/disruption",
        json={
            "type": "signal_delay",
            "train_id": "T204",
            "block_id": "BL2",
            "minutes": 15,
        },
    )
    assert disp_resp.status_code == 200

    # 2. Run optimizer
    opt_resp = client.post("/optimize", json={"time_limit_s": 4.0})
    assert opt_resp.status_code == 200

    engine = test_db["engine"]
    Session = sessionmaker(bind=engine)
    with Session() as session:
        # Check disruptions table
        disruptions = session.scalars(select(Disruption)).all()
        assert len(disruptions) >= 1
        assert disruptions[0].train_id == "T204"
        assert disruptions[0].block_id == "BL2"
        assert disruptions[0].minutes == 15

        # Check schedule_runs table
        runs = session.scalars(select(ScheduleRun)).all()
        assert len(runs) >= 2  # One from disruption cascade, one from optimize

        optimized_run = [r for r in runs if r.run_type == "optimized"]
        assert len(optimized_run) == 1
        assert optimized_run[0].solver_status in ("OPTIMAL", "FEASIBLE")
        assert optimized_run[0].is_optimal is True

        # Check schedule_results
        results = session.scalars(
            select(ScheduleResult).where(ScheduleResult.run_id == optimized_run[0].id)
        ).all()
        assert len(results) == 12  # 4 trains * 3 blocks

        # Check KPI snapshots
        kpis = session.scalars(select(KPISnapshot)).all()
        assert len(kpis) >= 2


def test_hardware_event_and_junction_decision_persistence(test_db):
    """Verify /sensor-event persists hardware events and structured junction decisions."""
    client = TestClient(app)

    def send(sensor_id, state, seq, offset_ms=0):
        return client.post(
            "/sensor-event",
            json={
                "block_id": sensor_id,
                "state": state,
                "event_type": "sensor_triggered",
                "timestamp": 1727602450000 + offset_ms,
                "source": f"sensor_{sensor_id}",
                "seq": seq,
            },
        )

    # Clear junction state so the test starts from a known, empty junction.
    assert client.post("/sensor-event/reset").status_code == 200

    # Approach A (the freight, T305) is detected.
    r1 = send("A1", "occupied", 101)
    assert r1.status_code == 200
    assert r1.json()["status"] == "accepted"

    # Approach B (the express, T101) arrives before A clears -> real conflict.
    r2 = send("B1", "occupied", 201, offset_ms=5000)
    assert r2.status_code == 200
    body = r2.json()
    assert body["optimizer_triggered"] is True
    assert body["decision"]["conflict"] is True

    engine = test_db["engine"]
    Session = sessionmaker(bind=engine)
    with Session() as session:
        events = session.scalars(select(HardwareEvent).order_by(HardwareEvent.id)).all()
        assert len(events) >= 2

        # The advisory aspects persisted for the conflicting event must match the
        # decision: exactly one approach held, one proceeding.
        dual_event = [e for e in events if e.source == "sensor_B1"][0]
        assert {dual_event.signal_a, dual_event.signal_b} == {"PROCEED", "HOLD"}

        # Structured 2-train numbers captured for that conflict.
        decisions = session.scalars(
            select(JunctionDecision).where(JunctionDecision.hardware_event_id == dual_event.id)
        ).all()
        assert len(decisions) == 1

        jd = decisions[0]
        # A is the freight T305 (weight 1); B is the express T101 (weight 3).
        assert jd.weight_a == 1
        assert jd.weight_b == 3
        assert jd.proceed_train in ("A", "B")
        assert jd.hold_train in ("A", "B")
        assert jd.proceed_train != jd.hold_train
        assert jd.wall_time_ms is not None
        assert jd.objective_value is not None
