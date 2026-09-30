import axios from 'axios'

/** Backend base URL: defaults to LAN IP 10.253.77.237:8000 or current hostname */
const DEFAULT_HOST = typeof window !== 'undefined' && window.location?.hostname ? window.location.hostname : '10.253.77.237'
export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || `http://${DEFAULT_HOST}:8000`
).replace(/\/+$/, '')

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

/** Turn an axios failure into something a dispatcher can act on. */
export function describeApiError(error) {
  const detail = error?.response?.data?.detail
  if (typeof detail === 'string' && detail.length > 0) {
    return detail
  }
  if (Array.isArray(detail) && detail.length > 0) {
    return detail.map((item) => item.msg || JSON.stringify(item)).join('; ')
  }
  if (error?.code === 'ERR_NETWORK' || error?.code === 'ECONNABORTED') {
    return `Cannot reach the simulation backend at ${API_BASE_URL}. Start it with "python backend/main.py".`
  }
  return error?.message || 'Unexpected error while talking to the backend.'
}

export const getHealth = () => api.get('/health').then((response) => response.data)
export const getState = () => api.get('/state').then((response) => response.data)
export const getResults = () => api.get('/results').then((response) => response.data)
export const getScenarios = () => api.get('/scenarios').then((response) => response.data)
export const injectDisruption = (payload) =>
  api.post('/disruption', payload).then((response) => response.data)
export const runOptimizer = (payload = {}) =>
  api.post('/optimize', payload).then((response) => response.data)
export const validatePlan = (schedule = 'active') =>
  api.post('/validate', { schedule }).then((response) => response.data)
export const resetSimulation = (payload = { clear_disruptions: true }) =>
  api.post('/reset', payload).then((response) => response.data)
