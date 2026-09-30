# Hardware Communication Contract (SIH25022)

**Prototype positioning:** a *decision-support / simulation prototype for a human
dispatcher*. It is **not** autonomous railway control, not safety-certified and not
deployed on real railway infrastructure. Every signal in this document is an
advisory suggestion rendered for a human operator.

This document is the single source of truth for the ESP32 ↔ FastAPI interface.
The machine-readable version of the tables below lives in
`backend/hardware_state.py` (`SENSOR_CONTRACT`, `JUNCTION_TRAIN_MAP`); the two are
kept in sync by a test in `backend/test_hardware.py`.

---

## 1. Locked sensor / GPIO contract

| Sensor | GPIO | Event | Block transition |
|--------|------|-------|------------------|
| A1 | 22 | Train A approaching | A: free → occupied |
| A2 | 19 | Train A cleared | A: occupied → free |
| B1 | 21 | Train B approaching | B: free → occupied |
| B2 | 18 | Train B cleared | B: occupied → free |

The GPIO numbers, sensor IDs, `block_id` field name, `event_type` field name and
signal semantics are **locked**. They are never renamed.

Debouncing is performed on the ESP32 (hardware team design). The backend performs
**no** debouncing; it relies on the `seq` idempotency scheme (section 5).

---

## 2. Sensor → (logical block, train, transition) lookup

`block_id` in the **event payload carries the sensor ID** (`A1`, `A2`, `B1`, `B2`).
`block_id` in the **`GET /block-state` response carries the logical block**
(`A`, `B`). Both are specified by the contract and both are kept exactly as written.

| Sensor | GPIO | Logical block | Physical train | Transition | Resulting `state` |
|--------|------|---------------|----------------|-------------|-------------------|
| A1 | 22 | `A` | Train A | free → occupied | `occupied` |
| A2 | 19 | `A` | Train A | occupied → free | `free` |
| B1 | 21 | `B` | Train B | free → occupied | `occupied` |
| B2 | 18 | `B` | Train B | occupied → free | `free` |

### 2.1 Physical train → simulator train mapping

The physical junction trains are mapped onto **existing** simulator trains. No
existing ID, weight or priority is renamed or modified; the mapping is a lookup
layer only.

| Physical train | Simulator train | Name | Priority | Weight | Booked BL1 entry |
|----------------|-----------------|------|----------|--------|------------------|
| Train A | `T305` | Coal Freight 305 | 4 (lowest) | 1 | 26 min |
| Train B | `T408` | Superfast Express | 2 | 3 | 37 min |

Rationale: the physical demo table has a **lower-priority heavy freight** and a
**higher-priority express**. `T305` (freight, weight 1) and `T408` (express,
weight 3) are the two existing trains whose relative priority and weight reproduce
that situation, and they are consecutive in `BOOKED_ORDER` (`T305` → `T408`), so
the junction contention is modelled by the *existing* no-overtaking rule rather
than by a second, parallel model.

### 2.2 The junction as a shared block of capacity 1

The physical junction is **not** a new optimisation problem. It is modelled as
the existing corridor block `BL1` entering `Central Junction` (station `A`), which
the existing CP-SAT model already constrains with `AddNoOverlap` over intervals of
`run_min[BL1] + MIN_HEADWAY_MIN` — i.e. capacity 1 with the minimum headway
already built in.

| Junction parameter | Value | Source | Rationale |
|--------------------|-------|--------|-----------|

---

## 3. `POST /sensor-event`

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

| Field | Type | Validation |
|-------|------|------------|
| `block_id` | string | ∈ {`A1`, `A2`, `B1`, `B2`} |
| `state` | string | must be consistent with the sensor: `A1`/`B1` → `occupied`; `A2`/`B2` → `free` |
| `event_type` | string | ∈ {`sensor_triggered`} (contract value; unknown values rejected) |
| `timestamp` | integer | epoch **milliseconds**, > 0 |
| `source` | string | non-empty; used as the idempotency key |
| `seq` | integer | ≥ 0, monotonically increasing per `source` |

### 3.1 Valid state transitions

| Current block state | Sensor | Event | Result | Resulting `status` |
|---------------------|--------|-------|--------|--------------------|
| free | A1/B1 | `sensor_triggered` | free → occupied | `accepted` |
| occupied | A2/B2 | `sensor_triggered` | occupied → free | `accepted` |
| occupied | A1/B1 | `sensor_triggered` | *redundant* (no transition) | `ignored` (`state_redundant`) |
| free | A2/B2 | `sensor_triggered` | *redundant* (no transition) | `ignored` (`state_redundant`) |

### 3.2 Idempotency (per `source`)

The backend keeps `last_accepted_seq[source]`.

- `seq > last_accepted_seq` → the event is processed.
- `seq <= last_accepted_seq` → the event is a **no-op**: no state change, no
  optimizer call, `200` with `{"status": "ignored", "reason": "duplicate_or_stale_seq"}`.

**Decision (recorded assumption):** a *state-redundant but new-seq* event **is**
recorded into `last_accepted_seq`. Rationale: the event was delivered, it was well
formed, it carried a new sequence number, and the firmware has already advanced its
counter. Rejecting it without advancing the counter would only invite a
retransmission storm. Recording it also means a later replay of the same `seq` is
correctly ignored.

### 3.3 ESP32 reboot and `seq` reset

If the ESP32 reboots, its `seq` restarts at 0 while the backend still holds a
higher `last_accepted_seq`, so every post-reboot event would be ignored. Two
supported remedies, both documented:

1. **Boot-time seeding (recommended, default in the firmware snippet).** The
   firmware sets its first `seq` to `epoch_ms / 1000` at boot, so a reboot always
   produces a `seq` far above any previously accepted value.
2. **`POST /sensor-event/reset`** clears occupancy *and* the `last_accepted_seq`
   table. Use it for rehearsals, demos and tests, and after a firmware reflash
   that changes the seeding scheme.

The two are complementary: seeding protects against silent reboot loss, the reset
endpoint is the documented manual recovery.

### 3.4 Reset endpoint (demo / test utility)

`POST /sensor-event/reset` clears block occupancy, the `last_accepted_seq` table,
the stored decision and the event log. It is a **demo and test utility**, not an
operational command: it is unauthenticated and must not be exposed outside a
controlled prototype network.

| Occupancy of a train in the junction | `run_min[train]["BL1"]` (8 min for `T305`, 5 min for `T408`) | existing `simulator.TRAINS` | taken from the existing topology, not invented |
| Clearance after the preceding train | `MIN_HEADWAY_MIN = 3` min | existing `simulator.MIN_HEADWAY_MIN` | existing corridor headway, reused unchanged |
| Conflict threshold | gap < occupancy + headway | derived | two trains cannot both be served within that window |

---

## 4. `GET /block-state`

```json
{
  "blocks": [
    { "block_id": "A", "signal": "PROCEED" },
    { "block_id": "B", "signal": "HOLD" }
  ],
  "reason": "Train B holds because Train A is currently prioritized.",
  "timestamp": "2026-09-29T10:15:00.000Z",
  "stale": false
}
```

| Case | Block A | Block B | Behaviour |
|------|---------|---------|-----------|
| all-clear | free | free | both `PROCEED` |
| A only | occupied | free | A `PROCEED` (no optimiser run) |
| B only | free | occupied | B `PROCEED` (no optimiser run) |
| conflict | occupied | occupied | signals come from the CP-SAT decision, **never** a hard-coded fallback |

An optional `decision` object is appended (`{"source": "cpsat"|"fallback"|"none",
"run_id": ..., "at": ...}`). It is additive; the four contract fields above never
change shape, so a cheap ESP32 parser keeps working.

### 4.1 Staleness

- `stale: true` when **no hardware event has ever been received** (the `reason`
  says so explicitly), and when the last accepted event is older than the
  threshold.
- Default threshold: **10.0 s**, overridable with the environment variable
  `HARDWARE_STALE_THRESHOLD_S`.
- `stale` never changes the signal values; it is a data-freshness flag. The ESP32
  applies its own safe LED state on `stale == true` (section 7).

### 4.2 Polling

Polling only, **every 1–2 s**. No WebSockets, no MQTT, no push channel.

---

## 5. Duplicate and out-of-order protection summary

| Situation | `seq` handling | State | Optimizer | Response |
|-----------|----------------|-------|-----------|----------|
| first event | recorded | mutated | maybe | `accepted` |
| same-`seq` retransmission | not re-recorded | unchanged | no | `ignored` / `duplicate_or_stale_seq` |
| lower `seq` (out of order) | not re-recorded | unchanged | no | `ignored` / `duplicate_or_stale_seq` |
| new `seq`, redundant state | recorded | unchanged | no | `ignored` / `state_redundant` |
| malformed payload | not recorded | unchanged | no | `422` |

---

## 6. Logging

Structured, one line per event, logger name `junction.hardware`:

| Event | Level | Fields |
|-------|-------|--------|
| accepted | INFO | `source`, `seq`, `sensor_id`, `block_id`, `train_id`, `state` |
| duplicate/stale | INFO | `source`, `seq`, `last_accepted_seq` |
| invalid | WARNING | `source`, `seq`, `reason` |
| state-redundant | INFO | `source`, `seq`, `sensor_id`, `current_state` |
| optimizer trigger | INFO | `run_id`, `gap_min`, `decision_source`, `solver_status`, `wall_time_ms` |
| fallback | WARNING | `run_id`, `reason` |

---

## 7. ESP32 side obligations (summary)

- POST `/sensor-event` with a monotonically increasing `seq` per `source`
  (boot-time seeded, section 3.3).
- Poll `GET /block-state` every 1–2 s.
- Drive the PROCEED / HOLD LEDs from the `signal` field.
- On HTTP/WiFi failure: retry with exponential backoff and show a **distinct
  blink** pattern. On `stale: true`, show the same safe blink. The backend never
  sends "PROCEED by default because the network is down" — a lost link must not
  look like a clear road.
- Base URL is configurable (Wokwi needs a reachable URL: LAN IP or a tunnel).

---

## 8. Honest limitations

- No real track circuit, axle counter or certified sensor is involved.
- The junction occupancy and headway parameters are scale-model values.
- Nothing here has been verified against railway hardware: see
  `docs/demo_runbook.md` for the manual procedure.


These are **prototype scale-model parameters** for a tabletop junction. They are
not railway-certified values and carry no operational meaning.
