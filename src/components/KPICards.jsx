import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import LinearProgress from '@mui/material/LinearProgress'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { alpha } from '@mui/material/styles'
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded'
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded'
import TrainRoundedIcon from '@mui/icons-material/TrainRounded'

function MetricCard({ icon, title, headline, unit, tone = 'primary', secondary, footnote, progress }) {
  return (
    <Card
      sx={{
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        borderLeft: (theme) => `3px solid ${theme.palette[tone]?.main || theme.palette.primary.main}`,
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
          <Typography
            variant="overline"
            color="text.secondary"
            sx={{ fontWeight: 700, letterSpacing: '0.06em', fontSize: '0.68rem' }}
          >
            {title}
          </Typography>
          <Box
            sx={{
              display: 'grid',
              placeItems: 'center',
              width: 28,
              height: 28,
              borderRadius: 1.5,
              backgroundColor: (theme) => alpha(theme.palette[tone]?.main || theme.palette.primary.main, 0.1),
              color: `${tone}.main`,
            }}
          >
            {icon}
          </Box>
        </Stack>

        <Stack direction="row" alignItems="baseline" spacing={0.75}>
          <Typography variant="h4" sx={{ fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
            {headline}
          </Typography>
          {unit ? (
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
              {unit}
            </Typography>
          ) : null}
        </Stack>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, fontSize: '0.8rem', lineHeight: 1.3 }}>
          {secondary}
        </Typography>

        {progress !== undefined ? (
          <LinearProgress
            variant="determinate"
            value={Math.max(0, Math.min(100, progress))}
            color={tone}
            sx={{ mt: 1.25, height: 4, borderRadius: 2 }}
          />
        ) : null}

        {footnote ? (
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              mt: progress !== undefined ? 0.75 : 1,
              color: 'text.disabled',
              fontSize: '0.7rem',
              fontWeight: 500,
            }}
          >
            {footnote}
          </Typography>
        ) : null}
      </CardContent>
    </Card>
  )
}

export default function KPICards({ kpis }) {
  if (!kpis) return null

  const isConflictFree = kpis.conflicts === 0
  const isOptimized = kpis.optimized_total_delay_min !== null && kpis.optimized_total_delay_min !== undefined
  const savedDelay = isOptimized
    ? Math.max(0, (kpis.cascade_total_delay_min ?? 0) - kpis.optimized_total_delay_min)
    : 0

  return (
    <Box
      sx={{
        display: 'grid',
        gap: 2,
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, minmax(0, 1fr))',
          lg: 'repeat(4, minmax(0, 1fr))',
        },
      }}
    >
      {/* 1. Total System Delay */}
      <MetricCard
        icon={<AccessTimeRoundedIcon sx={{ fontSize: 18 }} />}
        title="Total Corridor Delay"
        headline={kpis.total_delay_min}
        unit="min"
        tone={kpis.total_delay_min === 0 ? 'success' : kpis.total_delay_min < 20 ? 'warning' : 'error'}
        secondary={
          kpis.total_delay_min === 0
            ? 'All trains on scheduled timetable'
            : `Worst train +${kpis.max_delay_min}m · ${kpis.delayed_trains} of ${kpis.trains_scheduled} delayed`
        }
        progress={Math.min(100, (kpis.total_delay_min / 60) * 100)}
        footnote={isOptimized ? 'AI Optimized Schedule' : 'Current active timetable'}
      />

      {/* 2. Safety Conflicts */}
      <MetricCard
        icon={
          isConflictFree ? (
            <CheckCircleRoundedIcon sx={{ fontSize: 18 }} />
          ) : (
            <ErrorOutlineRoundedIcon sx={{ fontSize: 18 }} />
          )
        }
        title="Safety Conflicts"
        headline={kpis.conflicts}
        unit={kpis.conflicts === 1 ? 'conflict' : 'conflicts'}
        tone={isConflictFree ? 'success' : 'error'}
        secondary={
          isConflictFree
            ? 'No headway violations or platform overlaps'
            : `${kpis.conflicts} collision/headway conflict(s) detected!`
        }
        progress={isConflictFree ? 100 : Math.min(100, kpis.conflicts * 50)}
        footnote={isConflictFree ? 'Rule checks passing: 5 of 5' : 'Action required: Re-plan to resolve'}
      />

      {/* 3. On-Time Performance */}
      <MetricCard
        icon={<TrainRoundedIcon sx={{ fontSize: 18 }} />}
        title="On-Time Services"
        headline={`${kpis.on_time_trains}/${kpis.trains_scheduled}`}
        unit="trains"
        tone={kpis.on_time_trains === kpis.trains_scheduled ? 'success' : 'primary'}
        secondary={
          kpis.delayed_trains === 0
            ? '100% on-time performance across corridor'
            : `${kpis.delayed_trains} delayed service${kpis.delayed_trains > 1 ? 's' : ''} in network`
        }
        progress={(kpis.on_time_trains / Math.max(1, kpis.trains_scheduled)) * 100}
        footnote={`${kpis.trains_scheduled} total passenger & freight services`}
      />

      {/* 4. AI Optimization Benefit */}
      <MetricCard
        icon={<AutoAwesomeRoundedIcon sx={{ fontSize: 18 }} />}
        title="AI Re-Planning Impact"
        headline={isOptimized ? `-${savedDelay}m` : 'Ready'}
        unit={isOptimized ? 'saved' : ''}
        tone={isOptimized ? 'info' : 'primary'}
        secondary={
          isOptimized
            ? `Delay reduced from ${kpis.cascade_total_delay_min}m → ${kpis.optimized_total_delay_min}m`
            : `Unmanaged cascade delay: ${kpis.cascade_total_delay_min ?? kpis.total_delay_min}m`
        }
        progress={isOptimized ? 100 : 0}
        footnote={isOptimized ? 'CP-SAT optimal re-route active' : 'Run AI Optimizer to mitigate delays'}
      />
    </Box>
  )
}
