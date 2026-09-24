"""CP-SAT re-planning model for the single corridor prototype.

Problem
-------
Given the booked timetable and the active disruptions, find the conflict free
plan that minimises the weighted delay of the corridor.

Model
-----
* variable ``entry[t][b]``  -- integer minute at which train ``t`` enters block ``b``
  (lower bound = booked entry, optionally pushed by a signal delay)
* chain constraints        -- ``entry[t][b+1] >= entry[t][b] + run + min_dwell``
  (station stops may be shortened to :data:`MIN_DWELL_MIN` but trains can also be
  held up to :data:`MAX_HOLD_MIN` when the next block is not clear)
* ``AddNoOverlap``         -- block occupancy intervals of ``run + headway``
  minutes give mutual exclusion *and* the minimum headway in one constraint
* running order            -- ``entry`` order is forced to follow the booked order
  (no overtaking on a single line)
* possession windows       -- a reified disjunction forces every train either to
  clear the block before the window or to enter after it

Objective
---------
``sum_t weight_t * (1000 * delay_at_terminus_t + sum_b (entry - booked_entry))``
so the passenger weighted punctuality at the terminus dominates, and the
secondary term (which only breaks ties) prefers holding a train as late as
possible instead of idling it early in its run.
"""

from __future__ import annotations

from typing import Any, Dict, Optional, Sequence

from ortools.sat.python import cp_model

from simulator import (
    BOOKED_ORDER,
    HORIZON_MIN,
    MAX_HOLD_MIN,
    MIN_DWELL_MIN,
    MIN_HEADWAY_MIN,
    ROUTE_BLOCK_IDS,
    STATIONS,
    TRAINS,
    build_baseline_entries,
    schedule_from_entries,
    signal_delay_bound,
)

#: Relative importance of one minute of delay at the terminus.
TERMINUS_DELAY_WEIGHT = 1000


def _entry_upper_bound(booked_entry: int) -> int:
    return max(HORIZON_MIN, booked_entry + MAX_HOLD_MIN)


def optimize_schedule(
    disruptions: Sequence[Dict[str, Any]] = (),
    booked: Optional[Dict[str, Dict[str, int]]] = None,
    time_limit_s: float = 8.0,
    seed: int = 42,
) -> Dict[str, Any]:
    """Solve the corridor re-planning problem.

    Returns ``{"schedule": <schedule or None>, "solver": {...}}``.
    """
    booked = build_baseline_entries() if booked is None else booked
    model = cp_model.CpModel()

    # -- decision variables -------------------------------------------------
    entry: Dict[Any, Any] = {}
    for train in TRAINS:
        train_id = train["id"]
        for block_id in ROUTE_BLOCK_IDS:
            booked_entry = booked[train_id][block_id]
            lower = max(
                booked_entry,
                signal_delay_bound(disruptions, train_id, block_id, booked_entry),
            )
            entry[train_id, block_id] = model.NewIntVar(
                lower, _entry_upper_bound(booked_entry), f"entry_{train_id}_{block_id}"
            )

    # -- chain: minimum dwell at every station, capped holds ----------------
    for train in TRAINS:
        train_id = train["id"]
        for index in range(len(ROUTE_BLOCK_IDS) - 1):
            block_id = ROUTE_BLOCK_IDS[index]
            next_block = ROUTE_BLOCK_IDS[index + 1]
            run = train["run_min"][block_id]
            model.Add(
                entry[train_id, next_block]
                >= entry[train_id, block_id] + run + MIN_DWELL_MIN
            )
            model.Add(
                entry[train_id, next_block]
                <= entry[train_id, block_id] + run + MAX_HOLD_MIN
            )

    # -- block mutual exclusion + minimum headway ---------------------------
    for block_id in ROUTE_BLOCK_IDS:
        occupancy = []
        for train in TRAINS:
            train_id = train["id"]
            occupancy.append(
                model.NewFixedSizeIntervalVar(
                    entry[train_id, block_id],
                    train["run_min"][block_id] + MIN_HEADWAY_MIN,
                    f"occ_{train_id}_{block_id}",
                )
            )
        model.AddNoOverlap(occupancy)

    # -- running order: no overtaking on the single line --------------------
    for block_id in ROUTE_BLOCK_IDS:
        for previous_id, next_id in zip(BOOKED_ORDER, BOOKED_ORDER[1:]):
            model.Add(entry[next_id, block_id] >= entry[previous_id, block_id])

    # -- possession / closure windows ---------------------------------------
    for disruption in disruptions:
        if disruption.get("type") != "block_closure":
            continue
        block_id = disruption["block_id"]
        window_start, window_end = disruption["start"], disruption["end"]
        for train in TRAINS:
            train_id = train["id"]
            run = train["run_min"][block_id]
            passes_before = model.NewBoolVar(f"before_{train_id}_{block_id}")
            model.Add(entry[train_id, block_id] + run <= window_start).OnlyEnforceIf(
                passes_before
            )
            model.Add(entry[train_id, block_id] >= window_end).OnlyEnforceIf(
                passes_before.Not()
            )

    # -- station platform capacity ------------------------------------------
    for index, station in enumerate(STATIONS):
        if index == 0 or index == len(STATIONS) - 1:
            continue
        upstream_block = ROUTE_BLOCK_IDS[index - 1]
        downstream_block = ROUTE_BLOCK_IDS[index]
        stop_intervals = []
        for train in TRAINS:
            train_id = train["id"]
            run = train["run_min"][upstream_block]
            stop_length = model.NewIntVar(
                MIN_DWELL_MIN,
                MAX_HOLD_MIN + 1,
                f"stop_{train_id}_{station['id']}",
            )
            model.Add(
                stop_length
                == entry[train_id, downstream_block]
                - entry[train_id, upstream_block]
                - run
            )
            stop_intervals.append(
                model.NewIntervalVar(
                    entry[train_id, upstream_block] + run,
                    stop_length,
                    entry[train_id, downstream_block],
                    f"stopiv_{train_id}_{station['id']}",
                )
            )
        model.AddCumulative(stop_intervals, [1] * len(stop_intervals), station["platforms"])

    # -- objective: passenger weighted punctuality at the terminus ----------
    terms = []
    for train in TRAINS:
        train_id = train["id"]
        weight = train["weight"]
        last_block = ROUTE_BLOCK_IDS[-1]
        booked_arrival = booked[train_id][last_block] + train["run_min"][last_block]
        terminus_delay = (
            entry[train_id, last_block] + train["run_min"][last_block] - booked_arrival
        )
        terms.append(terminus_delay * (TERMINUS_DELAY_WEIGHT * weight))
        for block_id in ROUTE_BLOCK_IDS:
            terms.append((entry[train_id, block_id] - booked[train_id][block_id]) * weight)
    model.Minimize(sum(terms))

    # -- solve ---------------------------------------------------------------
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = float(time_limit_s)
    solver.parameters.num_search_workers = 1
    solver.parameters.random_seed = int(seed)
    status = solver.Solve(model)

    solver_info: Dict[str, Any] = {
        "engine": "Google OR-Tools CP-SAT",
        "status": solver.StatusName(status),
        "optimal": status == cp_model.OPTIMAL,
        "time_limit_s": float(time_limit_s),
        "wall_time_ms": round(solver.WallTime() * 1000.0, 1),
        "variables": len(model.Proto().variables),
        "constraints": len(model.Proto().constraints),
        "num_conflicts": solver.NumConflicts(),
        "num_branches": solver.NumBranches(),
        "objective_value": None,
        "best_objective_bound": None,
        "weighted_cost": None,
    }

    if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        solver_info["message"] = "CP-SAT found no feasible plan."
        return {"schedule": None, "solver": solver_info}

    entries: Dict[str, Dict[str, int]] = {}
    for train in TRAINS:
        train_id = train["id"]
        entries[train_id] = {
            block_id: int(solver.Value(entry[train_id, block_id]))
            for block_id in ROUTE_BLOCK_IDS
        }

    schedule = schedule_from_entries(entries, source="cp_sat", baseline_entries=booked)
    solver_info["objective_value"] = round(float(solver.ObjectiveValue()), 1)
    solver_info["best_objective_bound"] = round(float(solver.BestObjectiveBound()), 1)
    solver_info["weighted_cost"] = round(float(solver.ObjectiveValue()), 1)
    schedule["notes"] = [
        f"Solved in {solver_info['wall_time_ms']} ms (objective {solver_info['objective_value']}).",
        "Rules enforced: block exclusion, headway, order, possessions, platforms.",
        f"Stops >= {MIN_DWELL_MIN} min; holds <= {MAX_HOLD_MIN} min.",
    ]
    return {"schedule": schedule, "solver": solver_info}


def optimizer_summary(solver_info: Optional[Dict[str, Any]]) -> str:
    """One line summary of the last solver run for the UI."""
    if not solver_info:
        return "Optimizer not run yet."
    if solver_info.get("objective_value") is None:
        return solver_info.get("message", "No feasible plan found.")
    quality = "optimal" if solver_info.get("optimal") else "best found"
    return f"{quality} plan in {solver_info['wall_time_ms']} ms"
