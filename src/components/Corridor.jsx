import { useEffect, useMemo, useRef, useState } from 'react'
import { Badge } from './ui.jsx'
import Icon from './Icon.jsx'
import {
  BEAM_LEN,
  JUNCTION_ANGLES,
  PANEL,
  TRAIN_LEN,
  VIEWBOX,
  buildJunction,
  samplePath,
} from '../junctionGeometry.js'
import { useJunctionAngle, usePrefersReducedMotion } from '../hooks.js'
import { JUNCTION_MOVEMENTS, SIGNAL_STATES } from '../data/live.js'
import JunctionExplain from './JunctionExplain.jsx'

/**
 * The two movements this diagram illustrates. The facts (train, priority, cost
 * weight) come from JUNCTION_MOVEMENTS in data/live.js, which mirrors
 * backend/simulator.py and backend/hardware_state.py, so the diagram and the
 * reasoning layer can never quote different numbers for the same train.
 */
const MOVEMENTS = {
  A: { id: 'A', label: JUNCTION_MOVEMENTS.A.train, name: JUNCTION_MOVEMENTS.A.name, css: JUNCTION_MOVEMENTS.A.css },
  B: { id: 'B', label: JUNCTION_MOVEMENTS.B.train, name: JUNCTION_MOVEMENTS.B.name, css: JUNCTION_MOVEMENTS.B.css },
}

/** How long one train takes to run its whole route, in ms. */
const RUN_MS = 5200
/** How long a train takes to roll in from off-panel and stop at its signal, in ms. */
const ENTER_MS = 2400
/** Signal dwell between one movement clearing and the next, in ms. */
const DWELL_MS = 1500

/**
 * A signal head, drawn on the outside of its arm so a train reads it as
 * it approaches the merge.
 */
function SignalHead({ x, y, aspect, label }) {
  const isProceed = aspect === 'PROCEED'
  const isHold = aspect === 'HOLD'
  const lamp = isProceed ? 'var(--success)' : isHold ? 'var(--danger)' : 'var(--warn)'

  return (
    <g className="jsignal" transform={`translate(${x} ${y})`}>
      <rect className="jsignal__post" x="-2.5" y="-4" width="5" height="30" rx="2" />
      <rect className="jsignal__head" x="-13" y="-38" width="26" height="34" rx="8" />
      <circle
        className={isProceed ? 'jsignal__lamp is-lit' : 'jsignal__lamp'}
        cx="0"
        cy="-27"
        r="6"
        fill={lamp}
      />
      <circle className="jsignal__lamp is-off" cx="0" cy="-12" r="4.5" />
      {/* Aspect sits BESIDE the head, not above it: above collided with the
          train standing at the signal on a steep approach. */}
      <text className="jsignal__aspect" x="19" y="-18" fill={lamp}>
        {aspect}
      </text>
      <text className="jsignal__label" x="0" y="44" textAnchor="middle">
        {label}
      </text>
    </g>
  )
}

/**
 * A train, drawn centred on the origin so the caller can place it with a
 * single translate+rotate taken straight off the measured track point.
 *
 * The headlight cone is a child of the same rotated group, so it inherits
 * the track angle exactly: no separate rotation maths, and it can never
 * drift out of alignment with the rails it is shining along.
 */
function TrainBody({ movement }) {
  const nose = TRAIN_LEN / 2
  return (
    <g className={`train ${movement.css}`}>
      {/* Headlight: a cone opening forward from the nose, fading out. Drawn
          first so the body sits on top of it. */}
      <path
        className="train__beam"
        d={`M ${nose - 4} -9 L ${nose + BEAM_LEN} -34 L ${nose + BEAM_LEN} 34 L ${nose - 4} 9 Z`}
      />
      <path
        className="train__beam train__beam--core"
        d={`M ${nose - 4} -4 L ${nose + BEAM_LEN * 0.55} -13 L ${nose + BEAM_LEN * 0.55} 13 L ${nose - 4} 4 Z`}
      />
      <rect className="train__body" x={-nose} y="-16" width={TRAIN_LEN} height="32" rx="13" />
      <rect className="train__win" x="-28" y="-9" width="15" height="10" rx="3" />
      <rect className="train__win" x="-7" y="-9" width="15" height="10" rx="3" />
      <rect className="train__nose" x={nose - 12} y="-10" width="12" height="20" rx="5" />
      {/* Lamp lenses at the nose. */}
      <circle className="train__lamp" cx={nose - 3} cy="-7" r="3.4" />
      <circle className="train__lamp" cx={nose - 3} cy="7" r="3.4" />
      <circle className="train__wheel" cx="-20" cy="18" r="4.2" />
      <circle className="train__wheel" cx="20" cy="18" r="4.2" />
      <text className="train__label" x="0" y="-25" textAnchor="middle" fill="currentColor">
        {movement.label}
      </text>
    </g>
  )
}


export default function Corridor({ liveAspects = null }) {
  const measuredAngle = useJunctionAngle()
  const reducedMotion = usePrefersReducedMotion()

  // Fall back to the laptop angle for the first paint, before measurement.
  const angle = measuredAngle ?? JUNCTION_ANGLES.laptop
  const junction = useMemo(() => buildJunction(angle), [angle])

  // The two real <path> elements. Trains are positioned by sampling these,
  // so the motion is derived from the drawn geometry, never from a copy.
  const routeARef = useRef(null)
  const routeBRef = useRef(null)
  // The train groups. Their transform is written straight to the DOM by the
  // animation loop, so a 60fps sweep does not re-render React 60 times a
  // second - only a change of signal aspect does.
  const trainARef = useRef(null)
  const trainBRef = useRef(null)

  /**
   * Which movement currently holds the road. Held in state because the
   * signal lamps must re-render when it changes; it changes once per cycle.
   */
  const [active, setActive] = useState('A')

  /* Per-train phase, mirrored into state so the reasoning layer beneath the
     diagram can describe what each train is doing. Written only when a phase
     actually changes (a few times a cycle), never per animation frame. */
  const [phases, setPhases] = useState({ A: 'run', B: 'enter' })

  // Where a waiting train stands: stopped at its signal, set back from the
  // arm end so it clears the label and the signal head.
  const parkT = junction.stopT

  useEffect(() => {
    // Park both trains at their visible approach ends before anything animates.
    const park = (pathEl, groupEl) => {
      if (!pathEl || !groupEl) return
      const pose = samplePath(pathEl, parkT)
      groupEl.setAttribute('transform', `translate(${pose.x} ${pose.y}) rotate(${pose.angle})`)
    }
    park(routeARef.current, trainARef.current)
    park(routeBRef.current, trainBRef.current)

    // Reduced motion: the trains stay at their signals. The signal sequence
    // still runs (it is the point of the diagram) but nothing sweeps across.
    if (reducedMotion) return undefined

    let frame = 0
    let dwellTimer = 0
    let last = 0
    let current = 'A'

    /* Per-train state.
       phase 'run'   - holds the road, accelerating away from its signal
       phase 'enter' - coming back on from off-panel, rolling up to its signal
       phase 'wait'  - stopped at its signal, waiting for the road
       A train that finishes a run must RE-ENTER from off-panel left; jumping
       straight back to parkT would pop it into view mid-panel. */
    const trains = {
      A: { phase: 'run', t: parkT },
      B: { phase: 'enter', t: 0 },
    }
    let runProgress = 0
    let enterProgress = 0

    const place = (routeEl, groupEl, t) => {
      if (!routeEl || !groupEl) return
      const pose = samplePath(routeEl, t)
      groupEl.setAttribute(
        'transform',
        `translate(${pose.x} ${pose.y}) rotate(${pose.angle})`,
      )
    }

    // Mirror the phase out to the reasoning layer, but only on a real change.
    const publish = () => {
      setPhases((prev) =>
        prev.A === trains.A.phase && prev.B === trains.B.phase
          ? prev
          : { A: trains.A.phase, B: trains.B.phase },
      )
    }

    const step = (now) => {
      if (!last) last = now
      const dt = now - last
      last = now

      const runner = trains[current]
      const other = trains[current === 'A' ? 'B' : 'A']

      /* On its turn the waiting train takes the road: it is already stopped
         at its signal, so it simply starts running from parkT. */
      if (runner.phase === 'wait') {
        runner.phase = 'run'
        runProgress = 0
        publish()
      }

      /* -- the running train: launches from rest and accelerates ------ */
      if (runner.phase === 'run') {
        runProgress += dt / RUN_MS
        // Ease IN from a standstill: the train waits stopped at a red signal
        // and pulls away from rest when it clears, rather than lurching.
        const launch = runProgress * runProgress
        // t runs parkT -> 1 (off-panel right).
        runner.t = parkT + (1 - parkT) * launch

        if (runProgress >= 1) {
          // Off-panel and gone. Clear the road, dwell at the signals, then
          // let the other approach take it.
          runProgress = 0
          runner.t = 0
          runner.phase = 'enter'
          setActive(null)
          publish()
          dwellTimer = window.setTimeout(() => {
            current = current === 'A' ? 'B' : 'A'
            setActive(current)
            last = 0
            frame = requestAnimationFrame(step)
          }, DWELL_MS)
        }
      }

      /* -- the other train: rolls in from off-panel and stops ---------
         A train that has just finished a run is sitting off-panel right
         (t reset to 0 puts it off-panel left, ready to come back in). It
         re-enters while the other train is running, decelerating to a
         stand at its signal so it is waiting when its turn comes. */
      if (other.phase === 'enter') {
        enterProgress += dt / ENTER_MS
        // Ease OUT so it decelerates to a stand at its signal, rather than
        // arriving at speed and stopping dead.
        const settle = 1 - Math.pow(1 - enterProgress, 3)
        // t runs 0 (off-panel left) -> parkT, so it slides into view.
        other.t = parkT * settle
        if (enterProgress >= 1) {
          enterProgress = 0
          other.t = parkT
          other.phase = 'wait'
          publish()
        }
      }

      place(routeARef.current, trainARef.current, trains.A.t)
      place(routeBRef.current, trainBRef.current, trains.B.t)

      frame = requestAnimationFrame(step)
    }

    frame = requestAnimationFrame(step)

    return () => {
      cancelAnimationFrame(frame)
      window.clearTimeout(dwellTimer)
    }
  }, [reducedMotion, parkT])

  const animatedA = active === 'A' ? 'PROCEED' : 'HOLD'
  const animatedB = active === 'B' ? 'PROCEED' : 'HOLD'

  // When the backend is live, prefer its real aspects for the lamps so the
  // diagram reflects genuine state rather than only the local animation.
  const shownA = liveAspects?.A ?? animatedA
  const shownB = liveAspects?.B ?? animatedB
  return (
    <div className="corridor">
      <svg
        viewBox={`0 0 ${VIEWBOX.w} ${VIEWBOX.h}`}
        className="corridor__svg jsvg"
        role="img"
        aria-label={`Junction diagram at a ${junction.angle} degree approach angle. Approach A is ${shownA}, approach B is ${shownB}.`}
      >
        <defs>
          <linearGradient id="yTrackGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--track-a)" />
            <stop offset="50%" stopColor="var(--track-b)" />
            <stop offset="100%" stopColor="var(--track-a)" />
          </linearGradient>

          {/* The panel edge. Trains are clipped to this box, so they slide
              in and out of view part by part instead of popping. */}
          <clipPath id="jpanel">
            <rect
              x={PANEL.left}
              y={PANEL.top}
              width={PANEL.right - PANEL.left}
              height={PANEL.bottom - PANEL.top}
            />
          </clipPath>

          {/* Headlight beam: bright at the lamp, fading to nothing ahead. */}
          <linearGradient id="beamFade" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#fff6d8" stopOpacity="0.5" />
            <stop offset="55%" stopColor="#ffe9a8" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#ffe9a8" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="beamCore" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#fffdf2" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#fff6d8" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Labels. The approach names are anchored to the left edge so they
            never sit on top of the arms at steeper angles. */}
        <text className="jlabel jlabel--approach" x={junction.labels.approachA.x} y={junction.labels.approachA.y}>
          APPROACH A
        </text>
        <text className="jlabel jlabel--approach" x={junction.labels.approachB.x} y={junction.labels.approachB.y}>
          APPROACH B
        </text>
        <text className="jlabel jlabel--junction" x={junction.labels.junction.x} y={junction.labels.junction.y} textAnchor="middle">
          MERGE
        </text>
        <text className="jlabel jlabel--stem" x={junction.labels.stem.x} y={junction.labels.stem.y} textAnchor="middle">
          SHARED SECTION · CP-SAT
        </text>

        {/* Rails: both arms plus the shared stem, drawn once. Clipped to the
            panel so the arms never spill outside the diagram and collide with
            the labels - the drawn arms are already short enough on their own. */}
        <g className="jrails" clipPath="url(#jpanel)">
          <path d={junction.armPathA} />
          <path d={junction.armPathB} />
          <path d={`M ${junction.stem.x1} ${junction.stem.y1} L ${junction.stem.x2} ${junction.stem.y2}`} />
        </g>

        {/* Sleeper ticks flowing toward the exit, so direction reads at a glance.
            These follow the VISIBLE track only. Using the full route would run
            them through the APPROACH labels, because the route's off-panel
            lead-in passes inside the panel horizontally. */}
        <g clipPath="url(#jpanel)">
          <path className="jflow" d={junction.armPathA} />
          <path className="jflow" d={junction.armPathB} />
          <path
            className="jflow"
            d={`M ${junction.stem.x1} ${junction.stem.y1} L ${junction.stem.x2} ${junction.stem.y2}`}
          />
        </g>

        {/* Measurement paths - never painted, only sampled to place the trains. */}
        <path ref={routeARef} d={junction.routeA} className="jmeasure" />
        <path ref={routeBRef} d={junction.routeB} className="jmeasure" />

        {/* Signals, drawn before the trains so a train reads as in front. */}
        <SignalHead x={junction.signalA.x} y={junction.signalA.y} aspect={shownA} label="A" />
        <SignalHead x={junction.signalB.x} y={junction.signalB.y} aspect={shownB} label="B" />

        {/* Trains. Each group's transform is written by the animation loop from
            the sampled track point, so the body sits on the rails and tilts
            with them. The static transform is only the first-paint position.
            Clipped to the panel so they slide in and out part by part. */}
        <g clipPath="url(#jpanel)">
          <g ref={trainARef} transform={`translate(${junction.startA.x} ${junction.startA.y}) rotate(${-junction.angle})`}>
            <TrainBody movement={MOVEMENTS.A} />
          </g>
          <g ref={trainBRef} transform={`translate(${junction.startB.x} ${junction.startB.y}) rotate(${junction.angle})`}>
            <TrainBody movement={MOVEMENTS.B} />
          </g>
        </g>
      </svg>

      <p className="corridor__caption">
        <Icon name="info" size={13} />
        Alternating movement illustration at a {junction.angle}° approach angle. When the backend
        reports both approaches, the lamps show the live aspects instead.
      </p>

      <div className="corridor__signals">
        {['A', 'B'].map((id) => {
          const aspect = id === 'A' ? shownA : shownB
          const meta = SIGNAL_STATES[aspect] ?? SIGNAL_STATES.OFFLINE
          const movement = MOVEMENTS[id]
          return (
            <div key={id} className={`sigrow tone-${meta.tone}`}>
              <span className="sigrow__id mono">SIG-{id}</span>
              <Badge tone={meta.tone} dot pulse={aspect !== 'PROCEED'}>
                {meta.label}
              </Badge>
              <span className="sigrow__reason">
                {movement.label} {movement.name} · {meta.hint}
              </span>
              <span className="sigrow__since mono">{junction.angle}°</span>
            </div>
          )
        })}
      </div>

      {/* The reasoning layer: says which train is stopped, which is cleared,
          why, and which priority / cost-weight numbers drove it. */}
      <JunctionExplain
        phaseA={phases.A}
        phaseB={phases.B}
        aspectA={shownA}
        aspectB={shownB}
        active={active}
      />
    </div>
  )
}
