import { useCallback, useEffect, useMemo, useState } from 'react'
import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import { getTheme } from './muiTheme'
import { THEME_MODE_STORAGE_KEY, ThemeModeContext } from './themeModeContext'

function readStoredMode() {
  if (typeof window === 'undefined') {
    return 'system'
  }
  const stored = window.localStorage.getItem(THEME_MODE_STORAGE_KEY)
  return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system'
}

/**
 * Owns the single source of truth for the colour mode so that **the whole UI**
 * switches between light and dark at the same time:
 *
 * * `mode`         - what the dispatcher picked (`light` | `dark` | `system`)
 * * `resolvedMode` - the mode actually rendered
 *
 * The choice is persisted in localStorage and mirrored onto `<html data-theme>`
 * so plain CSS in `index.css` can follow along as well.
 */
export default function ThemeModeProvider({ children }) {
  const [mode, setMode] = useState(readStoredMode)
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)', { noSsr: true })
  const resolvedMode = mode === 'system' ? (prefersDark ? 'dark' : 'light') : mode
  const theme = useMemo(() => getTheme(resolvedMode), [resolvedMode])

  useEffect(() => {
    window.localStorage.setItem(THEME_MODE_STORAGE_KEY, mode)
  }, [mode])

  useEffect(() => {
    const root = document.documentElement
    root.dataset.theme = resolvedMode
    root.style.colorScheme = resolvedMode
  }, [resolvedMode])

  const toggleMode = useCallback(() => {
    setMode((current) => {
      if (current === 'dark') return 'light'
      if (current === 'light') return 'dark'
      return prefersDark ? 'light' : 'dark'
    })
  }, [prefersDark])

  const value = useMemo(
    () => ({ mode, resolvedMode, setMode, toggleMode }),
    [mode, resolvedMode, setMode, toggleMode],
  )

  return (
    <ThemeModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline enableColorScheme />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  )
}
