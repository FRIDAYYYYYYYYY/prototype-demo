import Icon from './Icon.jsx'
import { KPIS, SYSTEM } from '../data/core.js'
import { CONFLICT } from '../data/decision.js'
import { usePolledEndpoint } from '../hooks.js'
import { toLiveKpis } from '../adapters.js'
import { Badge, Button, Sparkline, StatusDot } from './ui.jsx'
import { useCountUpNumber, useStaggerEntrance } from '../motion/hooks.js'
import api from '../api.js'

function KpiCard({ kpi, index }) {
  const shown = useCountUpNumber(kpi.value, { decimals: kpi.decimals })

  return (
    <article
      className={`kpi tone-${kpi.tone} motion-item`}
      style={{ '--i': index }}
    >
      <div className="kpi__top">
        <span className="kpi__label">{kpi.label}</span>
        <span className={`kpi__delta ${kpi.trend >= 0 ? 'is-up' : 'is-down'}`}>
          <Icon name="arrow" size={12} />
          {Math.abs(kpi.trend)}%
        </span>
      </div>

      <div className="kpi__value">
        {shown}
        {kpi.suffix && <span className="kpi__suffix">{kpi.suffix}</span>}
      </div>

      <div className="kpi__spark">
        <Sparkline points={kpi.spark} tone={kpi.tone} />
      </div>

      <p className="kpi__caption">{kpi.caption}</p>
    </article>
  )
}

/**
 * Live corridor KPIs, falling back to recorded static values when backend is offline.
 */
function liveCards(live) {
  if (!live) return KPIS.map((k) => ({ ...k, trend: 0 }))
  return [
    { id: 'delay', label: 'Total delay', value: live.totalDelay, decimals: 0, suffix: ' min', tone: 'indigo', spark: [live.totalDelay], caption: `Worst train ${live.maxDelay} min`, trend: 0 },
    { id: 'conflicts', label: 'Active conflicts', value: live.conflicts, decimals: 0, tone: 'violet', spark: [live.conflicts], caption: `Cascade had ${live.cascadeConflicts}`, trend: 0 },
    { id: 'ontime', label: 'On-time trains', value: live.onTime, decimals: 0, tone: 'teal', spark: [live.onTime], caption: `${live.delayed} delayed`, trend: 0 },
    { id: 'solver', label: 'CP-SAT solve time', value: live.solverMs ?? 0, decimals: 1, suffix: ' ms', tone: 'cyan', spark: [live.solverMs ?? 0], caption: live.activeScheduleLabel, trend: 0 },
  ]
}

export default function Overview({ onJump }) {
  const { data: results } = usePolledEndpoint(api.results, 3000)
  const { data: ml } = usePolledEndpoint(api.mlInsights, 5000)

  const containerRef = useStaggerEntrance({ selector: '.motion-item', delay: 50 })
  const live = toLiveKpis(results)
  const insight = ml?.insights ?? null
  const cards = liveCards(live)

  return (
    <div className="overview" ref={containerRef}>
      <section className="hero motion-item" id="overview">
        <div className="hero__glow-orb" />
        <div className="hero__copy">
          <span className="hero__eyebrow">
            <Icon name="pulse" size={15} />
            Live decision support · {live ? live.activeScheduleLabel : SYSTEM.build}
          </span>

          <h1 className="hero__title">
            Precise train traffic control,
            <span className="hero__grad"> proven by measurement.</span>
          </h1>

          <p className="hero__lead">
            Sensor event → backend state → conflict detection → CP-SAT optimisation →
            independent validation → explainable recommendation → physical signal.
            Every decision is auditable before it reaches the hardware.
          </p>

          <div className="hero__actions">
            <Button icon="bolt" variant="primary" onClick={() => onJump('live')}>
              Open live junction
            </Button>
            <Button icon="chart" variant="outline" onClick={() => onJump('analytics')}>
              See measured gain
            </Button>
            <Button icon="flag" variant="ghost" onClick={() => onJump('plan')}>
              Remaining work
            </Button>
          </div>

          <div className="hero__chips">
            <Badge tone="teal" dot pulse>
              CP-SAT solved in {CONFLICT.cpsat.solveMs} ms
            </Badge>
            <Badge tone="success">Weighted delay {CONFLICT.legacy.weighted} → {CONFLICT.cpsat.weighted}</Badge>
            <Badge tone="indigo">{CONFLICT.cpsat.improvement}% better than legacy</Badge>
            <Badge tone="violet">Validator 6 / 6 PASS</Badge>
          </div>
        </div>

        <div className="hero__panel">
          <div className="hero__panelhead">
            <StatusDot tone={live ? 'success' : 'muted'} label={live ? 'Signal advisory' : 'Recorded values'} />
            <span className="mono hero__panelid">{CONFLICT.id}</span>
          </div>
          <div className="hero__decision">
            <span className="hero__decisionlabel">Recommendation</span>
            <strong className="hero__decisiontext">PROCEED Train A (Express)</strong>
            <span className="hero__decisionsub">HOLD Train B (Freight) · 2.1 min delay</span>
          </div>
          <div className="hero__bars">
            <div className="hero__bar">
              <span>Legacy weighted delay</span>
              <div className="track"><i className="fill is-legacy" style={{ width: '100%' }} /></div>
              <b className="mono">9.2 min</b>
            </div>
            <div className="hero__bar">
              <span>CP-SAT weighted delay</span>
              <div className="track"><i className="fill is-cpsat" style={{ width: '50%' }} /></div>
              <b className="mono">4.6 min</b>
            </div>
          </div>
          <p className="hero__foot">
            <Icon name="info" size={14} />
            Advisory output for a human dispatcher — the model never actuates signals alone.
          </p>
        </div>
      </section>

      <div className="kpigrid">
        {cards.map((kpi, i) => (
          <KpiCard key={kpi.id} kpi={kpi} index={i} />
        ))}
      </div>

      {insight && (
        <div className="mlstrip motion-item">
          <div className="mlstrip__head">
            <Icon name="cpu" size={16} />
            <strong>ML advisory</strong>
            <span className="mono mlstrip__version">{insight.model_version}</span>
            <Badge tone={insight.confidence === 'trained' ? 'teal' : 'muted'}>
              {insight.confidence}
            </Badge>
          </div>
          <div className="mlstrip__stats">
            <span>Predicted delay <b>{insight.predicted_delay_minutes} min</b></span>
            <span>Conflict risk <b>{insight.conflict_risk}</b></span>
            <span>Inference <b>{insight.latency_ms} ms</b></span>
          </div>
          <p className="mlstrip__note">
            <Icon name="shield" size={13} />
            {insight.note}
          </p>
        </div>
      )}
    </div>
  )
}
