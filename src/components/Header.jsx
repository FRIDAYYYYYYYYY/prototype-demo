import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Toolbar from '@mui/material/Toolbar'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { alpha } from '@mui/material/styles'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import HubRoundedIcon from '@mui/icons-material/HubRounded'
import ThemeModeToggle from './ThemeModeToggle'

export default function Header({
  isOptimized,
  activeDisruptions = 0,
  autoPlaying = false,
  onRefresh,
  refreshing = false,
}) {
  return (
    <AppBar
      position="sticky"
      sx={{
        borderBottom: 1,
        borderColor: 'divider',
        backgroundColor: (theme) =>
          theme.palette.mode === 'dark' ? alpha('#0b0f19', 0.9) : alpha('#ffffff', 0.95),
        backdropFilter: 'blur(12px)',
        zIndex: 1100,
      }}
    >
      <Toolbar
        sx={{
          minHeight: { xs: 58, md: 62 },
          px: { xs: 2, md: 3 },
          gap: 2,
          justifyContent: 'space-between',
        }}
      >
        {/* Brand & Mission Control Info */}
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 1.5,
              display: 'grid',
              placeItems: 'center',
              color: '#ffffff',
              background: (theme) =>
                `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
              boxShadow: (theme) =>
                `0 2px 8px ${alpha(theme.palette.primary.main, 0.4)}`,
            }}
          >
            <HubRoundedIcon fontSize="small" />
          </Box>

          <Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography
                variant="h6"
                sx={{
                  fontSize: '0.98rem',
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                }}
              >
                RAILTRAFFIC TMS
              </Typography>
              <Chip
                label="LIVE DEMO"
                size="small"
                sx={{
                  height: 18,
                  fontSize: '0.62rem',
                  fontWeight: 800,
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12),
                  color: 'primary.main',
                  letterSpacing: '0.06em',
                  borderRadius: 1,
                }}
              />
            </Stack>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', fontSize: '0.7rem' }}
            >
              Autonomous Train Dispatch & CP-SAT Conflict Resolution Platform
            </Typography>
          </Box>
        </Stack>

        {/* Live Presentation Mode Status */}
        <Stack direction="row" spacing={1} alignItems="center">
          {/* Auto-Demo Badge */}
          {autoPlaying ? (
            <Chip
              size="small"
              color="info"
              variant="filled"
              label="● AUTO-DEMO ACTIVE"
              sx={{
                fontWeight: 800,
                fontSize: '0.68rem',
                fontFamily: 'monospace',
                letterSpacing: '0.05em',
                animation: 'pulse 2s infinite',
              }}
            />
          ) : (
            <Chip
              size="small"
              variant="outlined"
              label="DEMO READY"
              sx={{ fontWeight: 700, fontSize: '0.68rem', fontFamily: 'monospace' }}
            />
          )}

          {/* Operational Status */}
          {isOptimized ? (
            <Chip
              size="small"
              color="success"
              variant="filled"
              label="AI RESOLVED"
              sx={{ fontWeight: 800, fontSize: '0.68rem', fontFamily: 'monospace' }}
            />
          ) : activeDisruptions > 0 ? (
            <Chip
              size="small"
              color="error"
              variant="filled"
              label="INCIDENT DETECTED"
              sx={{ fontWeight: 800, fontSize: '0.68rem', fontFamily: 'monospace' }}
            />
          ) : (
            <Chip
              size="small"
              color="success"
              variant="outlined"
              label="SYSTEM NOMINAL"
              sx={{ fontWeight: 800, fontSize: '0.68rem', fontFamily: 'monospace' }}
            />
          )}

          <Divider orientation="vertical" flexItem sx={{ my: 1, mx: 0.5 }} />

          <Tooltip title="Reset & Refresh">
            <span>
              <IconButton
                size="small"
                onClick={onRefresh}
                disabled={refreshing}
                color="inherit"
                aria-label="Refresh"
                sx={{
                  border: 1,
                  borderColor: 'divider',
                  width: 32,
                  height: 32,
                }}
              >
                <RefreshRoundedIcon
                  fontSize="small"
                  className={refreshing ? 'spin' : ''}
                />
              </IconButton>
            </span>
          </Tooltip>

          <ThemeModeToggle />
        </Stack>
      </Toolbar>
    </AppBar>
  )
}
