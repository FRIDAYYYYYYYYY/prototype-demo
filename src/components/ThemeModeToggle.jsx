import { useState } from 'react'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Tooltip from '@mui/material/Tooltip'
import ArrowDropDownRoundedIcon from '@mui/icons-material/ArrowDropDownRounded'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded'
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded'
import SettingsBrightnessRoundedIcon from '@mui/icons-material/SettingsBrightnessRounded'
import { useThemeMode } from '../theme/useThemeMode'

const MODE_META = {
  light: { label: 'Light screen', icon: <LightModeRoundedIcon fontSize="small" /> },
  dark: { label: 'Dark screen', icon: <DarkModeRoundedIcon fontSize="small" /> },
  system: { label: 'Follow system', icon: <SettingsBrightnessRoundedIcon fontSize="small" /> },
}

/**
 * One click flips the **entire** dashboard between light and dark; the drop down
 * additionally offers "follow system" so the prototype matches the OS.
 */
export default function ThemeModeToggle() {
  const { mode, resolvedMode, setMode, toggleMode } = useThemeMode()
  const [anchorEl, setAnchorEl] = useState(null)
  const nextLabel = resolvedMode === 'dark' ? 'light' : 'dark'

  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Tooltip title={`Switch to ${nextLabel} screen`}>
        <IconButton
          onClick={toggleMode}
          color="inherit"
          aria-label={`Switch to ${nextLabel} screen`}
          sx={{
            border: 1,
            borderColor: 'divider',
            borderRadius: 2,
            px: 1,
            gap: 0.5,
          }}
        >
          {resolvedMode === 'dark' ? (
            <LightModeRoundedIcon fontSize="small" />
          ) : (
            <DarkModeRoundedIcon fontSize="small" />
          )}
        </IconButton>
      </Tooltip>
      <Tooltip title="Screen mode options">
        <IconButton
          size="small"
          color="inherit"
          aria-label="Screen mode options"
          onClick={(event) => setAnchorEl(event.currentTarget)}
        >
          <ArrowDropDownRoundedIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {Object.entries(MODE_META).map(([value, meta]) => (
          <MenuItem
            key={value}
            selected={mode === value}
            onClick={() => {
              setMode(value)
              setAnchorEl(null)
            }}
          >
            <ListItemIcon>{meta.icon}</ListItemIcon>
            <ListItemText>{meta.label}</ListItemText>
            {mode === value ? <CheckRoundedIcon fontSize="small" color="primary" /> : null}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  )
}
