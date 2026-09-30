import { useEffect, useRef } from 'react'
import { animate } from 'animejs'
import { BLOCKS, SIGNALS, SIGNAL_STATES } from '../data/live.js'
import { Badge } from './ui.jsx'
import { EASING, isReducedMotion } from '../motion/tokens.js'

const W = 1000
const H = 380
const TRACK_Y = 250

const SIGNAL_X = { A: 132, B: 868 }

function SignalLamp({ x, state, approach }) {
  const meta = SIGNAL_STATES[state] ?? SIGNAL_STATES.OFFLINE
  const isGo = state === 'PROCEED'
  const isHold = state === 'HOLD'
  const color = isGo ? 'var(--success)' : isHold ? 'var(--danger)' : 'var(--warn)'
  const filterId = isGo ? 'url(#greenGlow)' : isHold ? 'url(#redGlow)' : 'url(#amberGlow)'

  return (
    <g className="lamp" transform={`translate(${x} ${TRACK_Y - 74})`}>
      <line x1="0" y1="0" x2="0" y2="62" stroke="var(--svg-idle-line)" strokeWidth="3" />
      <rect x="-16" y="-36" width="32" height="42" rx="8" fill="var(--surface)" stroke="var(--line-strong)" strokeWidth="1.5" />
      
      {/* Dynamic LED Glow Halo */}
      <circle
        cx="0"
        cy="-22"
        r="14"
        fill={color}
        opacity={isGo ? 0.35 : isHold ? 0.4 : 0.25}
        filter={filterId}
        className="lamp__halo"
      />
      {/* Primary LED emitter */}
      <circle className="lamp__on" cx="0" cy="-22" r="7" fill={color} />
      <circle cx="0" cy="-6" r="4.5" fill="var(--muted)" opacity="0.3" />
      
      <text className="lamp__label" x="0" y="78" textAnchor="middle" fill="var(--text-dim)">
        {meta.label}
      </text>
      <text className="lamp__app" x="0" y="-44" textAnchor="middle" fill="var(--text-mute)" fontSize="10" fontWeight="600">
        SIG-{approach}
      </text>
    </g>
  )
}

function Train({ tone, label, flip = false, trainId }) {
  return (
    <g className={`train train--${tone} train--${trainId}`} transform={`scale(${flip ? -1 : 1} 1)`}>
      {/* Aerodynamic train body */}
      <rect className="train__body" x="-44" y="-16" width="88" height="32" rx="14" />
      <rect className="train__roof" x="-36" y="-15" width="72" height="5" rx="2" fill="rgba(255,255,255,0.25)" />
      
      {/* Windows with soft reflection */}
      <rect className="train__win" x="-30" y="-9" width="14" height="10" rx="3" />
      <rect className="train__win" x="-10" y="-9" width="14" height="10" rx="3" />
      <rect className="train__win" x="10" y="-9" width="14" height="10" rx="3" />
      
      {/* Nose and Headlamp */}
      <rect className="train__nose" x="36" y="-10" width="12" height="20" rx="5" />
      <circle className="train__headlight" cx="44" cy="0" r="3.5" fill="#fef08a" filter="url(#amberGlow)" />
      
      {/* Bogies and wheels */}
      <circle className="train__wheel" cx="-24" cy="18" r="4.5" />
      <circle className="train__wheel" cx="24" cy="18" r="4.5" />
      
      <text className="train__label" x="0" y="-26" textAnchor="middle" fill="currentColor">
        {label}
      </text>
    </g>
  )
}

export default function Corridor() {
  const trainARef = useRef(null)
  const trainBRef = useRef(null)

  useEffect(() => {
    if (isReducedMotion()) return

    // Train A (Express): Glides from approach A through the junction
    const animA = animate(trainARef.current, {
      transform: [
        { value: 'translate(160px, 0px)', duration: 0 },
        { value: 'translate(460px, 0px)', duration: 3200, ease: EASING.appleSmooth },
        { value: 'translate(780px, 0px)', duration: 2400, ease: 'easeInQuad' },
        { value: 'translate(160px, 0px)', duration: 0, delay: 600 }
      ],
      loop: true,
    })

    // Train B (Freight): Approaches junction 14, decelerates smoothly and holds at signal B
    const animB = animate(trainBRef.current, {
      transform: [
        { value: 'translate(840px, 0px)', duration: 0 },
        { value: 'translate(640px, 0px)', duration: 2800, ease: EASING.appleSmooth },
        { value: 'translate(638px, 0px)', duration: 2800, ease: 'linear' }, // hold phase
        { value: 'translate(840px, 0px)', duration: 2000, ease: EASING.appleSmooth, delay: 400 }
      ],
      loop: true,
    })

    return () => {
      if (animA && animA.pause) animA.pause()
      if (animB && animB.pause) animB.pause()
    }
  }, [])

  return (
    <div className="corridor">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="corridor__svg"
        role="img"
        aria-label="High-precision animated junction diagram with dynamic trains and signals"
      >
        <defs>
          {/* LED Optical Glow Filters */}
          <filter id="greenGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="redGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="amberGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="coreGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <linearGradient id="trackGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--track-a)" />
            <stop offset="50%" stopColor="var(--track-b)" />
            <stop offset="100%" stopColor="var(--track-a)" />
          </linearGradient>
          <linearGradient id="sleeper" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.1" />
            <stop offset="50%" stopColor="var(--primary)" stopOpacity="0.6" />
            <stop offset="100%" stopColor="var(--secondary)" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id="junctionMesh" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.2" />
            <stop offset="100%" stopColor="var(--secondary)" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        <text className="corridor__approach" x="60" y="86" fill="var(--text-mute)">APPROACH A</text>
        <text className="corridor__approach" x={W - 60} y="86" textAnchor="end" fill="var(--text-mute)">APPROACH B</text>
        <text className="corridor__junction" x={W / 2} y="78" textAnchor="middle" fill="var(--text-dim)">JUNCTION 14</text>

        {/* Physical Steel Rails */}
        <rect x="24" y={TRACK_Y - 7} width={W - 48} height="14" rx="7" fill="url(#trackGrad)" stroke="var(--line-strong)" strokeWidth="1" />
        <line
          className="corridor__flow"
          x1="24"
          y1={TRACK_Y}
          x2={W - 24}
          y2={TRACK_Y}
          stroke="url(#sleeper)"
          strokeWidth="3.5"
          strokeDasharray="14 10"
          strokeLinecap="round"
        />

        {/* GPIO Sensor Trigger Blocks with Dynamic Pulse Radii */}
        {BLOCKS.map((b) => {
          const cx = 24 + b.position * (W - 48)
          const active = b.state === 'ACTIVE'
          return (
            <g key={b.id} className={`block ${active ? 'is-active' : ''}`}>
              {active && (
                <rect
                  className="block__pulse-ring"
                  x={cx - 52}
                  y={TRACK_Y - 28}
                  width="104"
                  height="56"
                  rx="16"
                  fill="none"
                  stroke="var(--danger)"
                  strokeWidth="2"
                  opacity="0.6"
                />
              )}
              <rect
                x={cx - 46}
                y={TRACK_Y - 22}
                width="92"
                height="44"
                rx="12"
                fill={active ? 'var(--danger-soft)' : 'var(--svg-idle)'}
                stroke={active ? 'var(--danger)' : 'var(--svg-idle-line)'}
                strokeWidth={active ? 2 : 1}
                strokeDasharray={active ? 'none' : '4 5'}
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

        {/* CP-SAT Optimisation Core at Junction 14 */}
        <g className="junction" transform={`translate(${W / 2} ${TRACK_Y})`}>
          <rect className="junction__halo" x="-124" y="-42" width="248" height="84" rx="20" filter="url(#coreGlow)" />
          <path className="junction__shape" d="M0 -36 L116 0 L0 36 L-116 0 Z" fill="url(#junctionMesh)" stroke="var(--primary)" strokeWidth="2" />
          <circle cx="0" cy="0" r="18" fill="var(--surface)" stroke="var(--primary)" strokeWidth="2" />
          <circle className="junction__beacon" cx="0" cy="0" r="6" fill="var(--primary)" />
          <text className="junction__text" x="0" y="24" textAnchor="middle" fill="var(--text-strong)">CP-SAT</text>
        </g>

        {/* Luminous LED Signals */}
        <SignalLamp x={SIGNAL_X.A} state="PROCEED" approach="A" />
        <SignalLamp x={SIGNAL_X.B} state="HOLD" approach="B" />

        {/* Smooth Gliding Trains (Sitting directly on track at Y = TRACK_Y - 46) */}
        <g transform={`translate(0 ${TRACK_Y - 46})`}>
          <g ref={trainARef} style={{ transform: 'translate(200px, 0px)' }}>
            <Train tone="teal" label="Train A · Express" flip trainId="a" />
          </g>
          <g ref={trainBRef} style={{ transform: 'translate(800px, 0px)' }}>
            <Train tone="violet" label="Train B · Freight" trainId="b" />
          </g>
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
