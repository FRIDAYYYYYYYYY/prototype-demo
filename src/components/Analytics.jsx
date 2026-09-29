import { ANALYTICS } from '../data/analytics.js'
import Icon from './Icon.jsx'
import { toTrend } from '../adapters.js'
import { usePolledEndpoint } from '../hooks.js'
import { Badge, Card, PanelTitle } from './ui.jsx'
import api from '../api.js'

/* Chart slices use the neutral, accessible series ramp rather than hues. */
const TONE_VAR = {
  teal: 'var(--series-c)',
  indigo: 'var(--series-a)',
  violet: 'var(--series-d)',
  slate: 'var(--muted)',
  cyan: 'var(--series-f)',
}

function DelayCompare() {
  const { series, max } = ANALYTICS.delayCompare
  return (
    <Card className="chart" >
      <PanelTitle icon="chart" title={ANALYTICS.delayCompare.title} meta="weighted objective" tone="teal" />
      <p className="chart__note">{ANALYTICS.delayCompare.note}</p>
      <div className="barchart">
        {series.map((s) => (
          <div key={s.label} className="barchart__group">
            <div className="barchart__bars">
              <i
                className="barchart__bar is-legacy"
                style={{ height: `${(s.legacy / max) * 100}%` }}
                title={`Legacy ${s.legacy}`}
              />
              <i
                className="barchart__bar is-cpsat"
                style={{ height: `${(s.cpsat / max) * 100}%` }}
                title={`CP-SAT ${s.cpsat}`}
              />
            </div>
            <span className="barchart__label">{s.label}</span>
            <span className="barchart__delta mono">
              {s.legacy ? `−${Math.round(((s.legacy - s.cpsat) / s.legacy) * 100)}%` : '—'}
            </span>
          </div>
        ))}
      </div>
      <div className="chart__legend">
        <span><i className="dot is-legacy" /> Legacy</span>
        <span><i className="dot is-cpsat" /> CP-SAT</span>
      </div>
    </Card>
  )
}

function Trend() {
  // Live stored KPI history when persistence is on; the recorded series
  // otherwise, so the chart is never empty on a fresh checkout.
  const { data: persistence } = usePolledEndpoint(api.persistence, 5000)
  const live = toTrend(persistence?.kpi_series)

  const labels = live ? live.map((r) => r.label) : ANALYTICS.trend.labels
  const cpsat = live ? live.map((r) => r.value) : ANALYTICS.trend.cpsat
  const legacy = ANALYTICS.trend.legacy
  const max = live ? Math.max(1, ...cpsat) * 1.2 : ANALYTICS.trend.max

  const isLive = Boolean(live)
  const W = 460
  const H = 190
  const padX = 34
  const padY = 22
  const x = (i) => padX + (i * (W - padX * 2)) / (labels.length - 1)
  const y = (v) => H - padY - (v / max) * (H - padY * 2)
  const path = (arr) => arr.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ')
  const area = `${path(cpsat)} L${x(cpsat.length - 1)} ${H - padY} L${x(0)} ${H - padY} Z`

  return (
    <Card className="chart">
      <PanelTitle
        icon="pulse"
        title={isLive ? 'Total delay, stored runs' : ANALYTICS.trend.title}
        meta={isLive ? `${live.length} stored runs` : '3.5 → 2.4 min'}
        tone="indigo"
      />
      <p className="chart__note">
        {isLive
          ? 'Measured from the persisted kpi_snapshots table (Phase D).'
          : ANALYTICS.trend.note}
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} className="linechart" role="img" aria-label="Average delay trend">
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3, 4].map((g) => (
          <g key={g}>
            <line x1={padX} y1={y((g * max) / 4)} x2={W - padX} y2={y((g * max) / 4)} className="linechart__grid" />
            <text x={padX - 8} y={y((g * max) / 4) + 4} textAnchor="end" className="linechart__ylab">
              {((g * max) / 4).toFixed(1)}
            </text>
          </g>
        ))}
        <path d={area} fill="url(#trendFill)" />
        <path d={path(legacy)} className="linechart__legacy" fill="none" />
        <path d={path(cpsat)} className="linechart__main" fill="none" />
        {cpsat.map((v, i) => (
          <circle key={labels[i]} cx={x(i)} cy={y(v)} r="3.2" className="linechart__dot" />
        ))}
        {labels.map((l, i) =>
          i % 2 === 0 ? (
            <text key={l} x={x(i)} y={H - 6} textAnchor="middle" className="linechart__xlab">
              {l}
            </text>
          ) : null,
        )}
      </svg>
      <div className="chart__legend">
        <span><i className="dot is-cpsat" /> CP-SAT</span>
        <span><i className="dot is-legacy" /> Legacy (dashed)</span>
      </div>
    </Card>
  )
}


function Donut() {
  const { slices } = ANALYTICS.mix
  const total = slices.reduce((a, s) => a + s.value, 0)
  const R = 62
  const C = 2 * Math.PI * R

  // Pre-compute each arc length and its dash offset without mutating during render.
  const arcs = slices.reduce((acc, s) => {
    const len = (s.value / total) * C
    acc.push({ ...s, len, offset: acc.length ? acc[acc.length - 1].offset + acc[acc.length - 1].len : 0 })
    return acc
  }, [])

  return (
    <Card className="chart chart--donut">
      <PanelTitle icon="grid" title={ANALYTICS.mix.title} meta={`${total} total`} tone="violet" />
      <p className="chart__note">{ANALYTICS.mix.note}</p>
      <div className="donut">
        <svg viewBox="0 0 160 160" className="donut__svg" role="img" aria-label="Conflict type mix">
          <circle cx="80" cy="80" r={R} className="donut__bg" />
          {arcs.map((a) => (
            <circle
              key={a.label}
              cx="80"
              cy="80"
              r={R}
              className="donut__seg"
              stroke={TONE_VAR[a.tone]}
              strokeDasharray={`${a.len - 3} ${C - a.len + 3}`}
              strokeDashoffset={-a.offset}
            />
          ))}
          <text x="80" y="76" textAnchor="middle" className="donut__value">
            {total}
          </text>
          <text x="80" y="94" textAnchor="middle" className="donut__cap">
            conflicts
          </text>
        </svg>
        <ul className="donut__legend">
          {slices.map((s) => (
            <li key={s.label}>
              <i className="dot" style={{ background: TONE_VAR[s.tone] }} />
              <span className="donut__name">{s.label}</span>
              <b>{s.value}</b>
              <small className="mono">{Math.round((s.value / total) * 100)}%</small>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  )
}

function RoadmapTech() {
  // Real layer state, so the panel reports what is actually running.
  const { data: persistence } = usePolledEndpoint(api.persistence, 5000)
  const { data: mlStatus } = usePolledEndpoint(api.mlStatus, 5000)

  const dbOn = Boolean(persistence?.enabled)
  const predictor = mlStatus?.predictor
  const mlOn = Boolean(predictor?.enabled)
  const trained = Boolean(predictor?.trained)

  const powerbi = ANALYTICS.powerbi.map((p) => ({
    ...p,
    status: dbOn ? 'Model ready' : p.status,
  }))
  const ml = [
    {
      name: 'Delay predictor',
      model: predictor?.model_version ?? 'Random Forest',
      status: mlOn ? (trained ? 'Active · trained' : 'Active · heuristic') : 'Flag off',
    },
    {
      name: 'Conflict risk',
      model: 'Weighted rule',
      status: mlOn ? 'Active' : 'Flag off',
    },
    {
      name: 'Sensor anomaly',
      model: mlStatus?.anomaly_detector?.version ?? 'gap-detector',
      status: mlOn ? 'Active' : 'Flag off',
    },
  ]

  return (
    <Card className="chart chart--roadmap">
      <PanelTitle
        icon="db"
        title="Platform layers"
        meta={`Phase D ${dbOn ? 'on' : 'off'} · Phase F ${mlOn ? 'on' : 'off'}`}
        tone="cyan"
      />
      <div className="techgrid">
        <div className="techcol">
          <span className="techcol__head">
            <Icon name="db" size={15} /> PostgreSQL history
          </span>
          <ul>
            {powerbi.map((p) => (
              <li key={p.name}>
                <div>
                  <strong>{p.name}</strong>
                  <small className="mono">{p.grain}</small>
                </div>
                <Badge tone={dbOn ? 'success' : 'muted'}>{dbOn ? 'Stored' : p.status}</Badge>
              </li>
            ))}
          </ul>
        </div>
        <div className="techcol">
          <span className="techcol__head">
            <Icon name="cpu" size={15} /> ML advisory
          </span>
          <ul>
            {ml.map((m) => (
              <li key={m.name}>
                <div>
                  <strong>{m.name}</strong>
                  <small className="mono">{m.model}</small>
                </div>
                <Badge tone={m.status.startsWith('Active') ? 'violet' : 'muted'}>{m.status}</Badge>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="chart__foot">
        <Icon name="shield" size={14} />
        ML insights are advisory only — PROCEED / HOLD is never decided by a model alone, and a feature
        flag disables the layer entirely.
      </p>
    </Card>
  )
}

export default function Analytics() {
  return (
    <div className="analytics">
      <DelayCompare />
      <Trend />
      <Donut />
      <RoadmapTech />
    </div>
  )
}
