import { useCallback, useEffect, useRef, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { alpha, useTheme } from '@mui/material/styles'
import BoltRoundedIcon from '@mui/icons-material/BoltRounded'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import {
  describeApiError,
  getBlockState,
  getHardwareStatus,
  postSensorEvent,
  resetHardware,
} from '../api'

/**
 * Live view of the physical junction loop.
 *
 * Reads the backend only - it never re-implements any decision logic. The
 * aspects shown here are exactly the ones the ESP32 receives from
 * `GET /block-state`, so the dashboard and the physical signals agree.
 *
 * The four buttons below are a **software stand-in for the physical sensors**:
 * each one POSTs the exact payload the ESP32 firmware would send, through the
 * same `/sensor-event` endpoint, so the full validation -> conflict detection
 * -> CP-SAT -> validator -> recommender chain really runs. They are how the demo
 * is driven when no board is connected, and they are labelled as simulation.
 *
 * Advisory only: this is decision support for a human dispatcher, not
 * autonomous train control.
 */

const POLL_MS = 1500

/** Base epoch so simulated timestamps look like real ones. */
const EPOCH_BASE_MS = 1732500000000

/** The four contract sensors, with the state each one reports. */
const SENSOR_BUTTONS = [
  { id: 'A1', label: 'A1', state: 'occupied', pin: 22, caption: 'Train A approaching' },
  { id: 'A2', label: 'A2', state: 'free', pin: 19, caption: 'Train A cleared' },
  { id: 'B1', label: 'B1', state: 'occupied', pin: 21, caption: 'Train B approaching' },
  { id: 'B2', label: 'B2', state: 'free', pin: 18, caption: 'Train B cleared' },
]

function AspectBadge({ block, signal }) {
  const theme = useTheme()
  const isProceed = signal === 'PROCEED'
  const colour = isProceed ? 'success' : 'error'
  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 0,
        p: 1.25,
        borderRadius: 2,
        textAlign: 'center',
        border: '1px solid',
        borderColor: alpha(theme.palette[colour].main, 0.5),
        bgcolor: alpha(theme.palette[colour].main, 0.12),
      }}
    >
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
        BLOCK {block}
      </Typography>
      <Typography
        variant="h6"
        sx={{ fontWeight: 900, letterSpacing: '0.06em', color: `${colour}.main` }}
      >
        {signal}
      </Typography>
    </Box>
  )
}

export default function JunctionPanel() {
  const theme = useTheme()
  const [blockState, setBlockState] = useState(null)
  const [status, setStatus] = useState(null)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)
  const [busy, setBusy] = useState(null)

  /** Per-source sequence counter, mirroring the firmware's boot-seeded `seq`. */
  const seqRef = useRef({ sensor_A1: 0, sensor_A2: 0, sensor_B1: 0, sensor_B2: 0 })
  /** Monotonic clock so successive simulated arrivals have increasing timestamps. */
  const clockRef = useRef(EPOCH_BASE_MS)

  const poll = useCallback(async () => {
    try {
      const [state, hardware] = await Promise.all([getBlockState(), getHardwareStatus()])
      setBlockState(state)
      setStatus(hardware?.state ?? null)
      setError(null)
    } catch (err) {
      setError(describeApiError(err))
    }
  }, [])

  /**
   * Send one sensor event exactly as the ESP32 firmware would.
   * `delayMs` lets a caller stage two arrivals with a realistic separation,
   * which is what creates (or avoids) a junction conflict.
   */
  const fireSensor = useCallback(
    async (sensor, delayMs = 0) => {
      const source = `sensor_${sensor.id}`
      clockRef.current += delayMs
      seqRef.current[source] += 1
      setBusy(sensor.id)
      try {
        const result = await postSensorEvent({
          block_id: sensor.id,
          state: sensor.state,
          event_type: 'sensor_triggered',
          timestamp: clockRef.current,
          source,
          seq: seqRef.current[source],
        })
        if (result?.status === 'ignored') {
          setNotice({ severity: 'info', text: `${sensor.id} ignored — ${result.reason}` })
        } else {
          const d = result?.decision
          setNotice({
            severity: d?.conflict ? 'warning' : 'success',
            text: d?.conflict
              ? `${sensor.id} accepted — conflict detected, CP-SAT decided`
              : `${sensor.id} accepted`,
          })
        }
        setError(null)
        await poll()
      } catch (err) {
        setError(describeApiError(err))
      } finally {
        setBusy(null)
      }
    },
    [poll],
  )

  /** Run the headline demo scenario: freight arrives, then the express 2 min later. */
  const runConflictScenario = useCallback(async () => {
    setBusy('scenario')
    try {
      await resetHardware()
      seqRef.current = { sensor_A1: 0, sensor_A2: 0, sensor_B1: 0, sensor_B2: 0 }
      clockRef.current = EPOCH_BASE_MS
      await poll()
      await fireSensor(SENSOR_BUTTONS[0], 0)       // A1 - freight approaches
      await fireSensor(SENSOR_BUTTONS[2], 120_000) // B1 - express 2 min later
    } finally {
      setBusy(null)
    }
  }, [fireSensor, poll])

  const handleReset = useCallback(async () => {
    setBusy('reset')
    try {
      await resetHardware()
      seqRef.current = { sensor_A1: 0, sensor_A2: 0, sensor_B1: 0, sensor_B2: 0 }
      clockRef.current = EPOCH_BASE_MS
      setNotice(null)
      await poll()
    } catch (err) {
      setError(describeApiError(err))
    } finally {
      setBusy(null)
    }
  }, [poll])

  useEffect(() => {
    poll()
    const id = setInterval(poll, POLL_MS)
    return () => clearInterval(id)
  }, [poll])

  const aspects = blockState?.blocks ?? []
  const decision = blockState?.decision ?? null
  const stale = blockState?.stale ?? true
  const source = decision?.source ?? 'none'
  const lastEvent = status?.last_event ?? null

  return (
    <Card
      sx={{
        p: { xs: 2, md: 2.5 },
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: alpha(theme.palette.background.paper, 0.6),
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
        <BoltRoundedIcon color="primary" fontSize="small" />
        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
          Physical Junction - Live Advisory
        </Typography>
        <Box sx={{ flex: 1 }} />
        <Chip
          size="small"
          variant="outlined"
          color={error ? 'error' : stale ? 'warning' : 'success'}
          label={error ? 'BACKEND OFFLINE' : stale ? 'STALE' : 'LIVE'}
          sx={{ fontWeight: 800, fontSize: '0.65rem' }}
        />
        {source === 'cpsat' && (
          <Chip size="small" color="primary" label="CP-SAT" sx={{ fontWeight: 800, fontSize: '0.65rem' }} />
        )}
        {source === 'fallback' && (
          <Chip size="small" color="warning" label="FALLBACK" sx={{ fontWeight: 800, fontSize: '0.65rem' }} />
        )}
      </Stack>

      <Typography variant="caption" color="text.secondary">
        Advisory signals for a human dispatcher. Not autonomous train control, not
        safety-certified, not connected to real railway infrastructure.
      </Typography>

      <Stack direction="row" spacing={1.5} sx={{ my: 1.5 }}>
        {aspects.length > 0 ? (
          aspects.map((block) => (
            <AspectBadge key={block.block_id} block={block.block_id} signal={block.signal} />
          ))
        ) : (
          <Typography variant="body2" color="text.disabled">
            Waiting for the backend...
          </Typography>
        )}
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 1 }}>
          {error}
        </Alert>
      )}

      <Typography variant="body2" sx={{ mb: 1 }}>
        {blockState?.reason ?? 'No junction data yet.'}
      </Typography>

      {/* -- Simulated sensor controls (stand-in for the physical board) ---- */}
      <Box
        sx={{
          p: 1.25,
          mb: 1,
          borderRadius: 2,
          border: '1px dashed',
          borderColor: 'divider',
          bgcolor: alpha(theme.palette.background.default, 0.4),
        }}
      >
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
          Simulated sensors — these POST the exact payload the ESP32 sends, so the real
          validation → CP-SAT → validator → recommender chain runs. Use these when no board
          is connected.
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
          {SENSOR_BUTTONS.map((sensor) => (
            <Tooltip key={sensor.id} title={`${sensor.caption} (GPIO ${sensor.pin})`}>
              <Button
                size="small"
                variant={sensor.state === 'occupied' ? 'contained' : 'outlined'}
                color={sensor.state === 'occupied' ? 'warning' : 'primary'}
                disabled={Boolean(busy)}
                onClick={() => fireSensor(sensor, 0)}
                sx={{ minWidth: 64, fontWeight: 800 }}
              >
                {sensor.label}
              </Button>
            </Tooltip>
          ))}
          <Box sx={{ flex: 1 }} />
          <Button
            size="small"
            variant="contained"
            color="secondary"
            disabled={Boolean(busy)}
            startIcon={<BoltRoundedIcon />}
            onClick={runConflictScenario}
            sx={{ fontWeight: 800 }}
          >
            Run conflict demo
          </Button>
          <Button
            size="small"
            variant="outlined"
            disabled={Boolean(busy)}
            startIcon={<RefreshRoundedIcon />}
            onClick={handleReset}
          >
            Reset
          </Button>
        </Stack>
        {notice && (
          <Typography variant="caption" sx={{ display: 'block', mt: 0.75, fontWeight: 700 }} color={`${notice.severity}.main`}>
            {notice.text}
          </Typography>
        )}
      </Box>

      <Divider sx={{ my: 1 }} />

      <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
        <Typography variant="caption" color="text.secondary">
          Decision source: <strong>{source}</strong>
        </Typography>
        {decision?.run_id && (
          <Typography variant="caption" color="text.secondary">
            Run: <strong>{decision.run_id}</strong>
          </Typography>
        )}
        <Typography variant="caption" color="text.secondary">
          Optimizer calls: <strong>{status?.optimizer_calls ?? 0}</strong>
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Last event:{' '}
          <strong>
            {lastEvent ? `${lastEvent.block_id} (seq ${lastEvent.seq})` : 'none'}
          </strong>
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Stale after: <strong>{status?.stale_threshold_s ?? 10}s</strong>
        </Typography>
      </Stack>
    </Card>
  )
}
