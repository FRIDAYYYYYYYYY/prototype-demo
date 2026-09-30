// API client for the FastAPI backend.
//
// The dashboard renders live backend data; `src/data/*.js` only supplies the
// shapes and the offline fallback so the page is still meaningful when the
// backend is not running. Every helper resolves to `null` on failure rather
// than throwing, because a dropped backend must degrade the dashboard, never
// break it mid-demo.

const RAW_BASE = import.meta.env.VITE_API_BASE_URL
const DEFAULT_HOST = typeof window !== 'undefined' && window.location?.hostname ? window.location.hostname : '10.253.77.237'
const BASE = (RAW_BASE ?? `http://${DEFAULT_HOST}:8000`).replace(/\/+$/, '')

/** Milliseconds before a request is abandoned. */
const TIMEOUT_MS = 8000

async function request(path, { method = 'GET', body, signal } = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const response = await fetch(`${BASE}${path}`, {
      method,
      signal: signal ?? controller.signal,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
    if (!response.ok) return null
    return await response.json()
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

export const api = {
  base: BASE,

  health: () => request('/health'),
  state: () => request('/state'),
  results: () => request('/results'),
  scenarios: () => request('/scenarios'),

  // Phase A/B - physical junction
  hardwareContract: () => request('/hardware/contract'),
  hardwareStatus: () => request('/hardware/status'),
  blockState: () => request('/block-state'),
  sensorEvent: (event) => request('/sensor-event', { method: 'POST', body: event }),
  resetSensorState: () => request('/sensor-event/reset', { method: 'POST' }),

  // Corridor controls
  optimize: (body = { time_limit_s: 5 }) => request('/optimize', { method: 'POST', body }),
  disrupt: (body) => request('/disruption', { method: 'POST', body }),
  reset: () => request('/reset', { method: 'POST', body: { clear_disruptions: true } }),

  // Phase D - persistence
  persistence: () => request('/persistence'),

  // Phase F - ML advisory layer
  mlStatus: () => request('/ml/status'),
  mlInsights: () => request('/ml/insights', { method: 'POST' }),
}

// Backward compatibility helper exports
export const API_BASE_URL = BASE
export const getHealth = api.health
export const getState = api.state
export const getResults = api.results
export const getScenarios = api.scenarios
export const injectDisruption = api.disrupt
export const runOptimizer = api.optimize
export const resetSimulation = api.reset
export function describeApiError(error) {
  return error?.message || 'Unexpected error while talking to the backend.'
}

export default api
