# AI-Powered Precise Train Traffic Control — SIH25022
## Technical Requirements Document (TRD)

---

### 1. Existing System Architecture (Baseline)

The prototype is built upon a verified, modular foundation with **10/10 end-to-end tests passing**.

```
  +-------------------------------------------------------------+
  |              React 19 + MUI + Recharts Frontend             |
  | (Corridor Schematic, Live Signals, 4-Stage Demo, KPI Cards)  |
  +-------------------------------------------------------------+
                               |
                   HTTP / REST (JSON API)
                               v
  +-------------------------------------------------------------+
  |                      FastAPI Backend                        |
  |                                                             |
  |  +--------------------+             +--------------------+  |
  |  |   simulator.py     | <---------> |   optimizer.py     |  |
  |  | Corridor Topology  |             |  OR-Tools CP-SAT   |  |
  |  | Fleet & Timetable  |             | AddNoOverlap Solver|  |
  |  +--------------------+             +--------------------+  |
  |            |                                  |             |
  |            v                                  v             |
  |  +--------------------+             +--------------------+  |
  |  |   validator.py     | <---------- |  recommender.py    |  |
  |  | Headway & Safety   |             | Human Advisory Text|  |
  |  +--------------------+             +--------------------+  |
  +-------------------------------------------------------------+
                               ^
                   HTTP Polling / Ingestion
                               |
  +-------------------------------------------------------------+
  |                     ESP32 Hardware Node                     |
  |   (GPIO Sensors: A1, A2, B1, B2 | Optical Signal LEDs)      |
  +-------------------------------------------------------------+
```

#### Core Components & File Responsibilities
* [**`backend/simulator.py`**](file:///c:/Users/Sri/OneDrive/Desktop/friday_traintraffic/prototype-demo/backend/simulator.py): Single-corridor railway simulation ($47\text{ km}$, 4 stations, 3 track blocks), fleet configurations (T101 Express, T204 Regional, F801 Freight, T312 Intercity), dwell times, and delay propagation logic.
* [**`backend/optimizer.py`**](file:///c:/Users/Sri/OneDrive/Desktop/friday_traintraffic/prototype-demo/backend/optimizer.py): Constraint Programming solver utilizing Google OR-Tools CP-SAT. Formulates `AddNoOverlap` block occupancy, headway safety windows ($3\text{ min}$), station dwell bounds ($1\text{ to }90\text{ min}$), and passenger delay objective functions.
* [**`backend/validator.py`**](file:///c:/Users/Sri/OneDrive/Desktop/friday_traintraffic/prototype-demo/backend/validator.py): Independent safety validation engine checking minimum headway violations, platform capacity overflows, and track possession violations.
* [**`backend/recommender.py`**](file:///c:/Users/Sri/OneDrive/Desktop/friday_traintraffic/prototype-demo/backend/recommender.py): Synthesizes schedule deltas into explainable dispatcher advice.
* [**`backend/main.py`**](file:///c:/Users/Sri/OneDrive/Desktop/friday_traintraffic/prototype-demo/backend/main.py): REST API exposing endpoints for simulation state, disruption injection, CP-SAT re-planning, validation, KPI comparison, and hardware intake.

---

### 2. Hardware Event Intake & Interface Contract

#### 2.1 Hardware Sensor Pin Mapping (Source of Truth)

| Sensor ID | GPIO Pin | Hardware Meaning | Software State Transition |
| :--- | :--- | :--- | :--- |
| **`A1`** | `GPIO 22` | Train A Approaching Junction | Approach Block A: `free` $\rightarrow$ `occupied` |
| **`A2`** | `GPIO 19` | Train A Cleared Junction | Approach Block A: `occupied` $\rightarrow$ `free` |
| **`B1`** | `GPIO 21` | Train B Approaching Junction | Approach Block B: `free` $\rightarrow$ `occupied` |
| **`B2`** | `GPIO 18` | Train B Cleared Junction | Approach Block B: `occupied` $\rightarrow$ `free` |

---

#### 2.2 Ingestion Endpoint: `POST /sensor-event`

Hardware publishes debounced occupancy transitions. Includes strict sequence numbering (`seq`) for idempotency.

* **Request URL:** `/sensor-event`
* **Method:** `POST`
* **Content-Type:** `application/json`

```json
{
  "block_id": "A1",
  "state": "occupied",
  "event_type": "sensor_triggered",
  "timestamp": 1732500000000,
  "source": "sensor_A1",
  "seq": 1042
}
```

* **Response (200 OK):**
```json
{
  "status": "acknowledged",
  "seq": 1042,
  "action_taken": "conflict_evaluated",
  "active_trains": ["T101", "T204"]
}
```

---

#### 2.3 Advisory Signal Polling Endpoint: `GET /block-state`

ESP32 polls this endpoint periodically ($1.0 - 2.0\text{ s}$) to drive physical optical signal heads (Green = `PROCEED`, Red = `HOLD`).

* **Request URL:** `/block-state`
* **Method:** `GET`

```json
{
  "timestamp": 1732500002100,
  "is_stale": false,
  "blocks": [
    { "block_id": "A", "signal": "PROCEED", "train_id": "T101" },
    { "block_id": "B", "signal": "HOLD", "train_id": "T204" }
  ],
  "reason": "Train B holds: Train A (Express) has higher passenger weight and earlier planned entry."
}
```

---

### 3. Junction Conflict & Optimization Model

The physical junction represents a shared single-track bottleneck with **capacity = 1**.

```
Approach Track A (Train A) ---\
                               +==== [ Shared Junction Block J1 ] ====> Outbound
Approach Track B (Train B) ---/
```

* **Scenario 1: No Trains Approaching**
  * Junction state: `IDLE`.
  * Signals: Both `PROCEED` (or default approach green).
* **Scenario 2: Single Train Approaching (`A1` only OR `B1` only)**
  * Trivial grant: Approaching train receives `PROCEED`, opposing approach displays `HOLD`. No CP-SAT computation required.
* **Scenario 3: Dual Train Conflict (`A1` + `B1` active simultaneously)**
  * Trigger: Dual occupancy detected before clearance (`A2` / `B2`).
  * Engine Action: Dispatches to `optimizer.py` using priority weights ($w_{\text{express}} > w_{\text{regional}} > w_{\text{freight}}$).
  * Outcome: Higher-weighted service granted `PROCEED`; lower-weighted service held safely with human-readable explanation.

---

### 4. Communication & Resilience Design

| Parameter | Specification | Engineering Rationale |
| :--- | :--- | :--- |
| **Directionality** | Hardware Polls Backend (`GET /block-state` @ $1\text{ Hz}$) | Eliminates need for backend to manage dynamic client sockets or NAT hole-punching on WiFi. |
| **Idempotency** | Monotonic `seq` counters per sensor source | Prevents duplicate trigger executions from network packet re-transmissions. |
| **Heartbeat / Silence Detection** | $5.0\text{ s}$ timeout window | If hardware telemetry ceases, backend marks state `is_stale: true` and flags dispatcher UI. |
| **Thread Safety** | Atomic in-memory state lock | Guarantees race-free updates between sensor ingest worker and frontend polling. |

---

### 5. Architectural Guardrails & Ground Rules

1. **Non-Autonomous Principle:** The system is an advisory decision-support tool. It computes recommendations for a human dispatcher and does not directly command real-world locomotives.
2. **Deterministic Fallback:** If CP-SAT solver encounters an infeasible scenario or timeout, it gracefully falls back to the safety rule engine (`validator.py` + FIFO safety clamp).
3. **Immutability of Contract:** Hardware pinouts (`A1`, `A2`, `B1`, `B2`) and endpoint schemas are frozen to guarantee compatibility with ESP32 firmware.
