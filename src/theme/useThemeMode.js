import { useContext } from 'react'
import { ThemeModeContext } from './themeModeContext'

/**
 * Access the shared light/dark/system state.
 *
 * @returns {{
 *   mode: 'light' | 'dark' | 'system',
 *   resolvedMode: 'light' | 'dark',
 *   setMode: (mode: 'light' | 'dark' | 'system') => void,
 *   toggleMode: () => void,
 * }}
 */
export function useThemeMode() {
  const context = useContext(ThemeModeContext)
  if (!context) {
    throw new Error('useThemeMode must be used inside <ThemeModeProvider>')
  }
  return context
}
