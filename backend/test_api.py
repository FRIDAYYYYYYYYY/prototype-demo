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
from simulator import BOOKED_ORDER, get_state  # noqa: E402

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


def reset_hardware() -> None:
    """Clear the junction hardware state.

    ``/reset`` restores the corridor timetable; the junction has its own state
    (occupancy, per-source ``seq`` counters, decision, event log) and its own
    reset endpoint.  Hardware tests must call both.
    """
    response = client.post("/sensor-event/reset")
    assert response.status_code == 200, response.text


def sensor_event(block_id: str, state: str, seq: int, timestamp: int) -> dict:
    """POST one sensor event exactly as the ESP32 firmware would."""
    response = client.post(
        "/sensor-event",
        json={
            "block_id": block_id,
            "state": state,
            "event_type": "sensor_triggered",
            "timestamp": timestamp,
            "source": f"sensor_{block_id}",
            "seq": seq,
        },
    )
    assert response.status_code == 200, response.text
    return response.json()


def aspects() -> dict:
    """Current signal aspect per logical block, keyed by block id."""
    payload = client.get("/block-state").json()
    return {block["block_id"]: block["signal"] for block in payload["blocks"]}


#: Physical junction A is the freight (T305), B is the express (T101).
#: See backend/hardware_state.py JUNCTION_TRAIN_MAP and docs/hardware_contract.md.
JUNCTION_TRAINS = {"A": "T305", "B": "T101"}


def test_hardware_seq_a_only():
    reset()
    reset_hardware()
    # A1: the freight approaches on the clear junction.
    p1 = sensor_event("A1", "occupied", 1, 1732500000000)
    assert p1["status"] == "accepted"
    assert p1["block_id"] == "A"
    assert p1["train_id"] == JUNCTION_TRAINS["A"]
    # No conflict, so nothing is held and the optimizer is not invoked.
    assert p1["optimizer_triggered"] is False
    assert aspects() == {"A": "PROCEED", "B": "PROCEED"}

    # A2: the freight cleared the junction.
    p2 = sensor_event("A2", "free", 1, 1732500005000)
    assert p2["status"] == "accepted"
    assert aspects() == {"A": "PROCEED", "B": "PROCEED"}
    assert client.get("/block-state").json()["reason"] == (
        "Junction is clear - both approaches are free."
    )


def test_hardware_seq_b_only():
    reset()
    reset_hardware()
    # B1: the express approaches on the clear junction.
    p1 = sensor_event("B1", "occupied", 1, 1732500000000)
    assert p1["status"] == "accepted"
    assert p1["block_id"] == "B"
    assert p1["train_id"] == JUNCTION_TRAINS["B"]
    assert p1["optimizer_triggered"] is False
    assert aspects() == {"A": "PROCEED", "B": "PROCEED"}

    # B2: the express cleared the junction.
    p2 = sensor_event("B2", "free", 1, 1732500005000)
    assert p2["status"] == "accepted"
    assert aspects() == {"A": "PROCEED", "B": "PROCEED"}


def _assert_resolved_conflict(payload: dict, aspects_now: dict) -> None:
    """Shared assertions for a real two-train junction conflict.

    Exactly one approach proceeds and the other is held, the decision came from
    the real CP-SAT engine, and ``/block-state`` agrees with the stored decision.
    """
    decision = payload["decision"]
    assert payload["optimizer_triggered"] is True
    assert decision["conflict"] is True
    assert decision["decision_source"] == "cpsat"
    assert decision["solver"]["engine"] == "Google OR-Tools CP-SAT"
    assert decision["solver"]["status"] in {"OPTIMAL", "FEASIBLE"}
    assert decision["validation"]["valid"] is True
    assert len(decision["proceed"]) == 1
    assert sorted(decision["proceed"] + decision["hold"]) == ["A", "B"]

    # Exactly one HOLD, and it belongs to the approach that was held.
    assert sorted(aspects_now.values()) == ["HOLD", "PROCEED"]
    for block, signal in aspects_now.items():
        expected = "PROCEED" if block in decision["proceed"] else "HOLD"
        assert signal == expected

    reason = client.get("/block-state").json()["reason"]
    assert "CP-SAT" in reason
    assert reason == decision["reason"]


def test_hardware_seq_forward_conflict():
    reset()
    reset_hardware()
    # The freight occupies A1 first.
    assert sensor_event("A1", "occupied", 1, 1732500000000)["status"] == "accepted"
    # The express arrives on B1 before A2 clears -> genuine conflict.
    payload = sensor_event("B1", "occupied", 1, 1732500002000)
    _assert_resolved_conflict(payload, aspects())


def test_hardware_seq_reverse_conflict():
    reset()
    reset_hardware()
    # The express occupies B1 first.
    assert sensor_event("B1", "occupied", 1, 1732500000000)["status"] == "accepted"
    # The freight arrives on A1 before B2 clears -> mirrored conflict.
    payload = sensor_event("A1", "occupied", 1, 1732500002000)
    _assert_resolved_conflict(payload, aspects())


def test_hardware_seq_duplicate_debounce():
    reset()
    reset_hardware()
    # First event from sensor_A1, seq=100.
    assert sensor_event("A1", "occupied", 100, 1732500000000)["status"] == "accepted"

    # A repeated seq is ignored and must not re-run the optimizer.
    duplicate = sensor_event("A1", "occupied", 100, 1732500000100)
    assert duplicate["status"] == "ignored"
    assert duplicate["reason"] == "duplicate_or_stale_seq"
    assert duplicate["optimizer_triggered"] is False

    # A strictly greater seq is accepted.
    nxt = sensor_event("A2", "free", 101, 1732500005000)
    assert nxt["status"] == "accepted"
    assert aspects() == {"A": "PROCEED", "B": "PROCEED"}


def test_esp32_replayed_packet_is_rejected():
    """A replayed/out-of-order packet is ignored, whatever the arrival timing.

    The locked contract makes ``seq`` strictly monotonic per source, so there is
    no time-window heuristic: a ``seq`` at or below the last accepted one is
    always ignored.  This is stricter than a gap-based rule and is what the
    firmware and ``docs/hardware_contract.md`` section 3.2 specify.
    """
    reset()
    reset_hardware()
    assert sensor_event("A1", "occupied", 20, 1732500000000)["status"] == "accepted"

    # Stale packet arriving immediately afterwards.
    stale = sensor_event("A1", "occupied", 10, 1732500000050)
    assert stale["status"] == "ignored"
    assert stale["reason"] == "duplicate_or_stale_seq"
    assert stale["optimizer_triggered"] is False


def test_esp32_reboot_requires_reset_or_epoch_seeded_seq():
    """A rebooting ESP32 restarts its counter, so the contract handles it explicitly.

    Two supported recoveries, both from ``docs/hardware_contract.md``:

    1. seed ``seq`` with ``epoch_ms / 1000`` at boot, which is always above any
       previously accepted value, so no reset is needed; or
    2. POST ``/sensor-event/reset`` after a reflash that changes the scheme.
    """
    reset()
    reset_hardware()
    assert sensor_event("A1", "occupied", 50, 1732500000000)["status"] == "accepted"

    # (1) Epoch-seeded seq from a rebooted board is accepted as a fresh event.
    reboot_seq = 1732500000  # epoch_ms / 1000
    accepted = sensor_event("A2", "free", reboot_seq, 1732500001000)
    assert accepted["status"] == "accepted"
    assert aspects() == {"A": "PROCEED", "B": "PROCEED"}

    # (2) A board that restarts its counter at 0 is correctly REJECTED, because
    # the backend cannot distinguish it from a replay without the reset call.
    reset_hardware()
    assert sensor_event("B1", "occupied", 0, 1732500002000)["status"] == "accepted"
    counter_restart = sensor_event("B1", "occupied", 0, 1732500003000)
    assert counter_restart["status"] == "ignored"
    assert counter_restart["reason"] == "duplicate_or_stale_seq"


def test_esp32_reset_clears_occupancy_and_seq_counters():
    """``/sensor-event/reset`` is the documented recovery after a reflash."""
    reset()
    reset_hardware()
    assert sensor_event("B1", "occupied", 40, 1732500000000)["status"] == "accepted"
    assert get_state().get_active_hardware_trains() != []

    payload = client.post("/sensor-event/reset").json()
    assert payload["status"] == "reset"
    assert get_state().get_active_hardware_trains() == []
    assert aspects() == {"A": "PROCEED", "B": "PROCEED"}

    # After the reset the same low seq is accepted again.
    assert sensor_event("A1", "occupied", 1, 1732500004000)["status"] == "accepted"


def test_simulator_mirror_mapping_matches_the_locked_contract():
    """The persistence mirror must use the SAME junction trains as the contract.

    ``simulator.hardware_state`` feeds only the database mirror, so a silent
    divergence there would persist confident-looking numbers for the wrong
    trains.  This pins the two mappings together.
    """
    from hardware_state import JUNCTION_TRAIN_MAP
    from simulator import get_state

    mirror = get_state().hardware_state
    for block_id, train_id in JUNCTION_TRAIN_MAP.items():
        assert mirror[block_id]["train_id"] == train_id, block_id


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
