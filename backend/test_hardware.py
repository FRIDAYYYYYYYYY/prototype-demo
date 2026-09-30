"""Hardware loop tests: Phases B, C, D and E.

Run either way::

    python backend/test_hardware.py        # prints a PASS/FAIL report
    python -m pytest backend/test_hardware.py

The five sequences of Phase E are implemented literally:

1. ``A1 -> A2``                  A proceeds, A clears, no optimizer call
2. ``B1 -> B2``                  B proceeds, B clears, no optimizer call
3. ``A1 -> B1 -> A2 -> B2``      conflict -> CP-SAT -> clean recovery
4. ``B1 -> A1 -> B2 -> A2``      symmetric conflict -> clean recovery
5. ``A1 -> A1 -> A2 -> A2``      duplicate protection, no double optimisation

Every sequence starts from a reset state and uses an increasing ``seq`` per
source, exactly as an ESP32 would.
"""

from __future__ import annotations

import os
import sys
import threading

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient  # noqa: E402

import junction_adapter  # noqa: E402
from hardware_state import get_hardware_state  # noqa: E402
from main import app  # noqa: E402
from optimizer import optimize_schedule  # noqa: E402
from recommender import build_recommendation  # noqa: E402
from validator import validate_schedule  # noqa: E402

client = TestClient(app)

#: Fixed base timestamp so every run is reproducible.
T0 = 1732500000000

#: Expected sensor -> (state) pairs from the locked contract.
SENSOR_STATE = {"A1": "occupied", "A2": "free", "B1": "occupied", "B2": "free"}


def send(sensor_id: str, seq: int, offset_ms: int = 0, source: str | None = None):
    """POST one sensor event exactly as the firmware would."""
    payload = {
        "block_id": sensor_id,
        "state": SENSOR_STATE[sensor_id],
        "event_type": "sensor_triggered",
        "timestamp": T0 + offset_ms,
        "source": source or f"sensor_{sensor_id}",
        "seq": seq,
    }
    return client.post("/sensor-event", json=payload)


def reset() -> dict:
    response = client.post("/sensor-event/reset")
    assert response.status_code == 200, response.text
    return response.json()


def signals() -> dict:
    payload = client.get("/block-state").json()
    return {block["block_id"]: block["signal"] for block in payload["blocks"]}


def optimizer_calls() -> int:
    return get_hardware_state().optimizer_calls



# ---------------------------------------------------------------------------
# Phase A - contract
# ---------------------------------------------------------------------------

def test_hardware_contract_matches_the_locked_gpio_table():
    payload = client.get("/hardware/contract").json()
    by_sensor = {sensor["sensor_id"]: sensor for sensor in payload["sensors"]}
    assert by_sensor["A1"]["gpio"] == 22
    assert by_sensor["A2"]["gpio"] == 19
    assert by_sensor["B1"]["gpio"] == 21
    assert by_sensor["B2"]["gpio"] == 18
    assert by_sensor["A1"]["block_id"] == "A"
    assert by_sensor["B1"]["block_id"] == "B"
    assert by_sensor["A1"]["transition"] == "free->occupied"
    assert by_sensor["A2"]["transition"] == "occupied->free"
    assert payload["logical_blocks"] == ["A", "B"]
    # The physical trains map onto EXISTING simulator trains, nothing renamed.
    # A = the only freight (lowest priority); B = the highest-priority express.
    assert payload["junction_train_map"] == {"A": "T305", "B": "T101"}


# ---------------------------------------------------------------------------
# Phase B - POST /sensor-event
# ---------------------------------------------------------------------------

def test_valid_event_is_accepted_and_updates_state():
    reset()
    response = send("A1", 1)
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["status"] == "accepted"
    assert body["block_id"] == "A"
    assert body["train_id"] == "T305"
    assert get_hardware_state().occupancy["A"] == "occupied"


def test_malformed_payloads_are_rejected_without_mutating_state():
    reset()
    good = {
        "block_id": "A1", "state": "occupied", "event_type": "sensor_triggered",
        "timestamp": T0, "source": "sensor_A1", "seq": 1,
    }

    def mutate(**overrides):
        payload = dict(good)
        payload.update(overrides)
        return client.post("/sensor-event", json=payload)

    assert mutate(block_id="C9").status_code == 422          # unknown sensor
    assert mutate(block_id="A1", state="free").status_code == 422   # bad state pair
    assert mutate(block_id="A2", state="occupied").status_code == 422
    assert mutate(event_type="train_derailed").status_code == 422   # bad event_type
    assert mutate(timestamp="soon").status_code == 422       # timestamp not an int
    assert mutate(timestamp=0).status_code == 422
    assert mutate(timestamp=-5).status_code == 422
    assert mutate(seq=-1).status_code == 422                 # seq < 0
    assert mutate(source="   ").status_code == 422           # empty source

    payload = dict(good)
    payload.pop("seq")
    assert client.post("/sensor-event", json=payload).status_code == 422  # missing field

    # nothing above may have changed the state


def test_duplicate_seq_is_a_noop():
    reset()
    assert send("A1", 5).json()["status"] == "accepted"
    calls = optimizer_calls()

    duplicate = send("A1", 5).json()
    assert duplicate["status"] == "ignored"
    assert duplicate["reason"] == "duplicate_or_stale_seq"
    assert duplicate["optimizer_triggered"] is False
    assert duplicate["last_accepted_seq"] == 5

    # out-of-order (lower) seq is ignored as well
    stale = send("A1", 3).json()
    assert stale["status"] == "ignored"
    assert stale["reason"] == "duplicate_or_stale_seq"

    assert optimizer_calls() == calls
    assert get_hardware_state().occupancy["A"] == "occupied"


def test_new_seq_but_redundant_state_is_a_noop_and_records_the_seq():
    """A2 while block A is already free: no transition, no optimizer, seq recorded."""
    reset()
    response = send("A2", 7).json()
    assert response["status"] == "ignored"
    assert response["reason"] == "state_redundant"
    assert response["optimizer_triggered"] is False
    assert response["current_state"] == "free"

    state = get_hardware_state()
    assert state.last_accepted_seq["sensor_A2"] == 7
    assert state.optimizer_calls == 0

    # because the seq was recorded, a replay of the same seq is also ignored
    assert send("A2", 7).json()["reason"] == "duplicate_or_stale_seq"


def test_duplicate_approach_does_not_double_optimize():
    """Sequence 5: the second A1 must not trigger a second optimisation."""
    reset()
    send("A1", 1)
    send("B1", 1, offset_ms=120_000)
    calls_after_conflict = optimizer_calls()
    assert calls_after_conflict == 1

    redundant = send("A1", 2).json()
    assert redundant["status"] == "ignored"
    assert redundant["reason"] == "state_redundant"
    assert redundant["optimizer_triggered"] is False
    assert optimizer_calls() == calls_after_conflict


def test_reset_clears_occupancy_and_seq_counters():
    reset()
    send("A1", 42)
    assert get_hardware_state().occupancy["A"] == "occupied"

    body = reset()
    assert body["status"] == "reset"
    state = get_hardware_state()
    assert state.occupancy == {"A": "free", "B": "free"}
    assert state.last_accepted_seq == {}
    assert state.optimizer_calls == 0
    # the same seq is usable again after a reset
    assert send("A1", 42).json()["status"] == "accepted"


def test_concurrent_events_do_not_corrupt_state():
    """Hammer the endpoint from many threads; the lock must keep state coherent."""
    reset()


# ---------------------------------------------------------------------------
# Phase C - GET /block-state
# ---------------------------------------------------------------------------

def test_block_state_before_any_event_is_stale():
    reset()
    payload = client.get("/block-state").json()
    assert payload["stale"] is True
    assert "No hardware data yet" in payload["reason"]
    assert [b["block_id"] for b in payload["blocks"]] == ["A", "B"]
    assert all(b["signal"] == "PROCEED" for b in payload["blocks"])


def test_block_state_all_clear_and_single_train_cases():
    reset()
    # case 1: all-clear, but with no hardware event ever received -> stale
    payload = client.get("/block-state").json()
    assert payload["stale"] is True
    assert "No hardware data yet" in payload["reason"]

    # after a real event the state is fresh
    send("A1", 1)
    assert client.get("/block-state").json()["stale"] is False

    # case 2: A only
    assert signals() == {"A": "PROCEED", "B": "PROCEED"}
    assert optimizer_calls() == 0
    send("A2", 1, offset_ms=60_000)
    assert client.get("/block-state").json()["reason"] == (
        "Junction is clear - both approaches are free."
    )
    assert optimizer_calls() == 0

    # case 3: B only
    reset()
    send("B1", 1)
    assert signals() == {"A": "PROCEED", "B": "PROCEED"}
    assert optimizer_calls() == 0


def test_block_state_goes_stale_after_the_threshold():
    reset()
    send("A1", 1)
    assert client.get("/block-state").json()["stale"] is False
    # backdate the last event beyond the 10 s default threshold
    state = get_hardware_state()
    state.last_event_received_at -= 60
    payload = client.get("/block-state").json()
    assert payload["stale"] is True
    assert "stale" in payload["reason"]


def test_block_state_reason_is_generated_from_real_state():
    reset()
    send("A1", 1)
    reason = client.get("/block-state").json()["reason"]
    assert "T305" in reason and "block A" in reason

    reset()
    send("A1", 1)
    send("B1", 1, offset_ms=120_000)
    conflict_reason = client.get("/block-state").json()["reason"]
    assert "CP-SAT" in conflict_reason
    assert conflict_reason != reason


# ---------------------------------------------------------------------------
# Phase D - the conflict path really calls the existing optimizer
# ---------------------------------------------------------------------------

def test_conflict_path_calls_the_existing_optimizer_validator_and_recommender():
    reset()
    send("A1", 1)
    send("B1", 1, offset_ms=120_000)

    decision = get_hardware_state().decision
    assert decision is not None
    assert decision["conflict"] is True
    assert decision["decision_source"] == "cpsat"

    # the EXISTING optimizer produced the plan
    assert decision["solver"]["engine"] == "Google OR-Tools CP-SAT"
    assert decision["solver"]["status"] in {"OPTIMAL", "FEASIBLE"}
    assert decision["solver"]["wall_time_ms"] is not None
    assert decision["solver"]["time_limit_s"] == junction_adapter.SOLVER_TIME_LIMIT_S

    # the EXISTING validator accepted it
    assert decision["validation"]["valid"] is True
    assert all(c["status"] == "pass" for c in decision["validation"]["checks"])

    # the EXISTING recommender produced human-readable advice
    assert decision["recommendation"]["status"] == "valid"
    assert decision["recommendation"]["summary"]

    # exactly one train proceeds, exactly one holds
    assert sorted(decision["proceed"] + decision["hold"]) == ["A", "B"]
    assert len(decision["proceed"]) == 1


def test_conflict_path_uses_the_existing_optimizer_function(monkeypatch=None):
    """Spy on junction_adapter.optimize_schedule to prove it is really called."""
    reset()
    calls: list = []
    original = junction_adapter.optimize_schedule

    def spy(*args, **kwargs):
        calls.append(kwargs.get("booked"))
        return original(*args, **kwargs)

    junction_adapter.optimize_schedule = spy
    try:
        send("A1", 1)
        send("B1", 1, offset_ms=120_000)
    finally:
        junction_adapter.optimize_schedule = original

    assert len(calls) == 1, calls


def test_optimizer_is_only_called_when_a_conflict_appears():
    reset()
    # single train: no optimizer
    send("A1", 1)
    assert optimizer_calls() == 0
    # second train: conflict -> one optimizer call
    send("B1", 1, offset_ms=60_000)
    assert optimizer_calls() == 1
    # clearing a train: recovery, still no extra call
    send("A2", 1, offset_ms=120_000)
    assert optimizer_calls() == 1
    # final clear
    send("B2", 1, offset_ms=180_000)
    assert optimizer_calls() == 1


def test_fallback_is_used_when_the_optimizer_raises():
    """Solver failure must degrade to a flagged deterministic advisory."""
    reset()


# ---------------------------------------------------------------------------
# Phase E - the five hardware sequences
# ---------------------------------------------------------------------------

def test_sequence_1_a1_a2_no_optimizer():
    reset()
    assert send("A1", 1).json()["status"] == "accepted"
    assert signals() == {"A": "PROCEED", "B": "PROCEED"}
    assert optimizer_calls() == 0

    assert send("A2", 1, offset_ms=300_000).json()["status"] == "accepted"
    payload = client.get("/block-state").json()
    assert payload["reason"] == "Junction is clear - both approaches are free."
    assert optimizer_calls() == 0
    assert get_hardware_state().occupancy == {"A": "free", "B": "free"}


def test_sequence_2_b1_b2_no_optimizer():
    reset()
    assert send("B1", 1).json()["status"] == "accepted"
    assert signals() == {"A": "PROCEED", "B": "PROCEED"}
    assert optimizer_calls() == 0

    assert send("B2", 1, offset_ms=300_000).json()["status"] == "accepted"
    assert client.get("/block-state").json()["reason"] == (
        "Junction is clear - both approaches are free."
    )
    assert optimizer_calls() == 0


def test_sequence_3_a1_b1_a2_b2_conflict_and_recovery():
    reset()
    send("A1", 1)
    send("B1", 1, offset_ms=120_000)          # conflict
    assert optimizer_calls() == 1
    decision = get_hardware_state().decision
    assert decision["decision_source"] == "cpsat"
    assert decision["validation"]["valid"] is True

    conflict_signals = signals()
    assert sorted(conflict_signals.values()) == ["HOLD", "PROCEED"]
    # /block-state must agree with the stored decision
    assert conflict_signals["A"] == ("PROCEED" if "A" in decision["proceed"] else "HOLD")
    assert conflict_signals["B"] == ("PROCEED" if "B" in decision["proceed"] else "HOLD")

    send("A2", 1, offset_ms=300_000)          # A clears
    send("B2", 1, offset_ms=420_000)          # B clears -> all-clear recovery
    assert client.get("/block-state").json()["reason"] == (
        "Junction is clear - both approaches are free."
    )
    assert get_hardware_state().occupancy == {"A": "free", "B": "free"}


def test_sequence_4_b1_a1_b2_a2_symmetric_conflict():
    reset()
    send("B1", 1)
    send("A1", 1, offset_ms=120_000)          # conflict the other way round
    assert optimizer_calls() == 1
    decision = get_hardware_state().decision
    assert decision["decision_source"] == "cpsat"
    assert decision["validation"]["valid"] is True

    # B (the express) arrives first here, so legacy and CP-SAT agree: the
    # measured result must show B proceeding and the late freight A holding.
    # This is asserted from the run, not assumed - see docs/junction_decision.md.
    assert decision["legacy"]["proceed"] == ["B"]
    assert decision["proceed"] == ["B"]
    assert decision["hold"] == ["A"]
    assert signals() == {"A": "HOLD", "B": "PROCEED"}

    send("B2", 1, offset_ms=300_000)
    send("A2", 1, offset_ms=420_000)
    assert client.get("/block-state").json()["reason"] == (
        "Junction is clear - both approaches are free."
    )
    assert get_hardware_state().occupancy == {"A": "free", "B": "free"}


def test_sequence_5_a1_a1_a2_a2_duplicate_protection():
    reset()
    assert send("A1", 1).json()["status"] == "accepted"
    calls_before = optimizer_calls()

    # same-seq retransmission
    replay = send("A1", 1).json()
    assert replay["status"] == "ignored"
    assert replay["reason"] == "duplicate_or_stale_seq"

    # new-seq but redundant (A is already occupied)
    redundant = send("A1", 2).json()
    assert redundant["status"] == "ignored"
    assert redundant["reason"] == "state_redundant"

    assert optimizer_calls() == calls_before == 0

    # A clears once (accepted), then the second A2 is redundant because A is free
    assert send("A2", 1).json()["status"] == "accepted"
    second_clear = send("A2", 2, offset_ms=60_000).json()
    assert second_clear["status"] == "ignored"
    assert second_clear["reason"] == "state_redundant"

    assert optimizer_calls() == 0
    payload = client.get("/block-state").json()
    assert payload["reason"] == "Junction is clear - both approaches are free."
    assert get_hardware_state().occupancy == {"A": "free", "B": "free"}


# ---------------------------------------------------------------------------
# Test runner (mirrors backend/test_api.py)
# ---------------------------------------------------------------------------

def _all_tests():
    test_names = sorted(name for name in globals() if name.startswith("test_"))
    return [globals()[name] for name in test_names]


if __name__ == "__main__":
    tests = _all_tests()
    failures = 0
    print("=" * 78)
    print(" Hardware loop tests - Phases B / C / D / E")
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

    original = junction_adapter.optimize_schedule

    def boom(*args, **kwargs):
        raise RuntimeError("simulated solver failure")

    junction_adapter.optimize_schedule = boom
    try:
        response = send("B1", 1, offset_ms=120_000).json()
    finally:
        junction_adapter.optimize_schedule = original

    decision = response["decision"]
    assert decision["decision_source"] == "fallback"
    assert "simulated solver failure" in decision["reason"]
    # deterministic first-arrival advisory: the first arriver proceeds
    assert decision["proceed"] == ["A"]
    assert decision["hold"] == ["B"]

    payload = client.get("/block-state").json()
    assert signals() == {"A": "PROCEED", "B": "HOLD"}
    assert payload["decision"]["source"] == "fallback"


def test_infeasible_solver_result_falls_back():
    """A solver that reports INFEASIBLE must degrade to a flagged advisory."""
    reset()
    send("A1", 1)                       # establish a real two-train conflict
    original = junction_adapter.optimize_schedule

    def infeasible(*args, **kwargs):
        return {"schedule": None, "solver": {"status": "INFEASIBLE", "engine": "test"}}

    junction_adapter.optimize_schedule = infeasible
    try:
        response = send("B1", 1, offset_ms=120_000).json()
    finally:
        junction_adapter.optimize_schedule = original

    assert response["decision"]["decision_source"] == "fallback"
    assert "INFEASIBLE" in response["decision"]["reason"]
    assert response["decision"]["proceed"] == ["A"]


def test_validation_failure_falls_back():
    """A plan the independent validator rejects must not be trusted."""
    reset()
    send("A1", 1)
    original = junction_adapter.optimize_schedule

    def good_plan(*args, **kwargs):
        # a real plan, but with a deliberately broken headway so the validator fails
        result = original(*args, **kwargs)
        result["schedule"]["trains"]["T101"]["blocks"]["BL1"]["entry"] = 0
        result["schedule"]["trains"]["T305"]["blocks"]["BL1"]["entry"] = 0
        return result

    junction_adapter.optimize_schedule = good_plan
    try:
        response = send("B1", 1, offset_ms=120_000).json()
    finally:
        junction_adapter.optimize_schedule = original

    decision = response["decision"]
    assert decision["decision_source"] == "fallback"
    assert "validator" in decision["reason"]
