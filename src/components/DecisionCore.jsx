import { useState, useRef, useEffect } from 'react'
import { animate, stagger } from 'animejs'
import { CONFLICT, CONSTRAINTS, PIPELINE, RECOMMENDATION, VALIDATION } from '../data/decision.js'
import Icon from './Icon.jsx'
import { Badge, Card, Meter, PanelTitle, Stat } from './ui.jsx'
import { useCountUpNumber, useStaggerEntrance } from '../motion/hooks.js'
import { DURATION, EASING, isReducedMotion } from '../motion/tokens.js'

function CaseComparison() {
  const [activeCase, setActiveCase] = useState('case3') // 'case2' | 'case3'
  const isCase3 = activeCase === 'case3'

  const weightedVal = isCase3 ? CONFLICT.cpsat.weighted : CONFLICT.legacy.weighted
  const animatedWeighted = useCountUpNumber(weightedVal, { decimals: 1 })

  const delayAVal = isCase3 ? CONFLICT.cpsat.delayA : CONFLICT.legacy.delayA
  const animatedDelayA = useCountUpNumber(delayAVal, { decimals: 1 })

  const delayBVal = isCase3 ? CONFLICT.cpsat.delayB : CONFLICT.legacy.delayB
  const animatedDelayB = useCountUpNumber(delayBVal, { decimals: 1 })

  const barRef = useRef(null)

  useEffect(() => {
    if (!barRef.current || isReducedMotion()) return
    const bars = barRef.current.querySelectorAll('.cmp__bar-fill')
    animate(bars, {
      scaleX: [0.85, 1],
      opacity: [0.7, 1],
      duration: DURATION.base,
      ease: EASING.appleSmooth,
    })
  }, [activeCase])

  return (
    <div className="case-cmp" ref={barRef}>
      {/* Case Toggle Selector */}
      <div className="case-toggle">
        <button
          type="button"
          className={`case-toggle__btn ${!isCase3 ? 'is-active' : ''}`}
          onClick={() => setActiveCase('case2')}
        >
          <span className="case-toggle__tag mono">CASE 2</span>
          <span className="case-toggle__title">Legacy FCFS (First-Arrival)</span>
        </button>
        <button
          type="button"
          className={`case-toggle__btn ${isCase3 ? 'is-active is-cpsat' : ''}`}
          onClick={() => setActiveCase('case3')}
        >
          <span className="case-toggle__tag mono">CASE 3</span>
          <span className="case-toggle__title">CP-SAT Optimised</span>
          <span className="case-toggle__badge">-50% Delay</span>
        </button>
      </div>

      {/* Case Overview Banner */}
      <div className={`case-banner ${isCase3 ? 'is-cpsat-banner' : 'is-legacy-banner'}`}>
        <div className="case-banner__head">
          <Badge tone={isCase3 ? 'teal' : 'danger'} dot pulse={!isCase3}>
            {isCase3 ? 'CP-SAT Priority Scheduling' : 'First-Come First-Served Baseline'}
          </Badge>
          <span className="case-banner__winner mono">
            PROCEED: {isCase3 ? 'Train A (Express)' : 'Train B (Freight)'}
          </span>
        </div>
        <p className="case-banner__desc">
          {isCase3
            ? 'High-priority Express (class 1) cleared first with 0.4 min delay. Freight slotted into the 210 s headway gap.'
            : 'Low-priority Freight arrives 38 s earlier and locks the single-line junction. High-priority Express held outside block.'}
        </p>
      </div>

      {/* Metric comparison bars */}
      <div className="cmp">
        <div className="cmp__row">
          <div className="cmp__info">
            <span className="cmp__label">Passenger-Weighted Delay</span>
            <small className="cmp__hint">Priority-scaled objective penalty</small>
          </div>
          <div className="cmp__bars">
            <div className="cmp__bar">
              <div
                className={`cmp__bar-fill ${isCase3 ? 'is-cpsat' : 'is-legacy'}`}
                style={{ width: `${(weightedVal / 10) * 100}%` }}
              />
            </div>
          </div>
          <span className="cmp__vals mono">
            <b>{animatedWeighted}</b> min
          </span>
        </div>

        <div className="cmp__row">
          <div className="cmp__info">
            <span className="cmp__label">Train A Delay (Express · Prio 1)</span>
            <small className="cmp__hint">High passenger volume</small>
          </div>
          <div className="cmp__bars">
            <div className="cmp__bar">
              <div
                className={`cmp__bar-fill ${isCase3 ? 'is-cpsat' : 'is-legacy'}`}
                style={{ width: `${(delayAVal / 5) * 100}%` }}
              />
            </div>
          </div>
          <span className="cmp__vals mono">
            <b>{animatedDelayA}</b> min
          </span>
        </div>

        <div className="cmp__row">
          <div className="cmp__info">
            <span className="cmp__label">Train B Delay (Freight · Prio 3)</span>
            <small className="cmp__hint">Low passenger penalty</small>
          </div>
          <div className="cmp__bars">
            <div className="cmp__bar">
              <div
                className={`cmp__bar-fill ${isCase3 ? 'is-cpsat' : 'is-legacy'}`}
                style={{ width: `${(delayBVal / 5) * 100}%` }}
              />
            </div>
          </div>
          <span className="cmp__vals mono">
            <b>{animatedDelayB}</b> min
          </span>
        </div>
      </div>
    </div>
  )
}

function Recommendation() {
  return (
    <Card className="rec motion-item">
      <PanelTitle icon="spark" title="Recommendation" meta={`confidence ${RECOMMENDATION.confidence}%`} tone="teal" />
      <div className="rec__headline">
        <span className="rec__go">
          <i /> PROCEED
        </span>
        <span className="rec__split">Train A (Express)</span>
        <span className="rec__hold">
          <i /> HOLD
        </span>
        <span className="rec__split">Train B (Freight)</span>
      </div>
      <Meter value={RECOMMENDATION.confidence} tone="teal" label="Confidence" right={`${RECOMMENDATION.confidence}%`} />
      <ul className="rec__reasons">
        {RECOMMENDATION.reasons.map((r) => (
          <li key={r}>
            <Icon name="check" size={15} />
            {r}
          </li>
        ))}
      </ul>
      <p className="rec__rule">
        <Icon name="shield" size={15} />
        {RECOMMENDATION.rule}
      </p>
    </Card>
  )
}

export default function DecisionCore() {
  const containerRef = useStaggerEntrance({ selector: '.motion-item', delay: 70 })

  return (
    <div className="decision" ref={containerRef}>
      {/* Active Conflict Header Card */}
      <Card className="decision__conflict motion-item">
        <PanelTitle icon="warn" title="Active conflict" meta={CONFLICT.detectedAt} tone="danger" />
        <div className="conflict__head">
          <Badge tone="danger" dot pulse>
            {CONFLICT.severity}
          </Badge>
          <code className="conflict__id">{CONFLICT.id}</code>
          <span className="conflict__type">{CONFLICT.type.replace(/_/g, ' ')}</span>
        </div>

        <div className="conflict__trains">
          <div className="ctrain tone-teal">
            <span className="ctrain__badge">A</span>
            <div>
              <strong>{CONFLICT.approachA}</strong>
              <small>Approach A · outer block A1</small>
            </div>
          </div>
          <span className="conflict__vs">vs</span>
          <div className="ctrain tone-violet">
            <span className="ctrain__badge">B</span>
            <div>
              <strong>{CONFLICT.approachB}</strong>
              <small>Approach B · outer block B1</small>
            </div>
          </div>
        </div>

        <div className="conflict__stats">
          <Stat label="Saved delay" value={`${CONFLICT.savedMinutes} min`} tone="teal" />
          <Stat label="Improvement" value={`${CONFLICT.cpsat.improvement}%`} tone="emerald" />
          <Stat label="Solve time" value={`${CONFLICT.cpsat.solveMs} ms`} tone="cyan" />
        </div>

        <p className="conflict__note">
          <Icon name="info" size={14} />
          Identical sensor events were replayed through both rules — the difference is measured, never
          hard-coded.
        </p>
      </Card>

      {/* Case 2 vs Case 3 Animated Decision Comparison */}
      <Card className="decision__compare motion-item">
        <PanelTitle icon="chart" title="Case 2 vs Case 3: Algorithmic Rigor" meta="FCFS vs CP-SAT" tone="indigo" />
        <CaseComparison />
      </Card>

      {/* 7-Stage Decision Pipeline */}
      <Card className="decision__pipeline motion-item">
        <PanelTitle icon="bolt" title="Decision pipeline" meta="7 stages · deterministic" tone="violet" />
        <ol className="pipeline">
          {PIPELINE.map((p, idx) => (
            <li key={p.step} className={`pstep is-${p.state}`} style={{ '--i': idx }}>
              <span className="pstep__marker" />
              <div className="pstep__body">
                <strong>{p.step}</strong>
                <small>{p.detail}</small>
              </div>
              <Badge tone={p.state === 'done' ? 'success' : 'warn'} dot={p.state !== 'done'}>
                {p.state === 'done' ? 'PASS' : 'LIVE'}
              </Badge>
            </li>
          ))}
        </ol>
      </Card>

      {/* Safety & Physical Constraints */}
      <Card className="decision__constraints motion-item">
        <PanelTitle icon="check" title="CP-SAT safety constraints" meta="5 active" tone="cyan" />
        <ul className="clist">
          {CONSTRAINTS.map((c) => (
            <li key={c.id}>
              <span className="clist__id mono">{c.id}</span>
              <span className="clist__text">{c.text}</span>
              <Icon name="check" size={15} />
            </li>
          ))}
        </ul>
      </Card>

      {/* Independent Validator */}
      <Card className="decision__validate motion-item">
        <PanelTitle icon="shield" title="Independent validation" meta={VALIDATION.verdict} tone="emerald" />
        <div className="vlist">
          {VALIDATION.checks.map((c) => (
            <div key={c.name} className="vrow">
              <Icon name="check" size={15} />
              <span>{c.name}</span>
              <Badge tone="success">{c.result}</Badge>
            </div>
          ))}
        </div>
        <p className="vlist__note">
          <Icon name="info" size={14} />
          {VALIDATION.note}
        </p>
      </Card>

      <Recommendation />
    </div>
  )
}
