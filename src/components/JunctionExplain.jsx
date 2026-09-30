import { Badge } from './ui.jsx'
import Icon from './Icon.jsx'
import { JUNCTION_MOVEMENTS } from '../data/live.js'

/**
 * Plain-language state of one approach, derived from its animation phase.
 * These words are what the dispatcher actually reads, so they are defined
 * once here rather than re-worded in the component.
 */
const PHASE_COPY = {
  run: {
    state: 'CLEARED',
    tone: 'success',
    line: 'holds the road — running through the shared section',
  },
  enter: {
    state: 'APPROACHING',
    tone: 'warn',
    line: 'rolling up to its signal from off-panel',
  },
  wait: {
    state: 'STOPPED',
    tone: 'danger',
    line: 'held at a red signal, waiting for the road to clear',
  },
  idle: {
    state: 'CLEAR',
    tone: 'muted',
    line: 'no movement detected on this approach',
  },
}

/** Highest cost weight in the fleet, so the meter is drawn to a real scale. */
const MAX_WEIGHT = 3

/** Weight drawn to scale, so ×3 really does look heavier than ×1. */
function WeightMeter({ weight, tone }) {
  return (
    <span className="jx__meter" aria-hidden="true">
      {Array.from({ length: MAX_WEIGHT }, (_, i) => i + 1).map((step) => (
        <span
          key={step}
          className={`jx__pip ${step <= weight ? `is-on tone-${tone}` : ''}`}
        />
      ))}
    </span>
  )
}

function MovementRow({ id, phase, aspect, isActive }) {
  const m = JUNCTION_MOVEMENTS[id]
  const copy = PHASE_COPY[phase] ?? PHASE_COPY.idle
  // The signal aspect and the train's own phase must never disagree on screen.
  const cleared = aspect === 'PROCEED'

  return (
    <li className={`jx__row ${isActive ? 'is-active' : ''}`}>
      <span className={`jx__swatch ${m.css}`} aria-hidden="true" />
      <div className="jx__who">
        <strong>
          {m.train} <span className="jx__type">{m.name}</span>
        </strong>
        <small>
          Approach {m.approach} · {m.type} · {m.runMin} min through the junction
        </small>
      </div>

      <div className="jx__chips">
        <span className="jx__chip" title="Priority: lower number wins a conflict">
          Priority <b>{m.priority}</b>
        </span>
        <span
          className="jx__chip"
          title="Cost weight: how expensive it is to delay this train"
        >
          Cost weight <b>×{m.weight}</b>
          <WeightMeter weight={m.weight} tone={m.css.replace('train--', '')} />
        </span>
      </div>

      <div className="jx__verdict">
        <Badge tone={copy.tone} dot pulse={phase === 'run'}>
          {copy.state}
        </Badge>
        <span className="jx__sig mono">{cleared ? 'PROCEED' : 'HOLD'}</span>
        <small>{copy.line}</small>
      </div>
    </li>
  )
}

/**
 * The reasoning layer beneath the junction diagram.
 *
 * Its whole job is to make the advisory decision legible: which movement is
 * stopped, which is cleared, what the signal is doing, and which priority and
 * cost-weight numbers produced that outcome. Every figure shown here comes
 * from JUNCTION_MOVEMENTS, which mirrors backend/simulator.py, so the panel
 * cannot drift away from what the solver actually used.
 */
export default function JunctionExplain({ phaseA, phaseB, aspectA, aspectB, active }) {
  // Whichever movement is cleared is the one the junction is protecting.
  const clearedId = aspectA === 'PROCEED' ? 'A' : aspectB === 'PROCEED' ? 'B' : null
  const heldId = clearedId === 'A' ? 'B' : clearedId === 'B' ? 'A' : null
  const cleared = clearedId ? JUNCTION_MOVEMENTS[clearedId] : null
  const held = heldId ? JUNCTION_MOVEMENTS[heldId] : null

  const verdict = !cleared
    ? {
        title: 'Junction clear — both approaches held',
        body: 'No movement is currently authorised. The shared section is empty, so nothing is being delayed.',
      }
    : {
        title: `${cleared.train} cleared — ${held.train} held at the signal`,
        body:
          `Both routes cross the same single-capacity block (BL1), so only one train ` +
          `may occupy it at a time. ${cleared.train} is cleared because holding it would ` +
          `cost ${cleared.weight} weighted minute${cleared.weight === 1 ? '' : 's'} for every ` +
          `minute it waits, against ${held.weight} for ${held.train}. ` +
          `${held.train} is held${held.priority > cleared.priority ? ` and is the lower-priority movement (priority ${held.priority} vs ${cleared.priority})` : ''}.`,
      }

  return (
    <section className="jx" aria-label="Junction decision reasoning">
      <header className="jx__head">
        <Icon name="cpu" size={16} />
        <h3 className="jx__title">Why this decision</h3>
        <span className="jx__tag mono">CP-SAT · weighted delay</span>
      </header>

      <p className="jx__verdictline">
        <strong>{verdict.title}</strong>
        <span>{verdict.body}</span>
      </p>

      <ul className="jx__list">
        <MovementRow id="A" phase={phaseA} aspect={aspectA} isActive={active === 'A'} />
        <MovementRow id="B" phase={phaseB} aspect={aspectB} isActive={active === 'B'} />
      </ul>

      <p className="jx__foot">
        <Icon name="info" size={14} />
        <span>
          Weights are the passenger-weighted delay costs the optimiser minimises: a weight-3
          express held for one minute counts as three minutes of delay, a weight-1 freight as
          one. Advisory only — the dispatcher makes the final call.
        </span>
      </p>
    </section>
  )
}