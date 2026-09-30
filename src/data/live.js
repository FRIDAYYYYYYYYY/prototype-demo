// Live junction state: blocks, signals and the sensor event stream.

export const SIGNAL_STATES = {
  PROCEED: { tone: 'success', label: 'PROCEED', hint: 'Line clear for this approach' },
  HOLD: { tone: 'danger', label: 'HOLD', hint: 'Approach held for the other movement' },
  CAUTION: { tone: 'warn', label: 'CAUTION', hint: 'Cleared, but delay applied' },
  STALE: { tone: 'warn', label: 'STALE', hint: 'No heartbeat within tolerance' },
  OFFLINE: { tone: 'muted', label: 'OFFLINE', hint: 'Device not connected' },
}

export const BLOCKS = [
  { id: 'A1', name: 'Approach A — outer', gpio: 22, approach: 'A', state: 'ACTIVE', position: 0.14 },
  { id: 'A2', name: 'Approach A — inner', gpio: 19, approach: 'A', state: 'CLEAR', position: 0.32 },
  { id: 'B1', name: 'Approach B — outer', gpio: 21, approach: 'B', state: 'ACTIVE', position: 0.68 },
  { id: 'B2', name: 'Approach B — inner', gpio: 18, approach: 'B', state: 'CLEAR', position: 0.86 },
]

export const SIGNALS = [
  { id: 'SIG-A', approach: 'A', block: 'A1', state: 'PROCEED', since: '10:42:18', reason: 'Priority class 1 — express cleared first' },
  { id: 'SIG-B', approach: 'B', block: 'B1', state: 'HOLD', since: '10:42:18', reason: 'Held for junction occupancy' },
  { id: 'SIG-W', approach: '—', block: 'JUNCTION-14', state: 'CAUTION', since: '10:42:18', reason: 'Conflict resolved — clearance delayed 2.1 min' },
  { id: 'SIG-P', approach: '—', block: 'PLANT', state: 'PROCEED', since: '10:42:12', reason: 'Heartbeat nominal · -54 dBm' },
]

export const EVENTS = [
  { seq: 1042, block: 'A1', approach: 'A', state: 'ACTIVE', source: 'esp32-01', ms: 41, result: 'Conflict detected' },
  { seq: 1041, block: 'B1', approach: 'B', state: 'ACTIVE', source: 'esp32-01', ms: 38, result: 'Conflict detected' },
  { seq: 1040, block: 'A2', approach: 'A', state: 'CLEAR', source: 'esp32-01', ms: 12, result: 'State cleared' },
  { seq: 1039, block: 'A1', approach: 'A', state: 'ACTIVE', source: 'esp32-01', ms: 40, result: 'Single train — A PROCEED' },
  { seq: 1038, block: 'A1', approach: 'A', state: 'ACTIVE', source: 'esp32-01', ms: 9, result: 'Duplicate sequence ignored' },
  { seq: 1037, block: 'B2', approach: 'B', state: 'CLEAR', source: 'esp32-01', ms: 11, result: 'State cleared' },
  { seq: 1036, block: 'B1', approach: 'B', state: 'ACTIVE', source: 'esp32-01', ms: 42, result: 'Single train — B PROCEED' },
  { seq: 1035, block: 'B2', approach: 'B', state: 'ACTIVE', source: 'esp32-01', ms: 39, result: 'Conflict detected' },
  { seq: 1034, block: 'A2', approach: 'A', state: 'ACTIVE', source: 'esp32-01', ms: 37, result: 'Reverse conflict detected' },
  { seq: 1033, block: 'A2', approach: 'A', state: 'CLEAR', source: 'esp32-01', ms: 10, result: 'State cleared' },
  { seq: 1032, block: 'B2', approach: 'B', state: 'CLEAR', source: 'esp32-01', ms: 13, result: 'State cleared' },
  { seq: 1031, block: 'A1', approach: 'A', state: 'ACTIVE', source: 'esp32-01', ms: 44, result: 'Conflict detected' },
]

// Replay scenarios required by the test matrix (Phase A / B).
export const REPLAYS = [
  { id: 'R1', name: 'A-only clearance', steps: 'A1 → A2', expect: 'A PROCEED, cleared after A2', state: 'pass' },
  { id: 'R2', name: 'B-only clearance', steps: 'B1 → B2', expect: 'B PROCEED, cleared after B2', state: 'pass' },
  { id: 'R3', name: 'Forward conflict', steps: 'A1 → B1', expect: 'CP-SAT invoked, one approach held', state: 'pass' },
  { id: 'R4', name: 'Reverse conflict', steps: 'B1 → A1', expect: 'Opposite arrival order handled', state: 'pass' },
  { id: 'R5', name: 'Duplicate sequence', steps: 'A1 → A1', expect: 'Second A1 ignored (idempotent)', state: 'pass' },
]
