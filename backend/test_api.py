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
