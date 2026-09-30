// ============================================================
//   Junction geometry - pure, framework-free.
//
//   The topology is a "Y" lying on its side: two approach arms
//   converge on a single shared stem that runs off to the right.
//
//        APPROACH A
//             \                    <-- arm A
//              \
//               >====================>   shared stem
//              /
//             /                    <-- arm B
//        APPROACH B
//
//   `angleDeg` is the ACUTE ANGLE between an arm and the stem, so a
//   steeper angle means a tighter, more vertical merge. It is driven
//   by the viewport (see useJunctionAngle) because a 30 deg merge
//   spreads far horizontally and gets cramped on a narrow phone.
//
//   Nothing here touches React or the DOM: the same numbers are used
//   to draw the rails and to place the trains, so the picture and the
//   motion can never disagree.

/** Fixed drawing surface. The SVG scales to its container; we keep the
 *  coordinate system stable so the geometry maths stays readable. */
export const VIEWBOX = { w: 1000, h: 400 }

/** Where the two arms meet the stem. */
export const MERGE = { x: 320, y: 210 }

/** Right-hand end of the shared section. */
export const STEM_END_X = 966

/** Vertical room available above / below the merge, and the left margin
 *  the arms must respect. Both are what cap the arm length per angle.
 *  The margins leave room for the APPROACH labels and the signal heads, so
 *  a steep arm never runs into them. */
const MAX_ARM_RISE = 132
const ARM_LEFT_MARGIN = 132

/** Acute angle per device class, in degrees. */
export const JUNCTION_ANGLES = { laptop: 30, tablet: 45, phone: 60 }

/** Match the breakpoints already used in responsive.css. */
export const ANGLE_BREAKPOINTS = { tablet: 1080, phone: 620 }

/* ------------------------------------------------------------------
   Train and panel metrics
   ------------------------------------------------------------------
   The train never stops. It runs a route that begins well off-panel to
   the left and ends well off-panel to the right, and a fixed clip rect
   hides everything outside the panel. The train therefore appears and
   disappears progressively, part by part, exactly as it crosses the
   panel edge - rather than popping in or out.
   ------------------------------------------------------------------ */

/** Train body length; the nose sits at +LEN/2, the tail at -LEN/2. */
export const TRAIN_LEN = 84

/** Headlight beam reach, measured forward from the nose. */
export const BEAM_LEN = 130

/** The visible panel. Trains are clipped to this box. */
export const PANEL = { left: 64, right: STEM_END_X + 10, top: 0, bottom: VIEWBOX.h }

/** How far past the right edge the train travels before it is fully gone. */
const RUN_OUT = 100

const rad = (deg) => (deg * Math.PI) / 180

/**
 * Longest arm that still fits for a given angle.
 * Bounded by vertical room (rise) and by horizontal room (left margin).
 */
function armLengthFor(angleDeg) {
  const { sin, cos } = { sin: Math.sin(rad(angleDeg)), cos: Math.cos(rad(angleDeg)) }
  const byHeight = MAX_ARM_RISE / sin
  const byWidth = (MERGE.x - ARM_LEFT_MARGIN) / cos
  return Math.min(byHeight, byWidth)
}

/**
 * Build every coordinate the junction needs for one angle.
 *
 * @param {number} angleDeg acute angle between each arm and the stem
 */
export function buildJunction(angleDeg) {
  const angle = Math.max(5, Math.min(80, angleDeg))
  const sin = Math.sin(rad(angle))
  const cos = Math.cos(rad(angle))
  const armLen = armLengthFor(angle)

  // Visible arm: starts up-left / down-left of the merge.
  const runX = armLen * cos
  const runY = armLen * sin
  const startA = { x: MERGE.x - runX, y: MERGE.y - runY }
  const startB = { x: MERGE.x - runX, y: MERGE.y + runY }

  // Shared stem.
  const stem = { x1: MERGE.x, y1: MERGE.y, x2: STEM_END_X, y2: MERGE.y }

  /* -- run-in -------------------------------------------------------
     The route continues up-left / down-left beyond the visible arm so
     the train is already off-panel at t=0. The lead is sized so that
     even the headlight tip is clear of the panel's left edge, which
     stops a stray beam appearing before the train does. */
  const leadNeeded = (MERGE.x - PANEL.left + TRAIN_LEN / 2 + BEAM_LEN + 8) / cos - armLen
  const leadIn = Math.max(120, leadNeeded)
  const fullArm = armLen + leadIn

  const gateA = { x: MERGE.x - fullArm * cos, y: MERGE.y - fullArm * sin }
  const gateB = { x: MERGE.x - fullArm * cos, y: MERGE.y + fullArm * sin }

  // Run-out: past the right edge of the panel, by enough that the tail
  // has also cleared it.
  const endX = PANEL.right + TRAIN_LEN / 2 + RUN_OUT

  // A train's whole route: in from off-panel, down its own arm, through
  // the merge, out along the stem and away past the panel.
  const routeA = `M ${gateA.x} ${gateA.y} L ${MERGE.x} ${MERGE.y} L ${endX} ${MERGE.y}`
  const routeB = `M ${gateB.x} ${gateB.y} L ${MERGE.x} ${MERGE.y} L ${endX} ${MERGE.y}`

  // Lengths, so the caller can keep the on-screen speed constant across
  // the different approach angles.
  const inLen = fullArm
  const stemLen = endX - MERGE.x
  const totalLen = inLen + stemLen
  // The stretch a viewer actually sees: entering the panel to leaving it.
  const visibleLen = armLen + (PANEL.right - MERGE.x)

  /* Where a train waits for its road.

     The train stops with its NOSE short of its signal, leaving a clear gap, so
     the "red means stop" reading is unambiguous. The signal is therefore placed
     a half-body plus that gap further along the arm - deriving both from one
     number is what stops the train drifting onto the lamp again.

     stopDist is measured from the visible start of the arm. The floor keeps
     the whole body on the drawn arm, and the fraction keeps it back from the
     APPROACH label on the short 45/60 degree approaches. */
  const SIGNAL_GAP = 24
  const stopDist = Math.max(TRAIN_LEN / 2 + SIGNAL_GAP, armLen * 0.28)
  const stopT = (leadIn + stopDist) / totalLen

  // The signal stands clear ahead of the stopped train's nose.
  const signalDist = stopDist + TRAIN_LEN / 2 + SIGNAL_GAP
  const SIGNAL_OFFSET = 46
  const signalAlong = Math.min(0.92, signalDist / armLen)
  const signalA = {
    x: startA.x + runX * signalAlong + sin * SIGNAL_OFFSET,
    y: startA.y + runY * signalAlong - cos * SIGNAL_OFFSET,
  }
  const signalB = {
    x: startB.x + runX * signalAlong + sin * SIGNAL_OFFSET,
    y: startB.y - runY * signalAlong + cos * SIGNAL_OFFSET,
  }

  return {
    angle,
    sin,
    cos,
    armLen,
    startA,
    startB,
    stem,
    routeA,
    routeB,
    armPathA: `M ${startA.x} ${startA.y} L ${MERGE.x} ${MERGE.y}`,
    armPathB: `M ${startB.x} ${startB.y} L ${MERGE.x} ${MERGE.y}`,
    totalLen,
    visibleLen,
    stopT,
    signalA,
    signalB,
    labels: {
      // Approach names are anchored to the left edge, clear of the arms at
      // every angle. MERGE sits in the empty wedge BETWEEN the two arms: put
      // it on the stem or on the merge point and a passing train paints over
      // it, because the trains are drawn after the labels.
      approachA: { x: PANEL.left + 46, y: 26 },
      approachB: { x: PANEL.left + 46, y: VIEWBOX.h - 16 },
      junction: { x: MERGE.x - 104, y: MERGE.y + 4 },
      stem: { x: (MERGE.x + STEM_END_X) / 2, y: MERGE.y + 38 },
    },
  }
}

/**
 * Point and heading at `t` (0..1) along an SVG path element.
 *
 * This is what keeps the train glued to the rails: we ask the browser
 * where the real, rendered path is, and take the tangent from two nearby
 * samples. The train's rotation is therefore the track's own angle by
 * construction - there is no second set of numbers to fall out of sync.
 *
 * @param {SVGPathElement} pathEl
 * @param {number} t normalised position along the path
 */
export function samplePath(pathEl, t) {
  const total = pathEl.getTotalLength()
  if (!total) return { x: 0, y: 0, angle: 0 }

  const clamped = Math.max(0, Math.min(1, t))
  const at = clamped * total

  // Tangent from a short baseline so the heading is stable.
  const eps = Math.min(4, total / 2)
  const p1 = pathEl.getPointAtLength(at)
  const p2 = pathEl.getPointAtLength(Math.min(total, at + eps))
  const p0 = pathEl.getPointAtLength(Math.max(0, at - eps))

  const useForward = at + eps <= total
  const dx = (useForward ? p2.x - p1.x : p1.x - p0.x) || (useForward ? eps : -eps)
  const dy = useForward ? p2.y - p1.y : p1.y - p0.y

  return {
    x: p1.x,
    y: p1.y,
    angle: (Math.atan2(dy, dx) * 180) / Math.PI,
  }
}
