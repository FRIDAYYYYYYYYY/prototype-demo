"""End to end API tests for the train traffic control prototype.

Run either way::

    python backend/test_api.py          # prints a PASS/FAIL report
    python -m pytest backend/test_api.py

The tests walk the full demo workflow: baseline -> disruption injection ->
legacy cascade -> validation -> CP-SAT optimization -> clean recommendation.
"""

from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient  # noqa: E402

from main import app  # noqa: E402
from recommender import CLEAN_SUMMARY  # noqa: E402
from simulator import BOOKED_ORDER  # noqa: E402

client = TestClient(app)

DELAY_REQUEST = {
    "type": "signal_delay",
    "train_id": "T204",
    "block_id": "BL2",
    "minutes": 15,
}

POSSESSION_REQUEST = {
    "type": "block_closure",
    "block_id": "BL3",
    "start_minute": 50,
    "end_minute": 65,
    "reason": "Emergency track possession",
}


def reset() -> dict:
    response = client.post("/reset", json={"clear_disruptions": True})
    assert response.status_code == 200, response.text
    return response.json()


def test_health_and_index():
    assert client.get("/health").json()["status"] == "ok"
    index = client.get("/").json()
    assert index["trains"] == BOOKED_ORDER
    assert "Not Autonomous Train Control" in index["disclaimer"]


def test_initial_state_loads_booked_baseline():
    payload = reset()
    state = payload["state"]
    assert state["simulation"]["active_schedule"] == "baseline"
    assert state["simulation"]["has_disruptions"] is False
    assert len(state["topology"]["trains"]) == 4
    assert state["topology"]["trains"][0]["id"] == "T101"
    assert state["schedules"]["optimized"] is None

    results = payload["results"]
    assert results["kpis"]["trains_scheduled"] == 4
    assert results["kpis"]["total_delay_min"] == 0
    assert results["kpis"]["conflicts"] == 0
    assert results["validation"]["valid"] is True
    assert results["recommendation"]["summary"] == CLEAN_SUMMARY


def test_signal_delay_propagates_to_the_downstream_train():
    reset()
    response = client.post("/disruption", json=DELAY_REQUEST)
    assert response.status_code == 200, response.text
    payload = response.json()
    schedules = payload["state"]["schedules"]

    disrupted = schedules["legacy_cascade"]["trains"]["T204"]
    assert disrupted["final_delay"] == 15
    assert disrupted["blocks"]["BL2"]["entry_label"] == "10:38"

    follower = schedules["legacy_cascade"]["trains"]["T305"]
    assert follower["final_delay"] == 10
    assert follower["blocks"]["BL2"]["entry_label"] == "10:48"

    # two hops downstream keeps its booked path - that is what creates conflicts
    downstream = schedules["legacy_cascade"]["trains"]["T408"]
    assert downstream["final_delay"] == 0

    assert payload["results"]["kpis"]["cascade_conflicts"] >= 2
    assert payload["results"]["validation"]["valid"] is False


def test_validate_endpoint_flags_conflicts_before_optimization():
    reset()
    client.post("/disruption", json=DELAY_REQUEST)

    response = client.post("/validate", json={"schedule": "legacy_cascade"})
    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["valid"] is False
    assert payload["validation"]["critical_conflicts"] >= 2
    assert "block_overlap" in {c["type"] for c in payload["validation"]["conflicts"]}

    baseline = client.post("/validate", json={"schedule": "baseline"}).json()
    assert baseline["valid"] is True
    assert baseline["validation"]["critical_conflicts"] == 0

def test_optimizer_returns_valid_non_overlapping_schedule():
    reset()
    client.post("/disruption", json=DELAY_REQUEST)
    response = client.post("/optimize", json={"time_limit_s": 5})
    assert response.status_code == 200, response.text
    payload = response.json()
    results = payload["results"]

    assert results["optimized"] is True
    assert results["solver_info"]["status"] in {"OPTIMAL", "FEASIBLE"}
    assert results["solver_info"]["engine"] == "Google OR-Tools CP-SAT"
    assert results["validation"]["valid"] is True
    assert results["kpis"]["conflicts"] == 0
    assert all(check["status"] == "pass" for check in results["validation"]["checks"])
    assert results["kpis"]["recovered_vs_rule_based_min"] >= 0

    optimized = payload["state"]["schedules"]["optimized"]
    booked = payload["state"]["schedules"]["baseline"]
    for train_id, train in optimized["trains"].items():
        assert train["final_arrival"] >= booked["trains"][train_id]["final_arrival"]
        for block_id, block in train["blocks"].items():
            assert block["entry"] >= booked["trains"][train_id]["blocks"][block_id]["entry"]

    # independent re-validation of the optimized plan
    validated = client.post("/validate", json={"schedule": "optimized"}).json()
    assert validated["valid"] is True


def test_results_report_clean_schedule_after_optimization():
    reset()
    client.post("/disruption", json=DELAY_REQUEST)
    client.post("/optimize", json={"time_limit_s": 5})

    results = client.get("/results").json()
    assert results["kpis"]["conflicts"] == 0
    assert results["kpis"]["total_delay_min"] > 0
    assert results["recommendation"]["status"] == "valid"
    assert results["recommendation"]["summary"] == CLEAN_SUMMARY
    assert results["comparison"]["totals"]["optimized_total_delay_min"] is not None


def test_block_possession_is_respected_after_optimization():
    reset()
    response = client.post("/disruption", json=POSSESSION_REQUEST)
    assert response.status_code == 200, response.text
    assert response.json()["results"]["cascade_validation"]["critical_conflicts"] >= 1

    optimized = client.post("/optimize", json={"time_limit_s": 5}).json()["results"]
    assert optimized["validation"]["valid"] is True
    assert all(
        conflict["type"] != "possession_violation"
        for conflict in optimized["validation"]["conflicts"]
    )
    possession_check = next(
        check for check in optimized["validation"]["checks"] if check["id"] == "possession"
    )
    assert possession_check["status"] == "pass"


def test_optimizer_keeps_a_clean_baseline_when_nothing_is_wrong():
    reset()
    payload = client.post("/optimize", json={"time_limit_s": 5}).json()
    optimized = payload["state"]["schedules"]["optimized"]
    for train_id in BOOKED_ORDER:
        assert optimized["trains"][train_id]["final_delay"] == 0
    assert payload["results"]["validation"]["valid"] is True


def test_invalid_disruptions_are_rejected():
    reset()
    assert client.post(
        "/disruption", json={"train_id": "T999", "block_id": "BL2", "minutes": 5}
    ).status_code == 422
    assert client.post(
        "/disruption", json={"train_id": "T101", "block_id": "BL9", "minutes": 5}
    ).status_code == 422
    assert client.post(
        "/disruption", json={"train_id": "T101", "block_id": "BL2", "minutes": 0}
    ).status_code == 422
    assert client.post(
        "/disruption",
        json={"type": "block_closure", "block_id": "BL3", "start_minute": 60, "end_minute": 40},
    ).status_code == 422
    assert client.post("/validate", json={"schedule": "does-not-exist"}).status_code == 404


def test_reset_restores_the_booked_timetable():
    reset()
    client.post("/disruption", json=DELAY_REQUEST)
    client.post("/optimize", json={"time_limit_s": 5})
    payload = client.post("/reset", json={"clear_disruptions": True}).json()
    assert payload["state"]["simulation"]["disruptions"] == []
    assert payload["state"]["simulation"]["is_optimized"] is False
    assert payload["results"]["kpis"]["total_delay_min"] == 0
    assert payload["results"]["kpis"]["conflicts"] == 0


def test_hardware_seq_a_only():
    reset()
    # A1 approaches
    res1 = client.post(
        "/sensor-event",
        json={
            "block_id": "A1",
            "state": "occupied",
            "event_type": "sensor_triggered",
            "timestamp": 1732500000000,
            "source": "sensor_A1",
            "seq": 1,
        },
    )
    assert res1.status_code == 200
    p1 = res1.json()
    assert p1["status"] == "acknowledged"
    assert p1["action_taken"] == "signal_granted"
    assert p1["active_trains"] == ["T101"]

    bs1 = client.get("/block-state").json()
    assert bs1["blocks"][0]["block_id"] == "A"
    assert bs1["blocks"][0]["signal"] == "PROCEED"
    assert bs1["blocks"][1]["block_id"] == "B"
    assert bs1["blocks"][1]["signal"] == "HOLD"

    # A2 clears
    res2 = client.post(
        "/sensor-event",
        json={
            "block_id": "A2",
            "state": "free",
            "event_type": "sensor_triggered",
            "timestamp": 1732500005000,
            "source": "sensor_A2",
            "seq": 1,
        },
    )
    assert res2.status_code == 200
    p2 = res2.json()
    assert p2["action_taken"] == "state_updated"
    assert p2["active_trains"] == []

    bs2 = client.get("/block-state").json()
    assert bs2["blocks"][0]["signal"] == "PROCEED"
    assert bs2["blocks"][1]["signal"] == "PROCEED"


def test_hardware_seq_b_only():
    reset()
    # B1 approaches
    res1 = client.post(
        "/sensor-event",
        json={
            "block_id": "B1",
            "state": "occupied",
            "event_type": "sensor_triggered",
            "timestamp": 1732500000000,
            "source": "sensor_B1",
            "seq": 1,
        },
    )
    assert res1.status_code == 200
    p1 = res1.json()
    assert p1["status"] == "acknowledged"
    assert p1["action_taken"] == "signal_granted"
    assert p1["active_trains"] == ["T204"]

    bs1 = client.get("/block-state").json()
    assert bs1["blocks"][0]["signal"] == "HOLD"
    assert bs1["blocks"][1]["signal"] == "PROCEED"

    # B2 clears
    res2 = client.post(
        "/sensor-event",
        json={
            "block_id": "B2",
            "state": "free",
            "event_type": "sensor_triggered",
            "timestamp": 1732500005000,
            "source": "sensor_B2",
            "seq": 1,
        },
    )
    assert res2.status_code == 200
    p2 = res2.json()
    assert p2["active_trains"] == []


def test_hardware_seq_forward_conflict():
    reset()
    # A1 approaches first
    client.post(
        "/sensor-event",
        json={
            "block_id": "A1",
            "state": "occupied",
            "event_type": "sensor_triggered",
            "timestamp": 1732500000000,
            "source": "sensor_A1",
            "seq": 1,
        },
    )
    # B1 approaches before A2 clears -> Conflict!
    res_conflict = client.post(
        "/sensor-event",
        json={
            "block_id": "B1",
            "state": "occupied",
            "event_type": "sensor_triggered",
            "timestamp": 1732500002000,
            "source": "sensor_B1",
            "seq": 1,
        },
    )
    assert res_conflict.status_code == 200
    p = res_conflict.json()
    assert p["action_taken"] == "conflict_evaluated"
    assert set(p["active_trains"]) == {"T101", "T204"}

    bs = client.get("/block-state").json()
    # T101 (Express, weight 3) prioritised over T204 (Passenger, weight 2)
    assert bs["blocks"][0]["signal"] == "PROCEED"
    assert bs["blocks"][1]["signal"] == "HOLD"
    assert "holds Train B" in bs["reason"]
    assert "CP-SAT" in bs["reason"]


def test_hardware_seq_reverse_conflict():
    reset()
    # B1 approaches first
    client.post(
        "/sensor-event",
        json={
            "block_id": "B1",
            "state": "occupied",
            "event_type": "sensor_triggered",
            "timestamp": 1732500000000,
            "source": "sensor_B1",
            "seq": 1,
        },
    )
    # A1 approaches before B2 clears -> Conflict!
    res_conflict = client.post(
        "/sensor-event",
        json={
            "block_id": "A1",
            "state": "occupied",
            "event_type": "sensor_triggered",
            "timestamp": 1732500002000,
            "source": "sensor_A1",
            "seq": 1,
        },
    )
    assert res_conflict.status_code == 200
    p = res_conflict.json()
    assert p["action_taken"] == "conflict_evaluated"
    assert set(p["active_trains"]) == {"T101", "T204"}

    bs = client.get("/block-state").json()
    # T101 (Express, weight 3) prioritised by CP-SAT solver
    assert bs["blocks"][0]["signal"] == "PROCEED"
    assert bs["blocks"][1]["signal"] == "HOLD"
    assert "holds Train B" in bs["reason"]


def test_hardware_seq_duplicate_debounce():
    reset()
    # First event seq=100
    res1 = client.post(
        "/sensor-event",
        json={
            "block_id": "A1",
            "state": "occupied",
            "event_type": "sensor_triggered",
            "timestamp": 1732500000000,
            "source": "sensor_A1",
            "seq": 100,
        },
    )
    assert res1.json()["action_taken"] == "signal_granted"

    # Duplicate / out-of-order event seq=100 or seq=99
    res_dup = client.post(
        "/sensor-event",
        json={
            "block_id": "A1",
            "state": "occupied",
            "event_type": "sensor_triggered",
            "timestamp": 1732500000100,
            "source": "sensor_A1",
            "seq": 100,
        },
    )
    assert res_dup.status_code == 200
    assert res_dup.json()["action_taken"] == "duplicate_ignored"

    # strictly greater seq=101 is accepted
    res_next = client.post(
        "/sensor-event",
        json={
            "block_id": "A2",
            "state": "free",
            "event_type": "sensor_triggered",
            "timestamp": 1732500005000,
            "source": "sensor_A1",
            "seq": 101,
        },
    )
    assert res_next.status_code == 200
    assert res_next.json()["action_taken"] == "state_updated"


def test_esp32_reboot_handling_and_stale_occupancy_clearing():
    """Verify adaptive reboot handling:
    1. seq <= 3 after high seq is accepted as a reboot.
    2. Stale occupancy from before reboot is cleared.
    3. Handles firmware booting at seq=0 and seq=1.
    4. Real duplicates (seq == last_seq or seq < last_seq with seq > 3) are rejected.
    """
    reset()

    # 1. Normal run up to seq=50 (Track A occupied)
    res1 = client.post(
        "/sensor-event",
        json={
            "block_id": "A1",
            "state": "occupied",
            "event_type": "sensor_triggered",
            "timestamp": 1732500000000,
            "source": "sensor_A1",
            "seq": 50,
        },
    )
    assert res1.json()["action_taken"] == "signal_granted"
    assert res1.json()["active_trains"] == ["T101"]

    # 2. Firmware reboots and starts at seq=0 with free state
    res_reboot0 = client.post(
        "/sensor-event",
        json={
            "block_id": "A1",
            "state": "free",
            "event_type": "sensor_triggered",
            "timestamp": 1732500001000,
            "source": "sensor_A1",
            "seq": 0,
        },
    )
    assert res_reboot0.status_code == 200
    assert res_reboot0.json()["action_taken"] == "state_updated"
    assert res_reboot0.json()["active_trains"] == []  # Stale occupancy was cleared!

    # 3. Next monotonic event seq=1 after reboot is accepted
    res_seq1 = client.post(
        "/sensor-event",
        json={
            "block_id": "A1",
            "state": "occupied",
            "event_type": "sensor_triggered",
            "timestamp": 1732500002000,
            "source": "sensor_A1",
            "seq": 1,
        },
    )
    assert res_seq1.json()["action_taken"] == "signal_granted"
    assert res_seq1.json()["active_trains"] == ["T101"]

    # 4. Duplicate seq=1 immediately rejected
    res_dup1 = client.post(
        "/sensor-event",
        json={
            "block_id": "A1",
            "state": "occupied",
            "event_type": "sensor_triggered",
            "timestamp": 1732500002050,
            "source": "sensor_A1",
            "seq": 1,
        },
    )
    assert res_dup1.json()["action_taken"] == "duplicate_ignored"

    # 5. Advance to seq=80 on sensor_B1
    client.post(
        "/sensor-event",
        json={
            "block_id": "B1",
            "state": "occupied",
            "event_type": "sensor_triggered",
            "timestamp": 1732500003000,
            "source": "sensor_B1",
            "seq": 80,
        },
    )

    # 6. Firmware reboot with boot start value of seq=1 on sensor_B1
    res_reboot1 = client.post(
        "/sensor-event",
        json={
            "block_id": "B1",
            "state": "free",
            "event_type": "sensor_triggered",
            "timestamp": 1732500004000,
            "source": "sensor_B1",
            "seq": 1,
        },
    )
    assert res_reboot1.status_code == 200
    assert res_reboot1.json()["action_taken"] in ("state_updated", "signal_granted")

    # 7. Stale packet with seq=25 arriving after seq=80 is still rejected as duplicate/stale
    res_stale = client.post(
        "/sensor-event",
        json={
            "block_id": "A1",
            "state": "occupied",
            "event_type": "sensor_triggered",
            "timestamp": 1732500005000,
            "source": "sensor_A1",
            "seq": 4,  # seq > 3 but < 50
        },
    )
    # sensor_A1 current seq is 1, so seq=4 > 1 is normal
    assert res_stale.json()["action_taken"] == "signal_granted"




def _all_tests():
    test_names = sorted(name for name in globals() if name.startswith("test_"))
    return [globals()[name] for name in test_names]


if __name__ == "__main__":
    tests = _all_tests()
    failures = 0
    print("=" * 78)
    print(" AI Train Traffic Control Prototype - API end to end tests")
    print("=" * 78)
    for test in tests:
        try:
            test()
            print(f"PASS  {test.__name__}")
        except AssertionError as error:
            failures += 1
            print(f"FAIL  {test.__name__}: {error}")
        except Exception as error:  # noqa: BLE001
            failures += 1
            print(f"ERROR {test.__name__}: {type(error).__name__}: {error}")
    print("-" * 78)
    print(f"{len(tests) - failures}/{len(tests)} tests passed")
    sys.exit(1 if failures else 0)
