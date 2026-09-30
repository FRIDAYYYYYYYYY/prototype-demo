/**
 * RailGuard AI - Motion Design Tokens & Utilities
 * Powered by Anime.js v4
 */
import { cubicBezier } from 'animejs'

export const EASING = {
  // Apple-grade fluid deceleration curve
  appleSmooth: 'cubicBezier(0.16, 1, 0.3, 1)',
  appleCurve: cubicBezier(0.16, 1, 0.3, 1),
  
  // Spring with low bounce, high damping for physical UI elements
  springGentle: 'spring(1, 90, 14, 0)',
  
  // Energetic accent for buttons, badges, status highlights
  punchy: 'cubicBezier(0.34, 1.56, 0.64, 1)',
  punchyCurve: cubicBezier(0.34, 1.56, 0.64, 1),
  
  // Clean linear for continuous telemetry flow
  linear: 'linear',
}

export const DURATION = {
  instant: 120,
  fast: 240,
  base: 480,
  slow: 800,
  deliberate: 1200,
  glider: 4800,
}

export function isReducedMotion() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
