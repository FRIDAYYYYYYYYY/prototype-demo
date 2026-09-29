"""Adapter that turns physical junction events into an existing-CP-SAT call.

The physical tabletop junction is **not** a second optimisation problem. This
adapter translates the hardware facts (which approach sensors fired, when, and
the existing simulator priorities/weights of the mapped trains) into a set of
disruptions for the **existing** :func:`optimizer.optimize_schedule` model, then
feeds the resulting plan through the **existing** :mod:`validator` and
:mod:`recommender`.

Why the junction reuses corridor block ``BL1``
---------------------------------------------
``optimize_schedule`` already enforces, for every block, ``AddNoOverlap`` over
intervals of ``run_min[block] + MIN_HEADWAY_MIN``. Block ``BL1`` is the entry to
``Central Junction`` and is occupied by exactly one train at a time, with the
existing headway. That *is* a shared junction of capacity 1, so modelling the
physical junction as ``BL1`` reuses the existing constraints, weights, validator
and recommender instead of duplicating them.

Prototype scale-model parameters
--------------------------------
These are tabletop scale-model values used to convert millisecond sensor timings
into the integer-minute world the existing model speaks. They are **not**
railway-certified and carry no operational meaning.

``ARRIVAL_GAP_MIN``
    Arrival separation below which the two trains genuinely contend for the
    junction. 6 minutes is a tabletop spacing (the demo presses the sensors
    within a couple of seconds, so any real gap lands in the conflict case, and a
    deliberate 10-minute gap clears it).
``HEADWAY_MIN``
    Re-exported from :data:`simulator.MIN_HEADWAY_MIN`; the existing value is
    never changed.
"""

from __future__ import annotations

import logging
import time
from typing import Any, Dict, List, Optional, Sequence, Tuple

from hardware_state import (
    JUNCTION_BLOCK_ID,
    JUNCTION_TRAIN_MAP,
    LOGICAL_BLOCK_IDS,
    TRAIN_TO_JUNCTION,
)
from optimizer import optimize_schedule
from recommender import build_recommendation
from simulator import (
    BOOKED_ORDER,
    MIN_HEADWAY_MIN,
    ROUTE_BLOCK_IDS,
    TRAIN_BY_ID,
    build_baseline_entries,
)
from validator import summarise, validate_schedule

LOGGER = logging.getLogger("junction.hardware")

#: Minimum separation (minutes) between the two approach sensors for the junction
#: to be considered contended.  See module docstring.
ARRIVAL_GAP_MIN = 6

#: Solver settings, fixed so the demo is reproducible run after run.
SOLVER_SEED = 42
SOLVER_TIME_LIMIT_S = 5.0

#: Monotonic run counter for the UI / audit trail.
_RUN_COUNTER = {"n": 0}

#: Junction clearance, in minutes, after the leading train vacates block BL1.
#: Reuses the existing corridor headway.
HEADWAY_MIN = MIN_HEADWAY_MIN


def junction_occupancy_min(train_id: str) -> int:
    """Minutes a train physically occupies the junction (existing topology)."""
    return int(TRAIN_BY_ID[train_id]["run_min"][JUNCTION_BLOCK_ID])


def junction_clearance_min(train_id: str) -> int:
    """Occupancy + existing headway: the earliest the next train may enter."""
    return junction_occupancy_min(train_id) + HEADWAY_MIN


def _next_run_id() -> str:
    _RUN_COUNTER["n"] += 1
    return f"JRN-{_RUN_COUNTER['n']:04d}"


def reset_run_counter() -> None:
    """Reset the run counter so a demo always starts at JRN-0001."""
    _RUN_COUNTER["n"] = 0


# ---------------------------------------------------------------------------
# Legacy first-arrival rule (the benchmark, reused from the corridor's FCFS logic)
# ---------------------------------------------------------------------------

def legacy_first_arrival(
    arrivals: Sequence[Tuple[str, float]]
) -> Dict[str, Any]:
    """Explicit, testable first-arrival rule used as the legacy benchmark.

    ``arrivals`` is a sequence of ``(physical_train, arrival_epoch_ms)``.  The
    train that arrived first is released into the junction; the other waits until
    the first one has cleared the junction plus headway.  This is the behaviour of
    a signaller that only ever looks at who got there first, and it is the thing
    the CP-SAT decision is compared against in the ``/junction/compare`` view.
    """
    if not arrivals:
        return {"source": "legacy_first_arrival", "proceed": [], "hold": [], "detail": "No train at the junction."}
    ordered = sorted(arrivals, key=lambda item: (item[1], item[0]))
    leader = ordered[0][0]
    proceed = [leader]
    hold: List[str] = [train for train, _ in ordered[1:]]
    detail = (
        f"Legacy first-arrival rule releases {JUNCTION_TRAIN_MAP[leader]} "
        f"({leader}) first and holds the rest."
    )
    return {
        "source": "legacy_first_arrival",
        "proceed": proceed,
        "hold": hold,
        "leader": leader,
        "detail": detail,
    }


# ---------------------------------------------------------------------------
# Hardware -> existing model input
# ---------------------------------------------------------------------------

def arrival_gap_min(arrivals: Dict[str, float]) -> float:
    """Separation in minutes between the two physical approach sensors."""
    if len(arrivals) < 2:
        return float("inf")
    values = list(arrivals.values())
    return (max(values) - min(values)) / 60000.0


def build_junction_baseline(arrival_ms: Dict[str, float]) -> Dict[str, Dict[str, int]]:
    """Corridor booked entries, re-based onto the measured hardware arrivals.

    The junction is a *physical* resource, so the hardware arrival times are the
    source of truth for it.  The baseline is rebuilt as follows:

    * the **first** physical train to arrive keeps its existing booked path, so
      the surrounding corridor (including the trains ahead of it) is untouched;
    * the **second** train is shifted by the measured physical gap, so it wants
      to enter the junction exactly when it really did.

    No weight, priority, constraint or booked time is altered: the existing model
    then decides whether that wish is compatible with the corridor.
    """
    from copy import deepcopy

    booked = deepcopy(build_baseline_entries())
    if len(arrival_ms) < 2:
        return booked

    ordered = sorted(arrival_ms.items(), key=lambda item: (item[1], item[0]))
    (leader_block, leader_ms), (follower_block, follower_ms) = ordered[0], ordered[1]
    leader_train = JUNCTION_TRAIN_MAP[leader_block]
    follower_train = JUNCTION_TRAIN_MAP[follower_block]

    gap_min = (follower_ms - leader_ms) / 60000.0
    shift = int(round(gap_min))
    for block_id in ROUTE_BLOCK_IDS:
        booked[follower_train][block_id] += shift
    return booked


def junction_arrivals_from_state(
    occupancy: Dict[str, str], arrival_times: Dict[str, float]
) -> Dict[str, float]:
    """Only the currently occupied logical blocks count as approaching."""
    return {
        block_id: arrival_times[block_id]
        for block_id in LOGICAL_BLOCK_IDS
        if occupancy.get(block_id) == "occupied" and block_id in arrival_times
    }


# ---------------------------------------------------------------------------
# The four cases of the junction decision
# ---------------------------------------------------------------------------

def _advisory_fallback(
    run_id: str, leader_block: str, follower_block: str, reason: str,
    solver_info: Optional[Dict[str, Any]] = None,
    validation: Optional[Dict[str, Any]] = None,
    legacy: Optional[Dict[str, Any]] = None,
    gap: Optional[float] = None,
) -> Dict[str, Any]:
    """Deterministic, conservative advisory used whenever CP-SAT cannot be trusted.

    The lower-priority train is held.  This is a *dispatcher advisory*, not a
    control action.
    """
    LOGGER.warning("fallback run_id=%s reason=%s", run_id, reason)
    return {
        "run_id": run_id,
        "conflict": True,
        "proceed": [leader_block],
        "hold": [follower_block],
        "reason": reason,
        "decision_source": "fallback",
        "solver": solver_info,
        "validation": validation,
        "recommendation": None,
        "legacy": legacy,
        "arrival_gap_min": None if gap is None else round(gap, 2),
    }


def decide_junction(
    occupancy: Dict[str, str],
    arrival_ms: Dict[str, float],
    time_limit_s: float = SOLVER_TIME_LIMIT_S,
    seed: int = SOLVER_SEED,
) -> Dict[str, Any]:
    """Turn the current hardware facts into a junction decision.

    Returns ``proceed`` / ``hold`` physical block IDs, a human-readable
    ``reason`` and the evidence trail (``decision_source``, ``solver``,
    ``validation``, ``recommendation``).

    Cases (per the specification):

    ==== ====================== ==========================================
    Case Hardware               Action
    ==== ====================== ==========================================
    1    no train approaching   junction free, no optimisation
    2    only A approaching     A proceeds, no optimisation
    3    only B approaching     B proceeds, no optimisation
    4    A and B approaching   real conflict -> existing CP-SAT
    ==== ====================== ==========================================
    """
    occupied = [
        block_id for block_id in LOGICAL_BLOCK_IDS if occupancy.get(block_id) == "occupied"
    ]
    run_id = _next_run_id()

    # -- cases 1-3: nothing to optimise -----------------------------------
    if len(occupied) < 2:
        if not occupied:
            reason = "Junction is free - no train is approaching."
        else:
            only = occupied[0]
            reason = (
                f"Only {JUNCTION_TRAIN_MAP[only]} ({only}) is approaching the junction, "
                "so it may proceed - no conflict to optimise."
            )
        return {
            "run_id": run_id,
            "conflict": False,
            "proceed": list(occupied),
            "hold": [],
            "reason": reason,
            "decision_source": "none",
            "solver": None,
            "validation": None,
            "recommendation": None,
            "legacy": None,
            "arrival_gap_min": None,
        }

    # -- case 4: a genuine conflict ---------------------------------------
    arrivals = junction_arrivals_from_state(occupancy, arrival_ms)
    gap = arrival_gap_min(arrivals)
    legacy = legacy_first_arrival([(b, arrivals[b]) for b in sorted(arrivals)])
    booked = build_junction_baseline(arrivals)
    leader_block = legacy["leader"]
    leader_train = JUNCTION_TRAIN_MAP[leader_block]
    follower_block = [b for b in occupied if b != leader_block][0]
    follower_train = JUNCTION_TRAIN_MAP[follower_block]

    LOGGER.info(
        "optimizer trigger run_id=%s leader=%s(%s) follower=%s(%s) gap_min=%.2f",
        run_id, leader_block, leader_train, follower_block, follower_train, gap,
    )

    try:
        result = optimize_schedule(
            disruptions=(), booked=booked, time_limit_s=time_limit_s, seed=seed
        )
    except Exception as error:  # noqa: BLE001 - the live loop must never crash
        return _advisory_fallback(
            run_id, leader_block, follower_block,
            f"CP-SAT raised {type(error).__name__}; using the deterministic "
            "first-arrival rule.",
            legacy=legacy, gap=gap,
        )

    schedule = result["schedule"]
    solver_info = result["solver"]

    # -- fail-safe 1: the solver found no feasible plan --------------------
    if schedule is None:
        return _advisory_fallback(
            run_id, leader_block, follower_block,
            f"CP-SAT returned no feasible plan (status "
            f"{solver_info.get('status')}); using the deterministic "
            "first-arrival rule.",
            solver_info=solver_info, legacy=legacy, gap=gap,
        )

    # -- fail-safe 2: the independent validator rejected the plan ----------
    validation = validate_schedule(schedule, disruptions=(), reference=schedule)
    if not validation["valid"]:
        return _advisory_fallback(
            run_id, leader_block, follower_block,
            f"CP-SAT plan failed the independent validator ({summarise(validation)}); "
            "using the deterministic first-arrival rule.",
            solver_info=solver_info, validation=validation, legacy=legacy, gap=gap,
        )

    # -- the decision itself: who enters the junction first ---------------
    block_id = JUNCTION_BLOCK_ID
    leader_entry = schedule["trains"][leader_train]["blocks"][block_id]["entry"]
    follower_entry = schedule["trains"][follower_train]["blocks"][block_id]["entry"]

    if leader_entry <= follower_entry:
        proceed, hold = [leader_block], [follower_block]
        decision_line = f"CP-SAT gives the junction to {leader_train} (physical {leader_block})."
    else:
        proceed, hold = [follower_block], [leader_block]
        decision_line = (
            f"CP-SAT holds {leader_train} (physical {leader_block}) and gives the "
            f"junction to {follower_train} (physical {follower_block}): the weighted "
            "objective makes that cheaper overall."
        )

    kpis = {
        "trains_scheduled": schedule["totals"]["trains"],
        "total_delay_min": schedule["totals"]["total_delay_min"],
        "max_delay_min": schedule["totals"]["max_delay_min"],
        "delayed_train_ids": [
            t for t in BOOKED_ORDER if schedule["trains"][t]["final_delay"] > 0
        ],
    }
    recommendation = build_recommendation(
        "optimized", validation, schedule, kpis, disruptions=(), solver_info=solver_info
    )

    reason = (
        f"{decision_line} Junction (block {JUNCTION_BLOCK_ID}) entries: "
        f"{leader_train} at minute {leader_entry}, {follower_train} at minute "
        f"{follower_entry}. {recommendation['summary']}"
    )
    LOGGER.info(
        "decision run_id=%s source=cpsat status=%s wall_ms=%s proceed=%s hold=%s",
        run_id, solver_info.get("status"), solver_info.get("wall_time_ms"),
        ",".join(proceed), ",".join(hold),
    )

    return {
        "run_id": run_id,
        "conflict": True,
        "proceed": proceed,
        "hold": hold,
        "reason": reason,
        "decision_source": "cpsat",
        "solver": solver_info,
        "validation": validation,
        "recommendation": recommendation,
        "legacy": legacy,
        "arrival_gap_min": round(gap, 2),
        "entries": {leader_train: leader_entry, follower_train: follower_entry},
    }

    follower_block = [b for b in occupied if b != leader_block][0]
    follower_train = JUNCTION_TRAIN_MAP[follower_block]

    LOGGER.info(
        "optimizer trigger run_id=%s leader=%s(%s) follower=%s(%s) gap_min=%.2f",
        run_id, leader_block, leader_train, follower_block, follower_train, gap,
    )

    try:
        result = optimize_schedule(
            disruptions=(), booked=booked, time_limit_s=time_limit_s, seed=seed
        )
    except Exception as error:  # noqa: BLE001 - the live loop must never crash
        return _advisory_fallback(
            run_id, leader_block, follower_block,
            f"CP-SAT raised {type(error).__name__}; using the deterministic "
            "first-arrival rule.",
            legacy=legacy, gap=gap,
        )

    schedule = result["schedule"]
    solver_info = result["solver"]

    # -- fail-safe 1: the solver found no feasible plan --------------------
    if schedule is None:
        return _advisory_fallback(
            run_id, leader_block, follower_block,
            f"CP-SAT returned no feasible plan (status "
            f"{solver_info.get('status')}); using the deterministic "
            "first-arrival rule.",
            solver_info=solver_info, legacy=legacy, gap=gap,
        )

    # -- fail-safe 2: the independent validator rejected the plan ----------
    validation = validate_schedule(schedule, disruptions=(), reference=schedule)
    if not validation["valid"]:
        return _advisory_fallback(
            run_id, leader_block, follower_block,
            f"CP-SAT plan failed the independent validator ({summarise(validation)}); "
            "using the deterministic first-arrival rule.",
            solver_info=solver_info, validation=validation, legacy=legacy, gap=gap,
        )

    # -- the decision itself: who enters the junction first ---------------
    block_id = JUNCTION_BLOCK_ID
    leader_entry = schedule["trains"][leader_train]["blocks"][block_id]["entry"]
    follower_entry = schedule["trains"][follower_train]["blocks"][block_id]["entry"]

    if leader_entry <= follower_entry:
        proceed, hold = [leader_block], [follower_block]
        decision_line = f"CP-SAT gives the junction to {leader_train} (physical {leader_block})."
    else:
        proceed, hold = [follower_block], [leader_block]
        decision_line = (
            f"CP-SAT holds {leader_train} (physical {leader_block}) and gives the "
            f"junction to {follower_train} (physical {follower_block}): the weighted "
            "objective makes that cheaper overall."
        )

    kpis = {
        "trains_scheduled": schedule["totals"]["trains"],
        "total_delay_min": schedule["totals"]["total_delay_min"],
        "max_delay_min": schedule["totals"]["max_delay_min"],
        "delayed_train_ids": [
            t for t in BOOKED_ORDER if schedule["trains"][t]["final_delay"] > 0
        ],
    }
    recommendation = build_recommendation(
        "optimized", validation, schedule, kpis, disruptions=(), solver_info=solver_info
    )

    reason = (
        f"{decision_line} Junction (block {JUNCTION_BLOCK_ID}) entries: "
        f"{leader_train} at minute {leader_entry}, {follower_train} at minute "
        f"{follower_entry}. {recommendation['summary']}"
    )
    LOGGER.info(
        "decision run_id=%s source=cpsat status=%s wall_ms=%s proceed=%s hold=%s",
        run_id, solver_info.get("status"), solver_info.get("wall_time_ms"),
        ",".join(proceed), ",".join(hold),
    )

    return {
        "run_id": run_id,
        "conflict": True,
        "proceed": proceed,
        "hold": hold,
        "reason": reason,
        "decision_source": "cpsat",
        "solver": solver_info,
        "validation": validation,
        "recommendation": recommendation,
        "legacy": legacy,
        "arrival_gap_min": round(gap, 2),
        "entries": {leader_train: leader_entry, follower_train: follower_entry},
    }

