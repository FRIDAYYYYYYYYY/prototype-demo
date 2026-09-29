import { CONFLICT, CONSTRAINTS, PIPELINE, RECOMMENDATION, VALIDATION } from '../data/decision.js'
import Icon from './Icon.jsx'
import { Badge, Card, Meter, PanelTitle, Stat } from './ui.jsx'

function Comparison() {
  const rows = [
    { label: 'Weighted objective', legacy: CONFLICT.legacy.weighted, cpsat: CONFLICT.cpsat.weighted, max: 10, better: 'lower' },
    { label: 'Delay · Train A', legacy: CONFLICT.legacy.delayA, cpsat: CONFLICT.cpsat.delayA, max: 5, better: 'lower' },
    { label: 'Delay · Train B', legacy: CONFLICT.legacy.delayB, cpsat: CONFLICT.cpsat.delayB, max: 5, better: 'lower' },
  ]

  return (
    <div className="cmp">
      <div className="cmp__legend">
        <span className="cmp__key">
          <i className="dot is-legacy" /> Legacy first-arrival
        </span>
        <span className="cmp__key">
          <i className="dot is-cpsat" /> CP-SAT optimised
        </span>
      </div>
      {rows.map((r) => (
        <div key={r.label} className="cmp__row">
          <span className="cmp__label">{r.label}</span>
          <div className="cmp__bars">
            <div className="cmp__bar">
              <i className="fill is-legacy" style={{ width: `${(r.legacy / r.max) * 100}%` }} />
            </div>
            <div className="cmp__bar">
              <i className="fill is-cpsat" style={{ width: `${(r.cpsat / r.max) * 100}%` }} />
            </div>
          </div>
          <span className="cmp__vals mono">
            {r.legacy} → <b>{r.cpsat}</b>
          </span>
        </div>
      ))}
    </div>
  )
}

function Recommendation() {
  return (
    <Card className="rec">
      <PanelTitle icon="spark" title="Recommendation" meta={`confidence ${RECOMMENDATION.confidence}%`} tone="teal" />
      <div className="rec__headline">
        <span className="rec__go">
          <i /> PROCEED
        </span>
        <span className="rec__split">Train A</span>
        <span className="rec__hold">
          <i /> HOLD
        </span>
        <span className="rec__split">Train B</span>
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
  return (
    <div className="decision">
      <Card className="decision__conflict">
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

      <Card className="decision__compare">
        <PanelTitle icon="chart" title="Legacy vs CP-SAT" meta="same events · two rules" tone="indigo" />
        <Comparison />
        <div className="decision__notes">
          <div className="dnote tone-slate">
            <strong>{CONFLICT.legacy.rule}</strong>
            <p>{CONFLICT.legacy.note}</p>
          </div>
          <div className="dnote tone-teal">
            <strong>CP-SAT weighted objective</strong>
            <p>{CONFLICT.cpsat.note}</p>
          </div>
        </div>
      </Card>

      <Card className="decision__pipeline">
        <PanelTitle icon="bolt" title="Decision pipeline" meta="7 stages" tone="violet" />
        <ol className="pipeline">
          {PIPELINE.map((p) => (
            <li key={p.step} className={`pstep is-${p.state}`}>
              <span className="pstep__marker" />
              <div className="pstep__body">
                <strong>{p.step}</strong>
                <small>{p.detail}</small>
              </div>
              <Badge tone={p.state === 'done' ? 'success' : 'warn'} dot={p.state !== 'done'}>
                {p.state === 'done' ? 'OK' : 'LIVE'}
              </Badge>
            </li>
          ))}
        </ol>
      </Card>

      <Card className="decision__constraints">
        <PanelTitle icon="check" title="CP-SAT constraints" meta="5 active" tone="cyan" />
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

      <Card className="decision__validate">
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
