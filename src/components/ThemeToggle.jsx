import { useCallback, useEffect, useState } from 'react'
import Icon from './Icon.jsx'

/** Key shared with the pre-paint bootstrap script in index.html. */
const THEME_KEY = 'rg-theme'

/**
 * Read the theme from the document rather than a second copy in state.
 * index.html sets `data-theme` before the first paint, so this is always the
 * real current value - including a choice carried over from a previous visit.
 */
function currentTheme() {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
}

/** Light / dark switch. Persisted to localStorage; follows the OS on first run. */
export default function ThemeToggle() {
  const [theme, setTheme] = useState(currentTheme)

  const apply = useCallback((next) => {
    document.documentElement.dataset.theme = next
    setTheme(next)
    try {
      localStorage.setItem(THEME_KEY, next)
    } catch {
      /* private mode - the in-memory switch still works */
    }
  }, [])

  // Derive the next theme from the DOM, not from `theme`, so the button can
  // never disagree with what is actually painted.
  const toggle = useCallback(() => {
    apply(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark')
  }, [apply])

  // Keep in step if the theme changes in another tab, or via devtools.
  useEffect(() => {
    const onStorage = (event) => {
      if (event.key === THEME_KEY) setTheme(currentTheme())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  // Enable the global theme cross-fade only after the first paint.
  useEffect(() => {
    const id = requestAnimationFrame(() => document.documentElement.classList.add('theme-ready'))
    return () => cancelAnimationFrame(id)
  }, [])

  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      className="themetoggle"
      onClick={toggle}
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'Switch to light appearance' : 'Switch to dark appearance'}
      title={isDark ? 'Light appearance' : 'Dark appearance'}
    >
      <span className="themetoggle__thumb">
        <Icon name={isDark ? 'moon' : 'sun'} size={14} stroke={1.9} />
      </span>
      <span className="themetoggle__icons" aria-hidden="true">
        <Icon name="sun" size={13} className="themetoggle__sun" />
        <Icon name="moon" size={13} className="themetoggle__moon" />
      </span>
    </button>
  )
}