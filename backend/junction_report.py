"""Reproducible legacy-vs-CP-SAT junction report (Phase G).

Prints the measured comparison that ``docs/junction_decision.md`` documents.
Every number below comes from an actual solver + simulator run performed by this
script; nothing is hard-coded or estimated.

Usage::

    python backend/junction_report.py
"""

from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import junction_adapter  # noqa: E402
from hardware_state import JUNCTION_TRAIN_MAP  # noqa: E402
from simulator import TRAIN_BY_ID  # noqa: E402

BASE_MS = 1732500000000
GAP_MS = 120_000  # the express arrives ~2 minutes after the freight


def _run(order: str) -> dict:
    """Run one conflict scenario. ``order`` is 'A_first' or 'B_first'."""
    if order == "A_first":
        arrivals = {"A": BASE_MS, "B": BASE_MS + GAP_MS}
    else:
        arrivals = {"A": BASE_MS + GAP_MS, "B": BASE_MS}

    occupancy = {"A": "occupied", "B": "occupied"}
    decision = junction_adapter.decide_junction(occupancy, arrivals)
    legacy = decision["legacy"]
    return {
        "order": order,
        "decision": decision,
        "legacy_proceed": legacy["proceed"],
        "cpsat_proceed": decision["proceed"],
        "agrees": legacy["proceed"] == decision["proceed"],
    }


def main() -> int:
    print("=" * 78)
    print(" Junction decision report - legacy first-arrival rule vs CP-SAT")
    print(" Decision-support / simulation prototype. Not autonomous train control.")
    print("=" * 78)

    print("\nMapping (existing simulator trains, unchanged weights/priorities):")
    for block, train_id in JUNCTION_TRAIN_MAP.items():
        train = TRAIN_BY_ID[train_id]
        print(
            f"  Physical {block} -> {train_id:5s} {train['name']:<20s} "
            f"type={train['type']:<9s} priority={train['priority']} weight={train['weight']}"
        )

    print(f"\nSolver: seed={junction_adapter.SOLVER_SEED} "
          f"time_limit={junction_adapter.SOLVER_TIME_LIMIT_S}s")

    for order in ("A_first", "B_first"):
        result = _run(order)
        decision = result["decision"]
        solver = decision.get("solver") or {}
        print(f"\n--- Scenario: {order} (second train ~2 min later) ---")
        print(f"  legacy first-arrival rule : proceed {result['legacy_proceed']}")
        print(f"  CP-SAT decision           : proceed {result['cpsat_proceed']} "
              f"hold {decision['hold']}")
        print(f"  decision_source           : {decision['decision_source']}")
        print(f"  solver status / wall time : {solver.get('status')} / "
              f"{solver.get('wall_time_ms')} ms")
        print(f"  weighted objective value  : {solver.get('objective_value')}")
        validation = decision.get("validation") or {}
        print(f"  independent validation    : valid={validation.get('valid')}")
        if decision.get("entries"):
            print(f"  junction block entries    : {decision['entries']}")
        print(f"  arrival gap (min)         : {decision.get('arrival_gap_min')}")
        print(f"  DIFFERENCE                : "
              f"{'YES - the two rules disagree' if not result['agrees'] else 'no - they agree'}")
        print(f"  reason                    : {decision['reason']}")

    print("\n" + "-" * 78)
    print("Honest note: the difference is driven by the existing no-overtaking")
    print("constraint (T101 is booked ahead of T305) together with the existing")
    print("priority-weighted objective - not by a novel trade-off discovered by")
    print("the solver. See docs/junction_decision.md section 3.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
