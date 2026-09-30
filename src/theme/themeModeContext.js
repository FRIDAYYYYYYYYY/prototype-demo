import { createContext } from 'react'

/** localStorage key that keeps the dispatcher's theme choice between reloads. */
export const THEME_MODE_STORAGE_KEY = 'train-traffic-control:theme-mode'

/** `system` follows the operating system, `light` / `dark` are explicit. */
export const THEME_MODES = /** @type {const} */ (['light', 'dark', 'system'])

export const ThemeModeContext = createContext(null)
