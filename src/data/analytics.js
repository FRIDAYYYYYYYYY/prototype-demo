// Analytics payloads (Phase D/E) and the hardware bridge contract (Phase A/B).

export const ANALYTICS = {
  delayCompare: {
    title: 'Weighted delay — legacy vs CP-SAT',
    note: 'Identical physical sensor events, two decision rules.',
    max: 10,
    series: [
      { label: 'A only', legacy: 0, cpsat: 0 },
      { label: 'B only', legacy: 0, cpsat: 0 },
      { label: 'A → B', legacy: 6.1, cpsat: 3.4 },
      { label: 'B → A', legacy: 7.8, cpsat: 3.9 },
      { label: 'Freight + express', legacy: 9.2, cpsat: 4.6 },
    ],
  },
  trend: {
    title: 'Average delay, last 12 runs',
    note: 'Legacy rule shown as the flat dashed reference.',
    labels: ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8', 'R9', 'R10', 'R11', 'R12'],
    cpsat: [3.5, 3.4, 3.6, 3.2, 3.0, 2.9, 2.8, 2.6, 2.7, 2.5, 2.4, 2.4],
    legacy: [3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5],
    max: 4,
  },
  mix: {
    title: 'Conflict type mix',
    note: '128 conflicts resolved by CP-SAT.',
    slices: [
      { label: 'Head-on', value: 46, tone: 'teal' },
      { label: 'Priority clash', value: 34, tone: 'indigo' },
      { label: 'Turn vs straight', value: 28, tone: 'violet' },
      { label: 'Duplicate / stale', value: 20, tone: 'slate' },
    ],
  },
  powerbi: [
    { name: 'Train Flow & Delay', grain: 'Per run', status: 'Model ready' },
    { name: 'Conflict Audit Trail', grain: 'Per conflict', status: 'Model ready' },
    { name: 'KPI Snapshot Trend', grain: 'Hourly', status: 'Pending Phase D' },
  ],
  ml: [
    { name: 'Delay predictor', model: 'Random Forest', status: 'Awaiting Phase D data' },
    { name: 'Cascade risk', model: 'Gradient Boosting', status: 'Awaiting Phase D data' },
    { name: 'Sensor anomaly', model: 'Isolation Forest', status: 'Feature-flagged' },
  ],
}

export const HARDWARE = {
  device: 'ESP32 · wokwi-esp32-v3',
  firmware: 'sketch.ino v1.4.2',
  ip: '192.168.4.21',
  rssi: -54,
  latency: 38,
  contract: [
    { method: 'POST', path: '/sensor-event', purpose: 'GPIO 22/19/21/18 → block state', auth: 'none (LAN)' },
    { method: 'GET', path: '/block-state', purpose: 'Signal, reason, timestamp, stale flag', auth: 'none (LAN)' },
    { method: 'GET', path: '/health', purpose: 'Firmware watchdog liveness', auth: 'none' },
    { method: 'GET', path: '/results', purpose: 'Schedule, validator, recommendation', auth: 'none' },
  ],
  pins: [
    { pin: 'GPIO 22', block: 'A1', dir: 'INPUT', pull: 'PULLDOWN', signal: 'LED_GREEN_A' },
    { pin: 'GPIO 19', block: 'A2', dir: 'INPUT', pull: 'PULLDOWN', signal: 'LED_RED_A' },
    { pin: 'GPIO 21', block: 'B1', dir: 'INPUT', pull: 'PULLDOWN', signal: 'LED_GREEN_B' },
    { pin: 'GPIO 18', block: 'B2', dir: 'INPUT', pull: 'PULLDOWN', signal: 'LED_RED_B' },
  ],
  schema: {
    title: 'POST /sensor-event',
    fields: [
      ['source', 'string', 'esp32-01'],
      ['seq', 'int', '1042 (monotonic)'],
      ['block_id', "A1|A2|B1|B2", 'A1'],
      ['state', 'ACTIVE|CLEAR', 'ACTIVE'],
      ['timestamp', 'ISO-8601', '10:42:18.204Z'],
    ],
  },
}
