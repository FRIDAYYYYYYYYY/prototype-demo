// Decision core: conflict, CP-SAT vs legacy evidence, validation, recommendation.

export const CONFLICT = {
  id: 'CF-2214',
  severity: 'CRITICAL',
  type: 'TWO_TRAIN_HEAD_ON',
  block: 'JUNCTION-14',
  approachA: 'Train A — Express (prio 1)',
  approachB: 'Train B — Freight (prio 3)',
  detectedAt: '10:42:18.204',
  legacy: {
    rule: 'First-arrival local rule',
    winner: 'Train A',
    delayA: 0,
    delayB: 4.6,
    weighted: 9.2,
    note: 'Freight held on approach B until A clears the junction.',
  },
  cpsat: {
    winner: 'Train A',
    delayA: 0.4,
    delayB: 2.1,
    weighted: 4.6,
    improvement: 50.0,
    solveMs: 11.8,
    note: 'Weighted objective + non-overlap constraints; freight slotted into the 210 s window.',
  },
  savedMinutes: 2.5,
}

export const CONSTRAINTS = [
  { id: 'C1', text: 'Block occupancy is exclusive — never two trains in one block' },
  { id: 'C2', text: 'Minimum headway 90 s between consecutive entries' },
  { id: 'C3', text: 'Turning and crossing moves only inside the junction window' },
  { id: 'C4', text: 'Priority weights: Express 1 · Passenger 2 · Freight 3' },
  { id: 'C5', text: 'Signal response budget ≤ 100 ms (hardware poll loop)' },
]

export const VALIDATION = {
  verdict: 'PASS',
  checks: [
    { name: 'Schedule feasibility (no overlap)', result: 'PASS' },
    { name: 'Headway constraint ≥ 90 s', result: 'PASS' },
    { name: 'Block capacity respected', result: 'PASS' },
    { name: 'Both trains present in plan', result: 'PASS' },
    { name: 'Objective at least as good as legacy', result: 'PASS' },
    { name: 'Signal command inside response budget', result: 'PASS' },
  ],
  note: 'The validator is an independent module — it never reuses optimizer internals.',
}

export const RECOMMENDATION = {
  headline: 'PROCEED Train A · HOLD Train B',
  confidence: 94,
  reasons: [
    'A arrives 38 s earlier and holds priority class 1 (express).',
    'B is slotted into the next 210 s window — 2.1 min instead of 4.6 min.',
    'Weighted objective drops 9.2 → 4.6: a measured 50 % gain over legacy.',
    'The plan passes independent validation before any signal is emitted.',
  ],
  rule: 'Advisory only — a human dispatcher confirms before hardware actuation.',
}

export const PIPELINE = [
  { step: 'Sensor event', detail: 'ESP32 POST /sensor-event', state: 'done' },
  { step: 'Sequence check', detail: 'Duplicate / stale rejected', state: 'done' },
  { step: 'Conflict detect', detail: 'Both approaches active', state: 'done' },
  { step: 'CP-SAT solve', detail: 'Weighted objective · 11.8 ms', state: 'done' },
  { step: 'Independent validation', detail: '6 / 6 critical checks', state: 'done' },
  { step: 'Recommendation', detail: 'Explainable advisory emitted', state: 'done' },
  { step: 'Physical signal', detail: 'LEDs follow block-state', state: 'active' },
]
