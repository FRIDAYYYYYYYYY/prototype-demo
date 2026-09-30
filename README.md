# AI-Powered Precise Train Traffic Control - SIH25022

> ### Positioning - read this first
>
> This is a **decision-support / simulation prototype for a human dispatcher**.
>
> It is **not** autonomous railway control, it is **not** safety-certified, and it
> is **not** deployed on real railway infrastructure. Every signal it produces is
> a recommendation to a person, not a movement authority.
>
> No certified track circuits, axle counters or sensor certifications are
> involved. The junction parameters are tabletop scale-model values, not
> railway-certified ones. No accuracy or percentage-improvement figure is claimed
> anywhere unless it came from an actual solver run performed by this code.

A CP-SAT decision-support prototype that closes a real loop: a physical two-track
junction reports sensor events to a FastAPI backend, the backend reuses its
existing corridor optimiser to resolve the junction conflict, an independent
validator checks the result, a deterministic recommender explains it, and the
advisory signal goes back to the physical board and the dashboard.

---

## What it does

```
sensor -> ESP32 -> POST /sensor-event -> Pydantic validation -> operational state
        -> conflict detection -> CP-SAT -> independent validator -> recommender
        -> GET /block-state -> physical signal -> React dashboard
```

The junction is modelled as the **existing** corridor block `BL1` (capacity 1),
so the same CP-SAT engine that plans a 47 km, four-station corridor also resolves
the tabletop junction. There is exactly one optimiser, one validator and one
recommender in this repository.

---

## Quick start

```powershell
# backend  -> http://127.0.0.1:8000   (OpenAPI docs at /docs)
python -m pip install -r backend/requirements.txt
python backend/main.py

# frontend -> http://localhost:5173
npm install
npm run dev
```

Or start both with `python start_project.py`.

### Try the hardware loop with no hardware

```powershell
python scripts/replay_demo.py --list
python scripts/replay_demo.py --scenario conflict
```

The replay posts to the **real** `/sensor-event` pipeline - Pydantic validation,
idempotency, CP-SAT, the validator and the recommender all genuinely run. Only
the transport is swapped (HTTP client instead of WiFi).

---

## Tests

```powershell
python -m pytest backend/test_api.py backend/test_hardware.py
```

**33 passing.** 10 pre-existing corridor tests (unchanged) + 23 hardware tests,
including the five hardware sequences from the contract:

| # | Sequence | Expected |
|---|----------|----------|
| 1 | `A1 -> A2` | A proceeds, A clears, **no** optimiser call |
| 2 | `B1 -> B2` | B proceeds, B clears, **no** optimiser call |
| 3 | `A1 -> B1 -> A2 -> B2` | conflict -> CP-SAT -> decision -> clean recovery |
| 4 | `B1 -> A1 -> B2 -> A2` | mirrored conflict -> valid decision -> recovery |
| 5 | `A1 -> A1 -> A2 -> A2` | duplicate protection, no double optimisation |

Either runner also works standalone: `python backend/test_api.py`,
`python backend/test_hardware.py`.

---

## API

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/` | Service index |
| GET | `/health` | Liveness probe |
| GET | `/state` | Topology + every candidate plan |
| GET | `/scenarios` | Ready-made demo disturbances |
| POST | `/disruption` | Inject a signal delay or block possession |
| POST | `/optimize` | Run the CP-SAT re-planning model |
| POST | `/validate` | Rule-based safety validation of any plan |
| GET | `/results` | KPIs + validation + comparison + advice |
| POST | `/reset` | Restore the booked baseline |
| GET | `/hardware/contract` | Locked sensor / GPIO contract |
| GET | `/hardware/status` | Hardware state + audit trail |
| POST | `/sensor-event` | Receive one ESP32 sensor event |
| GET | `/block-state` | Signal aspect per logical block (polled) |
| POST | `/sensor-event/reset` | Reset junction state (demo/test utility) |

Full interactive docs: <http://127.0.0.1:8000/docs>

---

## Hardware contract

Locked and implemented exactly as specified - `A1`/GPIO 22, `A2`/19, `B1`/21,
`B2`/18. Field names `block_id`, `event_type` and the signal semantics are never
renamed.

| Physical train | Simulator train | Priority | Weight |
|----------------|-----------------|----------|--------|
| Train A (low-priority freight) | `T305` Coal Freight 305 | 4 | 1 |
| Train B (high-priority express) | `T101` Rajdhani Express | 1 | 3 |

These are **existing** trains with their **existing** weights; the mapping is a
lookup layer, not a rename.

See **`docs/hardware_contract.md`** for the payload schema, state transitions,
idempotency rules, staleness threshold and polling behaviour.

---

## Legacy rule vs CP-SAT (measured, not asserted)

`python backend/junction_report.py` prints the comparison from real runs.

| Arrival order | Legacy first-arrival | CP-SAT | Difference |
|---|---|---|---|
| **Freight first, express 2 min later** | freight proceeds | **express proceeds** | **yes - they disagree** |
| Express first, freight 2 min later | express proceeds | express proceeds | no - they agree |

**Honest mechanism note:** the difference is *not* a novel trade-off discovered by
the solver. It comes from the existing no-overtaking constraint (`T101` is booked
ahead of `T305`) together with the existing priority-weighted objective. In the
mirrored order the two rules genuinely agree, and we report that. Full detail and
a "never say this on stage" list: `docs/junction_decision.md`.

---

## Demo

See **`docs/demo_runbook.md`** for the exact 90-second demo script, the recorded
fallback, the failure playbook (WiFi down / ESP32 unresponsive / backend restart /
solver failure) and the three-run rehearsal log.

---

## Layout

```
backend/
  simulator.py         corridor topology, booked plan, legacy cascade, rule engine
  optimizer.py         CP-SAT re-planning model (the ONLY optimiser)
  validator.py         independent rule-based safety validation
  recommender.py       deterministic dispatcher advisories
  hardware_state.py    isolated, lock-guarded junction state + contract table
  junction_adapter.py  hardware events -> existing CP-SAT/validator/recommender
  main.py              FastAPI app
  test_api.py          10 corridor end-to-end tests
  test_hardware.py     23 hardware tests incl. the 5 sequences
  junction_report.py   reproducible legacy-vs-CP-SAT report
src/                   React 19 + Vite + MUI + Recharts dashboard
firmware/              ESP32 client (implemented, NOT hardware-verified)
scripts/replay_demo.py demo-mode replay through the real pipeline
docs/                  contract, junction decision, demo runbook
```

---

## Verification status - what is real and what is not

| Item | Status |
|------|--------|
| Backend, CP-SAT model, validator, recommender | implemented and tested (33 tests) |
| Hardware loop via `POST /sensor-event` / `GET /block-state` | implemented and tested |
| Legacy vs CP-SAT comparison | measured by real solver runs |
| Demo-mode replay | verified against a live server |
| **Physical ESP32 / Wokwi** | **implemented, NOT hardware-verified** - no board was flashed |
| Sensor certification / track circuits | not applicable - tabletop model only |
| PostgreSQL, Power BI, Chart.js analytics | deliberately deferred (PRD 3.7) |

Nothing in this repository has been connected to real railway infrastructure.
