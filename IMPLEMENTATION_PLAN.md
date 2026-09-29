# AI-Powered Precise Train Traffic Control — SIH25022
## Implementation Plan

---

### Gating Strategy & Phased Execution

To ensure rock-solid stability before the final round, the implementation is divided into sequential, gated phases. **No phase is started until the preceding phase is verifiably complete and passing all validation tests.**

```
+-------------+      +-------------+      +-------------+      +-------------+      +---------------+      +-------------+
|   Phase 1   | ---> |   Phase 2   | ---> |   Phase 3   | ---> |   Phase 4   | ---> |    Phase 5    | ---> |  Phase 5.5  |
|Contract Lock|      |API Endpoints|      |cURL Test Seq|      |Live Hardware|      |Demo Benchmark |      |Rehearsal/Vid|
+-------------+      +-------------+      +-------------+      +-------------+      +---------------+      +-------------+
```

---

### Phase 1 — Contract & Schema Lock

* **Objective:** Lock interface schemas and communication protocol between software and hardware pairs.
* **Tasks:**
  1. Confirm exact field names (`block_id`, `state`, `event_type`, `seq`, `timestamp`, `source`) with hardware team.
  2. Confirm hardware polling frequency ($1\text{ to }2\text{ s}$) for `GET /block-state`.
  3. Validate GPIO pinouts (`A1`=22, `A2`=19, `B1`=21, `B2`=18).
* **Done When:** Written alignment between hardware and software engineers with zero ambiguous field names.

---

### Phase 2 — Endpoint Implementation & State Machine

* **Objective:** Implement hardware intake endpoints in FastAPI and connect them to the CP-SAT engine.
* **Tasks:**
  1. Add Pydantic model `SensorEventPayload` in [`backend/main.py`](file:///c:/Users/Sri/OneDrive/Desktop/friday_traintraffic/prototype-demo/backend/main.py).
  2. Implement `POST /sensor-event` with strict sequence number (`seq`) verification.
  3. Implement `GET /block-state` returning current signal states (`PROCEED` / `HOLD`) and advisory reasons.
  4. Implement junction conflict detection logic in [`backend/simulator.py`](file:///c:/Users/Sri/OneDrive/Desktop/friday_traintraffic/prototype-demo/backend/simulator.py) mapping active approach tracks into [`backend/optimizer.py`](file:///c:/Users/Sri/OneDrive/Desktop/friday_traintraffic/prototype-demo/backend/optimizer.py).
* **Done When:** Endpoints return expected HTTP 200 responses with valid state transitions.

---

### Phase 3 — Verification Against Hardware Test Sequences

* **Objective:** Simulate real sensor sequences locally via automated scripts and `curl` before hardware hookup.

| Sequence Test | Simulated Ingestion Steps | Expected System Behavior |
| :--- | :--- | :--- |
| **`SEQ_A_ONLY`** | `A1 (occupied)` $\rightarrow$ `A2 (free)` | Approach A cleared immediately. `A` = `PROCEED`, `B` = `HOLD`. No CP-SAT needed. |
| **`SEQ_B_ONLY`** | `B1 (occupied)` $\rightarrow$ `B2 (free)` | Symmetric to A-only. `B` = `PROCEED`, `A` = `HOLD`. |
| **`SEQ_FORWARD_CONFLICT`** | `A1` $\rightarrow$ `B1` (before `A2`) | Conflict triggered on `B1`. CP-SAT optimizes based on priority weights. |
| **`SEQ_REVERSE_CONFLICT`** | `B1` $\rightarrow$ `A1` (before `B2`) | Symmetric to forward conflict. |
| **`SEQ_DUPLICATE_DEBOUNCE`**| `A1` $\rightarrow$ `A1` duplicate | Second event rejected or treated as idempotent no-op based on `seq`. |

* **Done When:** All 5 synthetic hardware sequences pass cleanly with verified log outputs.

---

### Phase 4 — Live Hardware Hookup & Wireless Integration

* **Objective:** Connect physical ESP32 controller to the FastAPI backend over local WiFi.
* **Tasks:**
  1. Point ESP32 HTTP client to host machine IP (`http://<LAN_IP>:8000`).
  2. Verify physical IR sensor triggers generate logged `POST /sensor-event` calls.
  3. Verify physical optical signal LEDs update in response to `GET /block-state` polling.
  4. Validate end-to-end latency ($<500\text{ ms}$ processing time).
* **Done When:** Physical sensor activations visibly update the physical LEDs and the React dashboard simultaneously.

---

### Phase 5 — Demo Scenario: CP-SAT vs. Legacy Local Rule

* **Objective:** Execute the core demonstration scenario proving the concrete value of CP-SAT optimization.

#### Benchmark Scenario Setup
* **Train B (T204 Intercity Passenger / Weight 2):** Triggers `B1` first at $t=0$.
* **Train A (T101 Rajdhani Express / Weight 3):** Triggers `A1` shortly after, before `B2` clears.

#### Comparison Matrix
```
+------------------------------------+------------------------------------+
|   Legacy Local Rule (FCFS/FIFO)    |      AI Decision Engine (CP-SAT)   |
+------------------------------------+------------------------------------+
| 1. Passenger (B) proceeds first.   | 1. Express (A) prioritized.        |
| 2. Express (A) held for full run.  | 2. Passenger (B) briefly held.     |
| 3. High passenger delay penalty.   | 3. Total weighted delay minimized. |
| Result: +9 min express delay       | Result: -41% weighted delay delta  |
+------------------------------------+------------------------------------+
```

#### Demo Cases (Verified Decision Boundaries)
* **Gap 2 s ($t_B=0, t_A=+2\text{s}$):** CP-SAT **16000** vs FCFS **27000** $\rightarrow$ Express (A) proceeds first, Passenger (B) held.
* **Gap 2 min ($t_B=0, t_A=+2\text{ min}$):** CP-SAT **20000** vs FCFS **21000** $\rightarrow$ Express (A) proceeds first, Passenger (B) held.
* **Gap 3 min ($t_B=0, t_A=+3\text{ min}$):** CP-SAT **18000** vs FCFS **18000** $\rightarrow$ Passenger (B) proceeds first, Express (A) held.
* **Gap 5 min ($t_B=0, t_A=+5\text{ min}$):** CP-SAT **12000** vs FCFS **12000** $\rightarrow$ Passenger (B) proceeds first, Express (A) held.

> **Note on Evaluation:** FCFS values are hand-computed from the same objective cost model ($w_A \cdot d_A \cdot 1000 + w_B \cdot d_B \cdot 1000$). Dynamic arrival times are rounded to whole minutes in `simulator.py`, so arrival gaps under $\sim 30\text{ seconds}$ evaluate as simultaneous ready times ($ready_A=0, ready_B=0$).

* **Done When:** Side-by-side KPI cards and timetable deltas display live on screen with zero simulated or fake metrics.

---

### Phase 5.5 — Rehearsal, Stress-Testing & Fallback Recording

* **Objective:** Guarantee 100% demo resilience against live network drops or physical glitches.
* **Tasks:**
  1. Rehearse full end-to-end demo 3 consecutive times with hardware connected.
  2. Screen-record a high-definition backup video of the live physical board and React UI in sync.
  3. Package one-click demo fallback launcher.
* **Done When:** Demo team can seamlessly switch to the backup recording within 5 seconds if hardware/WiFi fails on stage.

---

### Phase Status Overview

| Phase | Description | Status | Verification Detail |
| :--- | :--- | :---: | :--- |
| **Phase 1** | Contract & Schema Lock | **COMPLETE** | Hardware pinouts and API payloads locked. |
| **Phase 2** | Endpoint Implementation & State Machine | **COMPLETE** | `/sensor-event`, `/block-state`, `optimizer.py`, `simulator.py` integrated. |
| **Phase 3** | Verification Against Synthetic Sequences | **COMPLETE** | 15/15 unit & integration tests passing. |
| **Phase 4** | Live Hardware Hookup & Wireless Integration | **IN PROGRESS** | Backend listening on `0.0.0.0:8000` with live request logger; awaiting physical ESP32 trigger. |
| **Phase 5** | Demo Scenario: CP-SAT vs Legacy Local Rule | **QUEUED** | Ready for live benchmark run. |
| **Section 3.7**| **PostgreSQL Persistence Layer** | **COMPLETE** | Schema verified against real Postgres dialect (PostgreSQL 16 with native JSONB types & cascades); functional tests pass against SQLite stand-in; never run against a live Postgres server in this environment. |

---

### Phase Final — Long-Term Roadmap Status

1. **Database Persistence (Section 3.7):** **IMPLEMENTED & VERIFIED (Dialect & Stand-in)**
   - SQLAlchemy 2.0 ORM models for all corridor entities: `trains`, `blocks`, `disruptions`, `schedule_runs`, `schedule_results`, `conflicts`, `hardware_events`, `junction_decisions`, and `kpi_snapshots`.
   - Native PostgreSQL dialect verified with `JSONB` columns (`active_trains`, `delayed_train_ids`) and `ON DELETE CASCADE`.
   - Write-after-compute persistence with zero-impact fallback when `DATABASE_URL` is unset.
   - Status note: *PostgreSQL persistence layer complete, schema verified against real Postgres dialect, functional tests pass against SQLite stand-in, never run against a live Postgres server.*
2. **External BI Dashboards:** Power BI / Chart.js connectors (Deferred until explicitly requested).
3. **Machine Learning Predictors:** Deep learning or LSTM-based delay propagation forecasting (Deferred).
4. **Autonomous Interlocking:** Direct safety-critical actuation without human-in-the-loop confirmation (Deferred).
