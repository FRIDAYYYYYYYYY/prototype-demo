import { PHASES } from '../data/plan.js'
import Icon from './Icon.jsx'
import { Badge, Card, PanelTitle } from './ui.jsx'

const PHASE_TONE = { done: 'success', active: 'teal' }
const PHASE_LABEL = { done: 'Complete', active: 'In progress' }

function PhaseCard({ phase }) {
  return (
    <article className={`phase is-${phase.status}`}>
      <header className="phase__head">
        <span className="phase__letter">{phase.id}</span>
        <div className="phase__headtext">
          <h4>{phase.title}</h4>
          <span className="phase__priority mono">{phase.priority}</span>
        </div>
        <Badge tone={PHASE_TONE[phase.status]} dot pulse={phase.status === 'active'}>
          {PHASE_LABEL[phase.status]}
        </Badge>
      </header>
      <p className="phase__summary">{phase.summary}</p>
      <ul className="phase__items">
        {phase.items.map((item) => (
          <li key={item}>
            <Icon name="check" size={14} />
            {item}
          </li>
        ))}
      </ul>
    </article>
  )
}

export default function Plan() {
  const visiblePhases = PHASES.filter(p => p.status === 'done' || p.status === 'active')

  return (
    <div className="plan">
      <Card className="plan__phases">
        <PanelTitle icon="flag" title="Project Milestones" meta={`${visiblePhases.length} phases`} tone="teal" />
        <div className="phasegrid">
          {visiblePhases.map((p) => (
            <PhaseCard key={p.id} phase={p} />
          ))}
        </div>
      </Card>
    </div>
  )
}
