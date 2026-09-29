// Core identity, navigation and headline KPI data.
// Mirrors the locked technology reference of the remaining-work plan.

export const SYSTEM = {
  name: 'RailGuard AI',
  subtitle: 'Train Traffic Control — Decision Support',
  corridor: 'Junction 14 · Mainline A / B',
  safety: 'Decision-support prototype — not safety-certified railway infrastructure.',
  build: 'Phase B · Hardware verification',
}

export const NAV = [
  { id: 'overview', label: 'Overview', icon: 'grid' },
  { id: 'live', label: 'Live Junction', icon: 'track' },
  { id: 'decision', label: 'Decision Core', icon: 'cpu' },
  { id: 'analytics', label: 'Analytics', icon: 'chart' },
  { id: 'hardware', label: 'Hardware Bridge', icon: 'board' },
  { id: 'plan', label: 'Delivery Plan', icon: 'flag' },
]

export const KPIS = [
  {
    id: 'throughput',
    label: 'Trains cleared / hour',
    value: 46,
    decimals: 0,
    trend: 12.4,
    caption: 'Legacy baseline: 41',
    tone: 'teal',
    spark: [30, 33, 31, 36, 38, 37, 42, 41, 45, 43, 46, 46],
  },
  {
    id: 'delay',
    label: 'Average delay',
    value: 2.4,
    decimals: 1,
    suffix: ' min',
    trend: -31.2,
    caption: 'Down from 3.5 min baseline',
    tone: 'indigo',
    spark: [3.5, 3.4, 3.6, 3.1, 3.0, 2.9, 2.8, 2.6, 2.7, 2.5, 2.4, 2.4],
  },
  {
    id: 'conflicts',
    label: 'Conflicts resolved',
    value: 128,
    decimals: 0,
    trend: 8.1,
    caption: '100 % validated before signalling',
    tone: 'violet',
    spark: [8, 9, 11, 10, 12, 14, 13, 15, 16, 15, 17, 18],
  },
  {
    id: 'solver',
    label: 'CP-SAT solve time',
    value: 11.8,
    decimals: 1,
    suffix: ' ms',
    trend: -18.5,
    caption: 'Budget 50–100 ms',
    tone: 'cyan',
    spark: [22, 21, 19, 20, 18, 16, 15, 17, 14, 13, 12, 11.8],
  },
  {
    id: 'events',
    label: 'Sensor events / min',
    value: 7.2,
    decimals: 1,
    trend: 2.4,
    caption: 'ESP32 · GPIO 22 / 19 / 21 / 18',
    tone: 'blue',
    spark: [5.1, 6.0, 5.4, 6.8, 7.1, 6.2, 7.6, 7.0, 7.4, 6.9, 7.3, 7.2],
  },
  {
    id: 'uptime',
    label: 'Bridge uptime',
    value: 99.98,
    decimals: 2,
    suffix: ' %',
    trend: 0.02,
    caption: 'Last 24 h · 0 restarts',
    tone: 'emerald',
    spark: [99.6, 99.7, 99.8, 99.8, 99.9, 99.9, 100, 99.9, 99.9, 100, 100, 99.98],
  },
]

export const STACK = [
  {
    group: 'Core',
    rows: [
      ['Backend', 'Python 3.10+'],
      ['API', 'FastAPI + Pydantic v2'],
      ['Optimizer', 'OR-Tools CP-SAT'],
      ['Simulation', 'Custom Python modules'],
      ['Frontend', 'React 19 + Vite'],
      ['Testing', 'pytest + TestClient'],
    ],
  },
  {
    group: 'Hardware',
    rows: [
      ['MCU', 'ESP32 (Wokwi)'],
      ['Firmware', 'sketch.ino'],
      ['GPIO', '22 / 19 / 21 / 18'],
      ['Transport', 'HTTP REST over Wi-Fi'],
      ['Endpoints', 'POST /sensor-event · GET /block-state'],
    ],
  },
  {
    group: 'Deferred',
    rows: [
      ['Database', 'PostgreSQL (SQLAlchemy)'],
      ['Migrations', 'SQL / Alembic'],
      ['BI', 'Power BI + Power Query'],
      ['In-app charts', 'Chart.js (with Recharts)'],
      ['ML', 'scikit-learn · joblib'],
    ],
  },
]
