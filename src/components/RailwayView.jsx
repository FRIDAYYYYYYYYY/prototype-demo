import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { alpha } from '@mui/material/styles'
import SensorsRoundedIcon from '@mui/icons-material/SensorsRounded'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded'

/**
 * Professional 3-aspect Railway Optical Signal Head (Red, Amber, Green).
 */
function RailwaySignal({ aspect = 'green', label }) {
  const isRed = aspect === 'red'
  const isAmber = aspect === 'amber'
  const isGreen = aspect === 'green'

  return (
    <Tooltip title={`Signal ${label}: ${aspect.toUpperCase()}`}>
      <Stack alignItems="center" spacing={0.5} sx={{ mx: 0.5, flexShrink: 0 }}>
        <Box
          sx={{
            width: 18,
            py: 0.4,
            px: 0.3,
            backgroundColor: '#0f172a',
            borderRadius: 1.5,
            border: '1px solid rgba(255,255,255,0.2)',
            display: 'flex',
            flexDirection: 'column',
            gap: '3px',
            alignItems: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
          }}
        >
          {/* Red Aspect */}
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: isRed ? '#ef4444' : '#334155',
              boxShadow: isRed ? '0 0 8px #ef4444' : 'none',
              transition: 'all 200ms ease',
            }}
          />
          {/* Amber Aspect */}
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: isAmber ? '#f59e0b' : '#334155',
              boxShadow: isAmber ? '0 0 8px #f59e0b' : 'none',
              transition: 'all 200ms ease',
            }}
          />
          {/* Green Aspect */}
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: isGreen ? '#10b981' : '#334155',
              boxShadow: isGreen ? '0 0 8px #10b981' : 'none',
              transition: 'all 200ms ease',
            }}
          />
        </Box>
        <Typography
          variant="caption"
          sx={{
            fontFamily: 'monospace',
            fontSize: '0.62rem',
            fontWeight: 700,
            color: 'text.secondary',
            letterSpacing: '-0.02em',
          }}
        >
          {label}
        </Typography>
      </Stack>
    </Tooltip>
  )
}

/**
 * Enterprise Train Dispatch Tag on Track.
 */
function TrainTelemetryTag({ train, delay = 0, isHeld = false, isConflict = false }) {
  return (
    <Box
      sx={{
        px: 1.25,
        py: 0.6,
        borderRadius: 1.5,
        backgroundColor: isConflict
          ? (theme) => alpha(theme.palette.error.main, 0.15)
          : delay > 0
          ? (theme) => alpha(theme.palette.warning.main, 0.14)
          : isHeld
          ? (theme) => alpha(theme.palette.info.main, 0.14)
          : (theme) => (theme.palette.mode === 'dark' ? '#1e293b' : '#f1f5f9'),
        border: 1,
        borderColor: isConflict
          ? 'error.main'
          : delay > 0
          ? 'warning.main'
          : isHeld
          ? 'info.main'
          : 'divider',
        boxShadow: isConflict ? '0 0 10px rgba(239, 68, 68, 0.2)' : 'none',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 1,
      }}
    >
      <Box
        sx={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: train.colour || '#3b82f6',
          flexShrink: 0,
        }}
      />
      <Box>
        <Stack direction="row" spacing={0.75} alignItems="center">
          <Typography
            variant="caption"
            sx={{ fontWeight: 800, fontSize: '0.75rem', fontFamily: 'monospace', lineHeight: 1 }}
          >
            {train.train_id}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontSize: '0.68rem', lineHeight: 1 }}
          >
            {train.name}
          </Typography>
        </Stack>

        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 0.25 }}>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              fontSize: '0.66rem',
              color: isConflict ? 'error.main' : delay > 0 ? 'warning.main' : 'success.main',
            }}
          >
            {isConflict
              ? 'SAFETY CONFLICT'
              : delay > 0
              ? `DELAY +${delay}m`
              : isHeld
              ? 'PLANNED HOLD'
              : 'ON SCHEDULE'}
          </Typography>
        </Stack>
      </Box>
    </Box>
  )
}

/**
 * Professional Station Platform Bay.
 */
function StationBay({ station, trainsAtStation }) {
  return (
    <Box
      sx={{
        width: 170,
        flexShrink: 0,
        p: 1.5,
        borderRadius: 2,
        backgroundColor: (theme) =>
          theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.5)' : '#ffffff',
        border: 1,
        borderColor: 'divider',
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
        <Box
          sx={{
            width: 24,
            height: 24,
            borderRadius: 1,
            display: 'grid',
            placeItems: 'center',
            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12),
            color: 'primary.main',
            fontWeight: 800,
            fontSize: '0.72rem',
            fontFamily: 'monospace',
          }}
        >
          {station.code || station.id}
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle2" noWrap sx={{ fontWeight: 700, fontSize: '0.82rem', lineHeight: 1.1 }}>
            {station.name}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
            {station.platforms} Platform{station.platforms > 1 ? 's' : ''}
          </Typography>
        </Box>
      </Stack>

      {/* Platform Track Visualization */}
      <Box
        sx={{
          p: 0.75,
          borderRadius: 1,
          bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#0f172a' : '#f8fafc'),
          border: '1px dashed',
          borderColor: 'divider',
          minHeight: 52,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        {trainsAtStation.length > 0 ? (
          <Stack spacing={0.5}>
            {trainsAtStation.map(({ train, delay, isHeld }) => (
              <TrainTelemetryTag
                key={train.train_id}
                train={train}
                delay={delay}
                isHeld={isHeld}
              />
            ))}
          </Stack>
        ) : (
          <Typography
            variant="caption"
            color="text.disabled"
            sx={{ textAlign: 'center', fontSize: '0.68rem' }}
          >
            Platforms Clear
          </Typography>
        )}
      </Box>
    </Box>
  )
}

/**
 * Inter-Station Track Block with Rail Segment & Signal.
 */
function TrackBlockSegment({ block, signalAspect, signalLabel, trainsInBlock, conflicts }) {
  const isConflict = conflicts.length > 0
  const isOccupied = trainsInBlock.length > 0

  return (
    <Stack direction="row" alignItems="center" spacing={1} sx={{ flexShrink: 0, px: 0.5 }}>
      {/* Entry Optical Signal */}
      <RailwaySignal aspect={signalAspect} label={signalLabel} />

      {/* Physical Track Block */}
      <Box
        sx={{
          width: 220,
          p: 1.5,
          borderRadius: 2,
          backgroundColor: isConflict
            ? (theme) => alpha(theme.palette.error.main, 0.08)
            : isOccupied
            ? (theme) => alpha(theme.palette.warning.main, 0.06)
            : (theme) => (theme.palette.mode === 'dark' ? 'rgba(15, 23, 42, 0.6)' : '#ffffff'),
          border: 1,
          borderColor: isConflict
            ? 'error.main'
            : isOccupied
            ? 'warning.main'
            : 'divider',
          transition: 'border-color 200ms ease, background-color 200ms ease',
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 800, fontFamily: 'monospace', display: 'block' }}>
              {block.id} · {block.name}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
              {block.length_km} km · Track Interlocked
            </Typography>
          </Box>
          <Chip
            size="small"
            color={isConflict ? 'error' : isOccupied ? 'warning' : 'default'}
            variant={isConflict || isOccupied ? 'filled' : 'outlined'}
            label={isConflict ? 'CONFLICT' : isOccupied ? 'OCCUPIED' : 'CLEAR'}
            sx={{
              height: 18,
              fontSize: '0.62rem',
              fontWeight: 800,
              fontFamily: 'monospace',
              letterSpacing: '0.04em',
            }}
          />
        </Stack>

        {/* Rail Graphic */}
        <Box
          sx={{
            py: 0.75,
            px: 1,
            borderRadius: 1,
            bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#0b0f19' : '#f1f5f9'),
            border: 1,
            borderColor: 'divider',
            position: 'relative',
          }}
        >
          {/* Dual rail lines */}
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: 4,
              right: 4,
              height: 4,
              borderTop: '1px solid',
              borderBottom: '1px solid',
              borderColor: (theme) =>
                isConflict
                  ? theme.palette.error.main
                  : isOccupied
                  ? theme.palette.warning.main
                  : theme.palette.divider,
              transform: 'translateY(-50%)',
              zIndex: 1,
              opacity: isOccupied || isConflict ? 0.9 : 0.4,
            }}
          />

          {/* Active Train on Track */}
          <Box sx={{ position: 'relative', zIndex: 2, minHeight: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {isOccupied ? (
              <Stack spacing={0.5} sx={{ width: '100%' }}>
                {trainsInBlock.map(({ train, delay }) => (
                  <TrainTelemetryTag
                    key={train.train_id}
                    train={train}
                    delay={delay}
                    isConflict={isConflict}
                  />
                ))}
              </Stack>
            ) : (
              <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.65rem', fontFamily: 'monospace' }}>
                ────── Track Section Clear ──────
              </Typography>
            )}
          </Box>
        </Box>

        {isConflict ? (
          <Typography
            variant="caption"
            color="error.main"
            sx={{ fontWeight: 700, fontSize: '0.68rem', display: 'block', mt: 0.75 }}
          >
            {conflicts[0]?.message || 'Headway safety breach detected!'}
          </Typography>
        ) : null}
      </Box>
    </Stack>
  )
}

/**
 * Enterprise Corridor Track & Signal Interlocking Map.
 * Renders live topological dispatch status without any game sliders or video controls.
 */
export default function RailwayView({ topology, schedule, validation }) {
  if (!topology || !schedule) return null

  const conflicts = validation?.conflicts ?? []
  const trains = Object.values(schedule.trains || {})

  // Compute station and block train distribution based on the active schedule
  const getTrainsAtStation = (stationId) => {
    return trains
      .filter((t) => {
        const stop = t.stations?.[stationId]
        return stop && (stop.hold_min > 0 || stop.delay > 0)
      })
      .map((t) => ({
        train: t,
        delay: t.stations[stationId].delay || 0,
        isHeld: (t.stations[stationId].hold_min || 0) > 0,
      }))
  }

  const getTrainsInBlock = (blockId) => {
    return trains
      .filter((t) => {
        const b = t.blocks?.[blockId]
        return b && (b.delay > 0 || conflicts.some((c) => c.block_id === blockId && c.trains?.includes(t.train_id)))
      })
      .map((t) => ({
        train: t,
        delay: t.blocks[blockId].delay || 0,
      }))
  }

  const stationById = Object.fromEntries(topology.stations.map((s) => [s.id, s]))

  return (
    <Card sx={{ overflow: 'hidden' }}>
      {/* Telemetry Bar */}
      <Box
        sx={{
          px: 2.5,
          py: 1.5,
          bgcolor: (theme) =>
            theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.4)' : '#f8fafc',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          alignItems={{ xs: 'stretch', md: 'center' }}
          justifyContent="space-between"
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <SensorsRoundedIcon color="primary" sx={{ fontSize: 20 }} />
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: '0.88rem', letterSpacing: '0.02em' }}>
                CORRIDOR TOPOLOGICAL TRACK & SIGNAL INTERLOCKING
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                Automated Train Protection (ATP) · Automatic Block Signaling · Fail-Safe Interlocking
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            {conflicts.length > 0 ? (
              <Chip
                icon={<WarningAmberRoundedIcon sx={{ fontSize: '14px !important' }} />}
                size="small"
                color="error"
                variant="filled"
                label={`${conflicts.length} INTERLOCKING CONFLICT(S)`}
                sx={{ fontWeight: 800, fontSize: '0.68rem', fontFamily: 'monospace' }}
              />
            ) : (
              <Chip
                icon={<CheckCircleOutlineRoundedIcon sx={{ fontSize: '14px !important' }} />}
                size="small"
                color="success"
                variant="outlined"
                label="SIGNALS & HEADWAYS COMPLIANT"
                sx={{ fontWeight: 800, fontSize: '0.68rem', fontFamily: 'monospace' }}
              />
            )}
          </Stack>
        </Stack>
      </Box>

      {/* Horizontal Interlocking Schematic */}
      <Box
        sx={{
          p: 2.5,
          overflowX: 'auto',
          bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#070b14' : '#fafafa'),
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 'max-content', py: 1 }}>
          {topology.blocks.map((block, index) => {
            const upstream = stationById[block.from]
            const downstream = stationById[block.to]
            const blockConflicts = conflicts.filter((c) => c.block_id === block.id)
            const trainsInThisBlock = getTrainsInBlock(block.id)

            // Dynamic optical signal aspect for entry into block
            const signalAspect = blockConflicts.length > 0
              ? 'red'
              : trainsInThisBlock.length > 0
              ? 'amber'
              : 'green'

            const signalLabel = `S${index + 1}`

            return (
              <Stack key={block.id} direction="row" alignItems="center" spacing={1}>
                {/* Render station on first block */}
                {index === 0 && (
                  <StationBay
                    station={upstream}
                    trainsAtStation={getTrainsAtStation(upstream.id)}
                  />
                )}

                {/* Track block with signal head */}
                <TrackBlockSegment
                  block={block}
                  signalAspect={signalAspect}
                  signalLabel={signalLabel}
                  trainsInBlock={trainsInThisBlock}
                  conflicts={blockConflicts}
                />

                {/* Downstream Station */}
                <StationBay
                  station={downstream}
                  trainsAtStation={getTrainsAtStation(downstream.id)}
                />
              </Stack>
            )
          })}
        </Stack>
      </Box>

      {/* Enterprise Status Legend */}
      <Divider />
      <Stack
        direction="row"
        spacing={3}
        alignItems="center"
        sx={{ px: 2.5, py: 1, bgcolor: 'background.paper' }}
        flexWrap="wrap"
        useFlexGap
      >
        <Stack direction="row" spacing={0.75} alignItems="center">
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#10b981', boxShadow: '0 0 6px #10b981' }} />
          <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 600, color: 'text.secondary' }}>
            Signal Green (Clear Route)
          </Typography>
        </Stack>
        <Stack direction="row" spacing={0.75} alignItems="center">
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#f59e0b', boxShadow: '0 0 6px #f59e0b' }} />
          <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 600, color: 'text.secondary' }}>
            Signal Amber (Caution / Active Occupancy)
          </Typography>
        </Stack>
        <Stack direction="row" spacing={0.75} alignItems="center">
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#ef4444', boxShadow: '0 0 6px #ef4444' }} />
          <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 600, color: 'text.secondary' }}>
            Signal Red (Stop / Safety Conflict)
          </Typography>
        </Stack>
      </Stack>
    </Card>
  )
}
