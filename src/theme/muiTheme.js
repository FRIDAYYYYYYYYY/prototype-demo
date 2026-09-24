import { alpha, createTheme } from '@mui/material/styles'

/** Colour tokens for both themes. Clean, modern enterprise command center style. */
const PALETTES = {
  light: {
    primary: { main: '#2563eb', light: '#3b82f6', dark: '#1d4ed8', contrastText: '#ffffff' },
    secondary: { main: '#0d9488' },
    success: { main: '#059669', light: '#10b981', dark: '#047857' },
    warning: { main: '#d97706', light: '#f59e0b', dark: '#b45309' },
    error: { main: '#dc2626', light: '#ef4444', dark: '#b91c1c' },
    info: { main: '#0284c7', light: '#0ea5e9', dark: '#0369a1' },
    background: { default: '#f8fafc', paper: '#ffffff' },
    text: { primary: '#0f172a', secondary: '#64748b', disabled: '#94a3b8' },
    divider: 'rgba(15, 23, 42, 0.08)',
    action: {
      active: 'rgba(15, 23, 42, 0.06)',
      hover: 'rgba(15, 23, 42, 0.03)',
      selected: 'rgba(37, 99, 235, 0.08)',
    },
  },
  dark: {
    primary: { main: '#3b82f6', light: '#60a5fa', dark: '#2563eb', contrastText: '#ffffff' },
    secondary: { main: '#14b8a6' },
    success: { main: '#10b981', light: '#34d399', dark: '#059669' },
    warning: { main: '#f59e0b', light: '#fbbf24', dark: '#d97706' },
    error: { main: '#ef4444', light: '#f87171', dark: '#dc2626' },
    info: { main: '#38bdf8', light: '#7dd3fc', dark: '#0284c7' },
    background: { default: '#0b0f19', paper: '#111827' },
    text: { primary: '#f1f5f9', secondary: '#94a3b8', disabled: '#64748b' },
    divider: 'rgba(255, 255, 255, 0.08)',
    action: {
      active: 'rgba(255, 255, 255, 0.06)',
      hover: 'rgba(255, 255, 255, 0.03)',
      selected: 'rgba(59, 130, 246, 0.14)',
    },
  },
}

/**
 * Build the Material UI theme for a resolved colour mode.
 */
export function getTheme(mode) {
  const isDark = mode === 'dark'
  const palette = PALETTES[isDark ? 'dark' : 'light']
  const border = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.08)'

  return createTheme({
    palette: {
      mode: isDark ? 'dark' : 'light',
      ...palette,
    },
    shape: { borderRadius: 12 },
    typography: {
      fontFamily: [
        'Inter',
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        'sans-serif',
      ].join(','),
      h1: { fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.025em' },
      h2: { fontSize: '1.65rem', fontWeight: 700, letterSpacing: '-0.02em' },
      h5: { fontWeight: 700, letterSpacing: '-0.015em' },
      h6: { fontWeight: 650, letterSpacing: '-0.01em', fontSize: '1.05rem' },
      subtitle1: { fontWeight: 600, fontSize: '0.95rem' },
      subtitle2: { fontWeight: 600, fontSize: '0.85rem' },
      overline: { letterSpacing: '0.08em', fontWeight: 700, fontSize: '0.68rem', textTransform: 'uppercase' },
      caption: { letterSpacing: '0.01em', fontSize: '0.75rem' },
      button: { textTransform: 'none', fontWeight: 600, letterSpacing: 0 },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: palette.background.default,
            color: palette.text.primary,
            backgroundImage: isDark
              ? 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(59, 130, 246, 0.08), transparent 70%)'
              : 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(37, 99, 235, 0.05), transparent 70%)',
            backgroundAttachment: 'fixed',
          },
        },
      },
      MuiPaper: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
      MuiCard: {
        defaultProps: { variant: 'outlined' },
        styleOverrides: {
          root: {
            borderColor: border,
            backgroundColor: isDark ? '#111827' : '#ffffff',
            boxShadow: isDark
              ? '0 1px 3px 0 rgba(0, 0, 0, 0.3)'
              : '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
            transition: 'border-color 150ms ease, box-shadow 150ms ease',
          },
        },
      },
      MuiAppBar: {
        defaultProps: { elevation: 0, color: 'transparent' },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderColor: palette.divider,
            padding: '10px 14px',
          },
          head: {
            fontWeight: 650,
            fontSize: '0.72rem',
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: palette.text.secondary,
            backgroundColor: isDark ? alpha('#1e293b', 0.4) : alpha('#f1f5f9', 0.6),
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            fontWeight: 600,
            fontSize: '0.75rem',
            height: 24,
          },
          outlined: {
            borderColor: border,
          },
        },
      },
      MuiTooltip: {
        defaultProps: { arrow: true, enterDelay: 200, enterNextDelay: 100 },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            boxShadow: 'none',
            '&:hover': {
              boxShadow: 'none',
            },
          },
          contained: {
            backgroundColor: palette.primary.main,
            color: '#ffffff',
            '&:hover': {
              backgroundColor: palette.primary.dark,
            },
          },
          outlined: {
            borderColor: border,
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
          },
        },
      },
      MuiLinearProgress: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.06)',
            borderRadius: 999,
          },
        },
      },
    },
  })
}
