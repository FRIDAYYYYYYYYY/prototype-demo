# Demo Runbook — SIH25022

**Positioning statement to say out loud, every time:**

> "This is a decision-support / simulation prototype for a human dispatcher. It is
> not autonomous railway control, it is not safety-certified, and it is not
> connected to real railway infrastructure. Every signal it produces is a
> recommendation to a person."

---

## 1. One-command start (software only)

```powershell
python backend/main.py          # backend  -> http://127.0.0.1:8000  (docs: /docs)
npm run dev                     # frontend -> http://localhost:5173
```

Or both together: `python start_project.py`.

## 2. The demo (about 90 seconds)

### Step 1 — prove the junction starts clean

```powershell
curl http://127.0.0.1:8000/block-state
```

Expected: both aspects `PROCEED`, `"stale": true`, reason
`"No hardware data yet - signals are advisory defaults, not a clearance."`

**Say:** "Before any sensor fires, the system refuses to claim the road is clear —
it marks its own data as stale."

### Step 2 — the single-train case (no optimisation)

```powershell
curl -X POST http://127.0.0.1:8000/sensor-event -H "Content-Type: application/json" -d "{\"block_id\":\"A1\",\"state\":\"occupied\",\"event_type\":\"sensor_triggered\",\"timestamp\":1732500000000,\"source\":\"sensor_A1\",\"seq\":1}"
curl http://127.0.0.1:8000/block-state
curl http://127.0.0.1:8000/hardware/status
```

Expected: `A=PROCEED B=PROCEED` and `"optimizer_calls": 0`.

**Say:** "One train, no conflict, no optimisation — the solver is not invoked."

### Step 3 — the headline scenario (PRD §3.5)

Freight approach (A1) first, then express approach (B1) a few seconds later —
**before** A2 fires.

```powershell
curl -X POST http://127.0.0.1:8000/sensor-event -H "Content-Type: application/json" -d "{\"block_id\":\"B1\",\"state\":\"occupied\",\"event_type\":\"sensor_triggered\",\"timestamp\":1732500120000,\"source\":\"sensor_B1\",\"seq\":1}"
curl http://127.0.0.1:8000/block-state
```

Expected: **`A=HOLD`, `B=PROCEED`**, `decision.source = "cpsat"`.

**Say:** "The legacy local rule would have released the freight that arrived first.
The CP-SAT engine held it and gave the junction to the higher-priority express —
T101, priority 1, weight 3, against the freight T305, priority 4, weight 1. Those
weights were already in the model; none were tuned."

### Step 4 — clearance and recovery

```powershell
curl -X POST http://127.0.0.1:8000/sensor-event -H "Content-Type: application/json" -d "{\"block_id\":\"A2\",\"state\":\"free\",\"event_type\":\"sensor_triggered\",\"timestamp\":1732500300000,\"source\":\"sensor_A2\",\"seq\":1}"
curl -X POST http://127.0.0.1:8000/sensor-event -H "Content-Type: application/json" -d "{\"block_id\":\"B2\",\"state\":\"free\",\"event_type\":\"sensor_triggered\",\"timestamp\":1732500390000,\"source\":\"sensor_B2\",\"seq\":1}"
curl http://127.0.0.1:8000/block-state
```

Expected: all-clear, `"Junction is clear - both approaches are free."`

### Step 5 — the honest comparison

```powershell
python backend/junction_report.py
```

Prints both arrival orders with the measured legacy-vs-CP-SAT outcome.

**Say:** "In the mirrored order — express first — the two rules **agree**, and we
report that. The difference appears only in the freight-first case."

**Never say** "the AI discovered a novel trade-off". The difference comes from the
existing no-overtaking constraint plus the existing weighted objective; see
`docs/junction_decision.md` §3.

---

## 3. Demo Mode (the fallback — PRD §3.6)

If WiFi or the hardware fails on stage, run the replay. It posts to the **real**
`/sensor-event` pipeline, so Pydantic validation, idempotency, CP-SAT, the
validator and the recommender all genuinely run. Only the transport changes.

```powershell
python scripts/replay_demo.py --list
python scripts/replay_demo.py --scenario conflict     # the headline scenario
python scripts/replay_demo.py --scenario b_first      # mirrored case
python scripts/replay_demo.py --scenario single       # proves no optimisation
python scripts/replay_demo.py --scenario duplicates   # duplicate protection
```


---

## 4. Rehearsal log (PRD §3.6 — three consecutive runs)

Recorded 2026-09-29 with `python scripts/replay_demo.py --scenario conflict`
against a live `uvicorn main:app`, and with the physical-event path in
`backend/test_hardware.py`.

| Run | A1 | B1 (conflict) | A2 | B2 | Solver source | Result |
|-----|----|---------------|----|----|---------------|--------|
| 1 | accepted | accepted | accepted | accepted | `cpsat` | `A=HOLD B=PROCEED` → all-clear |
| 2 | accepted | accepted | accepted | accepted | `cpsat` | `A=HOLD B=PROCEED` → all-clear |
| 3 | accepted | accepted | accepted | accepted | `cpsat` | `A=HOLD B=PROCEED` → all-clear |

**Run-to-run difference: none.** The solver is pinned to `random_seed=42` and
`num_search_workers=1`, so the decision is deterministic. Wall-clock solve time
varies by a few milliseconds between runs (≈20–30 ms observed); the *decision*
does not vary.

Full-suite baseline: `python -m pytest backend/test_api.py backend/test_hardware.py`
→ **33 passed** (10 pre-existing tests, unchanged and green, plus 23 new).

---

## 5. Failure playbook

| Failure | What you see | What to do | What to say |
|---|---|---|---|
| **WiFi down / ESP32 not posting** | LEDs go to HOLD + distinct link blink; `stale: true` after 10 s | Run `python scripts/replay_demo.py --scenario conflict` | "The hardware link dropped, so the board is showing its safe state. Here's the same scenario through the identical backend pipeline." |
| **Backend not running** | ESP32 blinks the link LED, both aspects HOLD | Start `python backend/main.py`, then replay | "The backend was down; the board correctly refused to show PROCEED. Starting the backend and replaying." |
| **Backend restarts mid-demo** | State resets to "No hardware data yet" | `curl -X POST .../sensor-event/reset`, replay | "The backend restarted, so the prototype lost its in-memory state — by design it does not guess." |
| **Solver failure** | `decision.source = "fallback"`, reason names the cause | Nothing to fix live | "The solver could not produce a plan, so the system fell back to the deterministic first-arrival rule and flagged it. It never silently shows a made-up result." |
| **Everything fails** | — | Play the recorded video | "That was a recording of an earlier successful run. Here is what actually happens." |

---

## 6. Pre-demo checklist

- [ ] `python -m pytest backend/test_api.py backend/test_hardware.py` → all green
- [ ] `curl http://127.0.0.1:8000/health` → `{"status":"ok"}`
- [ ] `python backend/junction_report.py` runs and prints the comparison
- [ ] `python scripts/replay_demo.py --scenario conflict` rehearsed once
- [ ] recorded video plays from a local file, not the internet
- [ ] WiFi credentials and the backend LAN IP are set in the firmware
- [ ] The board's `seq` is boot-seeded, or `POST /sensor-event/reset` is planned
      into the demo

---

## 7. What is **not** verified

Stated plainly so nothing on stage is a surprise:

- **No physical ESP32 was connected during development.** The firmware in
  `firmware/esp32_junction_client/` is written against the locked contract and
  reviewed, but it has **not** been compiled, flashed or run on hardware here.
  Wokwi was not run. Every hardware claim is *implemented, not hardware-verified*.
- **No certified track circuit, axle counter or sensor certification** is involved
  anywhere. The sensors are a tabletop model.
- The junction occupancy (8 min) and headway (3 min) are **scale-model
  parameters**, not railway-certified values.
- PostgreSQL, Power BI and the Chart.js dashboard are **deliberately deferred**
  (PRD §3.7) and are not part of this demo.

**Say:** "This is the same code path as the hardware, with the WiFi radio replaced
by a script. The decision you just saw was computed live, not replayed from a
recording."

**Recorded video fallback:** capture one clean run of Step 2–4 in advance, stored
locally. If both live hardware *and* the backend fail, play the video and say
plainly that it is a recording of an earlier run.
