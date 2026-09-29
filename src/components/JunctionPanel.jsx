import { useCallback, useEffect, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { alpha, useTheme } from '@mui/material/styles'
import BoltRoundedIcon from '@mui/icons-material/BoltRounded'
import { describeApiError, getBlockState, getHardwareStatus } from '../api'

/**
 * Live view of the physical junction loop.
 *
 * Reads the backend only - it never re-implements any decision logic. The
 * aspects shown here are exactly the ones the ESP32 receives from
 * `GET /block-state`, so the dashboard and the physical signals agree.
 *
 * Advisory only: this is decision support for a human dispatcher, not
 * autonomous train control.
 */

const POLL_MS = 1500

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
