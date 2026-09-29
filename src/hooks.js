import { useCallback, useEffect, useRef, useState } from 'react'
import api from './api.js'

/** Animated number that eases from 0 to `value`. */
export function useCountUp(value, { duration = 1100, decimals = 0, start = true } = {}) {
  const [display, setDisplay] = useState(0)
  const raf = useRef(0)

  useEffect(() => {
    if (!start) return
    const t0 = performance.now()
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setDisplay(value * eased)
      if (p < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [value, duration, start])

  return display.toFixed(decimals)
}

/** Adds `is-visible` once the element scrolls into view (drives reveal animations). */
export function useReveal(threshold = 0.14) {
  const ref = useRef(null)
  // Without IntersectionObserver (e.g. SSR / very old browsers) reveal immediately.
  const [visible, setVisible] = useState(() => typeof IntersectionObserver === 'undefined')

  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          io.disconnect()
        }
      },
      { threshold },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [threshold])

  return [ref, visible]
}

/** Ticking clock string, e.g. 10:42:18 */
export function useClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return now.toLocaleTimeString('en-GB', { hour12: false })
}


/**
 * Live backend connection state, polled on an interval.
 *
 * `online` is false when the API is unreachable, which is what lets the UI say
 * "showing recorded values" instead of silently presenting stale numbers as if
 * they were live.
 */
export function useBackend(intervalMs = 2000) {
  const [online, setOnline] = useState(false)
  const [checked, setChecked] = useState(false)
  const [lastSeen, setLastSeen] = useState(null)

  const refresh = useCallback(async () => {
    const health = await api.health()
    setOnline(Boolean(health))
    setChecked(true)
    if (health) setLastSeen(new Date())
  }, [])

  useEffect(() => {
    // Poll the liveness endpoint. This is genuine external-system
    // synchronisation, so the interval is the whole point of the hook.
    let cancelled = false

    const tick = async () => {
      const health = await api.health()
      if (cancelled) return
      setOnline(Boolean(health))
      setChecked(true)
      if (health) setLastSeen(new Date())
    }

    tick()
    const id = setInterval(tick, intervalMs)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [intervalMs])

  return { online, checked, lastSeen, refresh }
}

/**
 * Polls a backend endpoint, returning the payload or `null`.
 *
 * Used for the junction signals and the results payload. `null` is a valid
 * state throughout: it means "backend not answering", and each component
 * decides what to render in that case. `fetcher` must be a stable reference
 * (e.g. `api.blockState`), since changing it restarts the poll.
 */
export function usePolledEndpoint(fetcher, intervalMs = 2000) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const tick = async () => {
      const payload = await fetcher()
      if (cancelled) return
      setData(payload)
      setLoading(false)
    }

    tick()
    const id = setInterval(tick, intervalMs)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [fetcher, intervalMs])

  return { data, loading }
}

/**
 * Trigger a state-changing backend call (disrupt, optimize, reset, sensor event).
 *
 * Returns a `run` function plus a `busy` flag so buttons can disable while a
 * solve is in flight.
 */
export function useAction() {
  const [busy, setBusy] = useState(false)

  const run = useCallback(async (fetcher) => {
    setBusy(true)
    try {
      return await fetcher()
    } finally {
      setBusy(false)
    }
  }, [])

  return { run, busy }
}
