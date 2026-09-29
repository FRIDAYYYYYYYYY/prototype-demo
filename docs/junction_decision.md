# Junction Decision: Legacy Rule vs. CP-SAT (measured)

**Everything in this document was produced by running the code in this repository.**
No number here is estimated, and no parameter was tuned to produce a difference.
Command to regenerate: `python backend/junction_report.py`.

---

## 1. The mapping actually used

| Physical | Role (PRD §3.5) | Simulator train | Type | Priority | Weight |
|----------|-----------------|-----------------|------|----------|--------|
| Train A | low-priority freight, arrives **first** | `T305` Coal Freight 305 | Freight | 4 | 1 |
| Train B | high-priority express, arrives **later** | `T101` Rajdhani Express | Express | 1 | 3 |

These are **existing** trains with their **existing** weights and priorities. No ID
was renamed and no weight was altered; `JUNCTION_TRAIN_MAP` in
`backend/hardware_state.py` is a pure lookup layer.

---

## 2. Measured results, both arrival orders

Scenario: both trains approach the junction, the second one ~2 minutes after the
first (i.e. well inside the clearance window, so a real conflict).

| Arrival order | Legacy first-arrival rule | CP-SAT decision | Difference? |
|---|---|---|---|
| **A first** (freight, then express) | `A` proceeds | **`B` proceeds** | **YES — the two disagree** |
| **B first** (express, then freight) | `B` proceeds | `B` proceeds | no — they agree |

**The headline result is the first row.** This is exactly the PRD §3.5 scenario:
the low-priority freight reaches the junction first, the legacy local rule releases
it, and the CP-SAT engine instead holds it and gives the junction to the
higher-priority express. The physical signal changes from "A PROCEED / B HOLD" to
"A HOLD / B PROCEED" because of a measured decision, not a hard-coded one.

---

## 3. Honest mechanism note — read this before quoting the result

The difference is real and reproducible, but it is **not** caused by the optimiser
discovering a subtle trade-off. Two things in the existing model independently
force "express before freight" at the junction:

1. **The existing no-overtaking constraint.** `optimizer.py` forces
   `entry[T101] <= entry[T305]` on every block because `T101` precedes `T305` in
   `BOOKED_ORDER`. In the "A first" case the solver therefore *cannot* put the
   freight into the junction ahead of the express, whatever the objective says.
2. **The priority-weighted objective** then makes holding the freight the cheaper
   option, because `T101` carries weight 3 against `T305`'s weight 1.

So the correct statement is: *the existing model consistently prefers the
higher-priority express, and the legacy first-arrival rule does not.* It would be
**false** to claim "the optimiser discovered a novel trade-off". Do not say that on
stage.

This is also why row 2 agrees: when the express already arrived first, the legacy
rule and the model reach the same answer, and we report that plainly.

---

## 4. What is *not* claimed

- No percentage improvement is claimed, because the junction decision is a
  binary aspect (PROCEED/HOLD), not a delay that can be averaged.
- The junction occupancy (8 min for the freight) and headway (3 min) are
  **scale-model parameters** for a tabletop junction, not certified railway
  values.
- No accuracy figure, no "X% better" and no certification is claimed anywhere.
- The system **advises**; it does not command trains. Every aspect shown is a
  recommendation to a human dispatcher.

---

## 5. Reproducibility

The solver is pinned: `random_seed = 42`, `num_search_workers = 1`,
`max_time_in_seconds = 5.0` (`SOLVER_SEED` / `SOLVER_TIME_LIMIT_S` in
`backend/junction_adapter.py`). Repeated runs produce identical decisions; the
rehearsal log in `docs/demo_runbook.md` records three consecutive runs.
