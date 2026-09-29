import { BLOCKS, SIGNALS, SIGNAL_STATES } from '../data/live.js'
import { Badge } from './ui.jsx'

const W = 1000
const H = 380
const TRACK_Y = 250

const SIGNAL_X = { A: 132, B: 868 }

function SignalLamp({ x, state }) {
  const meta = SIGNAL_STATES[state] ?? SIGNAL_STATES.OFFLINE
  const isGo = state === 'PROCEED'
  const isHold = state === 'HOLD'
  const color = isGo ? 'var(--success)' : isHold ? 'var(--danger)' : 'var(--warn)'
  return (
    <g className="lamp" transform={`translate(${x} ${TRACK_Y - 74})`}>
      <line x1="0" y1="0" x2="0" y2="62" stroke="var(--svg-idle-line)" strokeWidth="3" />
      <rect x="-15" y="-34" width="30" height="38" rx="8" fill="var(--surface)" stroke="var(--svg-idle-line)" />
      <circle className="lamp__on" cx="0" cy="-22" r="6.5" fill={color} />
      <circle cx="0" cy="-6" r="4" fill="var(--muted)" opacity="0.35" />
      <text className="lamp__label" x="0" y="76" textAnchor="middle" fill="var(--text-dim)">
        {meta.label}
      </text>
    </g>
  )
}

function Train({ x, tone, label, flip = false }) {
  return (
    <g className={`train train--${tone}`} transform={`translate(${x} ${TRACK_Y - 46}) scale(${flip ? -1 : 1} 1)`}>
      <rect className="train__body" x="-38" y="-15" width="76" height="30" rx="12" />
      <rect className="train__win" x="-26" y="-9" width="14" height="9" rx="3" />
      <rect className="train__win" x="-6" y="-9" width="14" height="9" rx="3" />
      <rect className="train__nose" x="30" y="-9" width="10" height="18" rx="4" />
      <circle className="train__wheel" cx="-18" cy="17" r="4" />
      <circle className="train__wheel" cx="18" cy="17" r="4" />
      <text className="train__label" x="0" y="-24" textAnchor="middle" fill="currentColor">
        {label}
      </text>
    </g>
  )
}


export default function Corridor() {
  return (
    <div className="corridor">
      <svg viewBox={`0 0 ${W} ${H}`} className="corridor__svg" role="img" aria-label="Animated junction diagram with two trains and signals">
        <defs>
          {/* Rails and sleeper flow follow the active theme via CSS variables */}
          <linearGradient id="trackGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--track-a)" />
            <stop offset="50%" stopColor="var(--track-b)" />
            <stop offset="100%" stopColor="var(--track-a)" />
          </linearGradient>
          <linearGradient id="sleeper" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.12" />
            <stop offset="50%" stopColor="var(--primary)" stopOpacity="0.45" />
            <stop offset="100%" stopColor="var(--secondary)" stopOpacity="0.12" />
          </linearGradient>
        </defs>

        <text className="corridor__approach" x="60" y="86" fill="var(--text-mute)">APPROACH A</text>
        <text className="corridor__approach" x={W - 60} y="86" textAnchor="end" fill="var(--text-mute)">APPROACH B</text>
        <text className="corridor__junction" x={W / 2} y="78" textAnchor="middle" fill="var(--text-dim)">JUNCTION 14</text>

        <rect x="24" y={TRACK_Y - 6} width={W - 48} height="12" rx="6" fill="url(#trackGrad)" />
        <line
          className="corridor__flow"
          x1="24"
          y1={TRACK_Y}
          x2={W - 24}
          y2={TRACK_Y}
          stroke="url(#sleeper)"
          strokeWidth="3"
          strokeDasharray="14 10"
          strokeLinecap="round"
        />

        {BLOCKS.map((b) => {
          const cx = 24 + b.position * (W - 48)
          const active = b.state === 'ACTIVE'
          return (
            <g key={b.id} className={`block ${active ? 'is-active' : ''}`}>
              <rect
                x={cx - 46}
                y={TRACK_Y - 22}
                width="92"
                height="44"
                rx="12"
                fill={active ? 'var(--danger-soft)' : 'var(--svg-idle)'}
                stroke={active ? 'var(--danger-line)' : 'var(--svg-idle-line)'}
                strokeDasharray="4 5"
              />
              <text className="block__id" x={cx} y={TRACK_Y - 6} textAnchor="middle" fill={active ? 'var(--danger)' : 'var(--text-mute)'}>
                {b.id}
              </text>
              <text className="block__gpio" x={cx} y={TRACK_Y + 34} textAnchor="middle" fill="var(--text-mute)">
                GPIO {b.gpio}
              </text>
            </g>
          )
        })}

        <g className="junction" transform={`translate(${W / 2} ${TRACK_Y})`}>
          <rect className="junction__halo" x="-120" y="-40" width="240" height="80" rx="18" />
          <path className="junction__shape" d="M0 -34 L112 0 L0 34 L-112 0 Z" />
          <text className="junction__text" x="0" y="6" textAnchor="middle" fill="var(--text)">CP-SAT</text>
        </g>

        <SignalLamp x={SIGNAL_X.A} state="PROCEED" />
        <SignalLamp x={SIGNAL_X.B} state="HOLD" />

        <g className="trainwrap trainwrap--a">
          <Train x={200} tone="teal" label="Train A · Express" flip />
        </g>
        <g className="trainwrap trainwrap--b">
          <Train x={800} tone="violet" label="Train B · Freight" />
        </g>
      </svg>

      <div className="corridor__signals">
        {SIGNALS.map((s) => {
          const meta = SIGNAL_STATES[s.state]
          return (
            <div key={s.id} className={`sigrow tone-${meta.tone}`}>
              <span className="sigrow__id mono">{s.id}</span>
              <Badge tone={meta.tone} dot pulse={s.state !== 'PROCEED'}>
                {s.state}
              </Badge>
              <span className="sigrow__reason">{s.reason}</span>
              <span className="sigrow__since mono">{s.since}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
