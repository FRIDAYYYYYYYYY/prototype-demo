import { useCallback, useEffect, useRef, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import LinearProgress from '@mui/material/LinearProgress'
import Snackbar from '@mui/material/Snackbar'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import { alpha, useTheme } from '@mui/material/styles'
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded'
import PauseRoundedIcon from '@mui/icons-material/PauseRounded'
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded'
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from 'recharts'
import Header from './components/Header'
import JunctionPanel from './components/JunctionPanel'
import KPICards from './components/KPICards'
import RailwayView from './components/RailwayView'
import {
  describeApiError,
  getResults,
  getScenarios,
  getState,
  injectDisruption,
  resetSimulation,
  runOptimizer,
} from './api'

const STAGE_INTERVAL_SEC = 9

const DEMO_STAGES = [
  {
    index: 0,
    key: 'nominal',
    label: '1. Nominal Operations',
    shortLabel: 'Nominal',
    headline: 'Corridor operating under booked timetable with zero delay',
    narrative:
      'All 4 passenger and freight services are running on schedule. Track block signaling is clear (Green), headway buffers are compliant, and station platform capacities are respected.',
    tone: 'success',
  },
  {
    index: 1,
    key: 'incident',
    label: '2. Incident & Delay',
    shortLabel: 'Incident',
    headline: 'Signal failure in Block 2: T204 held 15 min, cascading delays occur',
    narrative:
      'CRITICAL EVENT: An unexpected signal delay in Block 2 halts Intercity Express T204. Legacy single-hop dispatch causes cascading delays to Freight T305 and triggers a dangerous headway safety violation for Superfast Express T408.',
    tone: 'error',
  },
  {
    index: 2,
    key: 'resolved',
    label: '3. Autonomous AI Resolution',
    shortLabel: 'AI Resolved',
    headline: 'CP-SAT optimizer computes optimal holding and restores safety',
    narrative:
      'AI DISPATCH ACTION: CP-SAT mathematical optimizer evaluates corridor constraints, re-sequences train departure orders, and resolves the headway conflict while recovering 33 minutes of cascading delay.',
    tone: 'primary',
  },
]

export default function App() {
  const theme = useTheme()

  const [snapshot, setSnapshot] = useState(null)
  const [results, setResults] = useState(null)
  const [scenarios, setScenarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)

  // Auto-Demo State Machine
  const [currentStage, setCurrentStage] = useState(0)
  const [autoPlay, setAutoPlay] = useState(true)
  const [countdown, setCountdown] = useState(STAGE_INTERVAL_SEC)

  const executingRef = useRef(false)

  const load = useCallback(async (initial = false) => {
    if (initial) setLoading(true)
    try {
      const [statePayload, resultsPayload, scenarioPayload] = await Promise.all([
        getState(),
        getResults(),
        getScenarios(),
      ])
      setSnapshot(statePayload)
      setResults(resultsPayload)
      setScenarios(scenarioPayload.scenarios ?? [])
      setError(null)
    } catch (err) {
      setError(describeApiError(err))
    } finally {
      if (initial) setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(true)
  }, [load])

  /** Execute a specific demo stage */
  const goToStage = useCallback(
    async (stageIdx, pause = false) => {
      if (pause) setAutoPlay(false)
      if (executingRef.current) return
      executingRef.current = true
      setCurrentStage(stageIdx)
      setCountdown(STAGE_INTERVAL_SEC)
      setBusy(`stage-${stageIdx}`)

      try {
        if (stageIdx === 0) {
          // Reset to Nominal
          const payload = await resetSimulation({ clear_disruptions: true })
          if (payload.state) setSnapshot(payload.state)
          if (payload.results) setResults(payload.results)
        } else if (stageIdx === 1) {
          // Reset first then inject disruption
          await resetSimulation({ clear_disruptions: true })
          const request = scenarios[0]?.request ?? {
            type: 'signal_delay',
            train_id: 'T204',
            block_id: 'BL2',
            minutes: 15,
          }
          const payload = await injectDisruption(request)
          if (payload.state) setSnapshot(payload.state)
          if (payload.results) setResults(payload.results)
        } else if (stageIdx === 2) {
          // Run Optimizer
          const payload = await runOptimizer({ time_limit_s: 4.0 })
          if (payload.state) setSnapshot(payload.state)
          if (payload.results) setResults(payload.results)
        }
      } catch (err) {
        setError(describeApiError(err))
      } finally {
        setBusy(null)
        executingRef.current = false
      }
    },
    [scenarios],
  )

  // Auto-play timer loop
  useEffect(() => {
    if (!autoPlay || loading || !snapshot) return undefined

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          const nextStage = (currentStage + 1) % DEMO_STAGES.length
          goToStage(nextStage, false)
          return STAGE_INTERVAL_SEC
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [autoPlay, currentStage, loading, snapshot, goToStage])

  const refresh = async () => {
    setBusy('refresh')
    await load(false)
    setBusy(null)
  }

  const activeName = results?.active_schedule ?? snapshot?.simulation?.active_schedule ?? null
  const activeSchedule = activeName ? snapshot?.schedules?.[activeName] ?? null : null
  const checks = results?.validation?.checks ?? []
  const rows = results?.comparison?.rows ?? []
  const totals = results?.comparison?.totals ?? {}
  const disruptions = snapshot?.simulation?.disruptions ?? []
  const isOptimized = Boolean(results?.optimized)

  const stageMeta = DEMO_STAGES[currentStage]

  // Chart comparison data
  const chartData = rows.map((row) => ({
    name: row.train_id,
    cascade: row.cascade_delay || 0,
    optimized: row.optimized_delay !== null && row.optimized_delay !== undefined ? row.optimized_delay : 0,
  }))

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header
        isOptimized={isOptimized}
        activeDisruptions={disruptions.length}
        autoPlaying={autoPlay}
        onRefresh={refresh}
        refreshing={busy === 'refresh'}
      />

      <Box
        component="main"
        sx={{
          flex: 1,
          display: 'grid',
          gap: 2.5,
          px: { xs: 2, md: 3 },
          py: 3,
          maxWidth: 1600,
          mx: 'auto',
          width: '100%',
        }}
      >
        {error ? (
          <Alert
            severity="error"
            variant="outlined"
            action={
              <Button color="inherit" size="small" onClick={refresh} disabled={Boolean(busy)}>
                Retry
              </Button>
            }
          >
            {error}
          </Alert>
        ) : null}

        {loading && !snapshot ? (
          <Card>
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <CircularProgress size={32} sx={{ mb: 2 }} />
              <Typography variant="subtitle2">Connecting to TMS Simulation Engine…</Typography>
            </Box>
          </Card>
        ) : null}

        {!loading && !snapshot ? (
          <Card>
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" sx={{ mb: 1 }}>TMS Backend Offline</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Please start the backend with <code>python backend/main.py</code>
              </Typography>
              <Button variant="outlined" onClick={refresh} disabled={Boolean(busy)}>
                Reconnect
              </Button>
            </Box>
          </Card>
        ) : null}

        {snapshot && results ? (
          <>
            {/* Auto-Demo Presentation Command Deck */}
            <Card
              sx={{
                borderLeft: (theme) =>
                  `4px solid ${
                    stageMeta.tone === 'error'
                      ? theme.palette.error.main
                      : stageMeta.tone === 'primary'
                      ? theme.palette.primary.main
                      : theme.palette.success.main
                  }`,
                backgroundColor: (theme) =>
                  theme.palette.mode === 'dark' ? '#0f172a' : '#ffffff',
              }}
            >
              <Box sx={{ p: 2, px: { xs: 2, md: 2.5 } }}>
                <Stack
                  direction={{ xs: 'column', md: 'row' }}
                  spacing={2}
                  alignItems={{ xs: 'stretch', md: 'center' }}
                  justifyContent="space-between"
                  sx={{ mb: 1.5 }}
                >
                  {/* Left: Stage Stepper Pills */}
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 800,
                        letterSpacing: '0.08em',
                        color: 'text.secondary',
                        fontFamily: 'monospace',
                        mr: 1,
                      }}
                    >
                      DEMO WALKTHROUGH:
                    </Typography>

                    {DEMO_STAGES.map((stage) => {
                      const isActive = stage.index === currentStage
                      return (
                        <Button
                          key={stage.key}
                          size="small"
                          variant={isActive ? 'contained' : 'outlined'}
                          color={isActive ? stage.tone : 'inherit'}
                          onClick={() => goToStage(stage.index, true)}
                          disabled={Boolean(busy)}
                          sx={{
                            borderRadius: 1.5,
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            py: 0.5,
                            px: 1.5,
                            letterSpacing: '0.02em',
                          }}
                        >
                          {stage.label}
                        </Button>
                      )
                    })}
                  </Stack>

                  {/* Right: Auto-Play Toggle & Countdown */}
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Chip
                      size="small"
                      variant="outlined"
                      label={
                        autoPlay
                          ? `Next step in ${countdown}s`
                          : 'Auto-demo paused'
                      }
                      sx={{
                        fontWeight: 700,
                        fontFamily: 'monospace',
                        fontSize: '0.7rem',
                      }}
                    />

                    <Button
                      size="small"
                      variant="outlined"
                      color={autoPlay ? 'inherit' : 'primary'}
                      startIcon={autoPlay ? <PauseRoundedIcon /> : <PlayArrowRoundedIcon />}
                      onClick={() => setAutoPlay((prev) => !prev)}
                      sx={{ borderRadius: 1.5, fontWeight: 700 }}
                    >
                      {autoPlay ? 'Pause Auto-Play' : 'Resume Auto-Play'}
                    </Button>
                  </Stack>
                </Stack>

                {/* Automated Countdown Progress Bar */}
                {autoPlay ? (
                  <LinearProgress
                    variant="determinate"
                    value={((STAGE_INTERVAL_SEC - countdown) / STAGE_INTERVAL_SEC) * 100}
                    color={stageMeta.tone}
                    sx={{ height: 3, borderRadius: 2, mb: 1.5 }}
                  />
                ) : null}

                {/* Executive Briefing Callout */}
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 1.5,
                    backgroundColor: (theme) =>
                      stageMeta.tone === 'error'
                        ? alpha(theme.palette.error.main, 0.08)
                        : stageMeta.tone === 'primary'
                        ? alpha(theme.palette.primary.main, 0.08)
                        : alpha(theme.palette.success.main, 0.08),
                    border: 1,
                    borderColor: (theme) =>
                      stageMeta.tone === 'error'
                        ? alpha(theme.palette.error.main, 0.25)
                        : stageMeta.tone === 'primary'
                        ? alpha(theme.palette.primary.main, 0.25)
                        : alpha(theme.palette.success.main, 0.25),
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                    {stageMeta.tone === 'error' ? (
                      <WarningAmberRoundedIcon color="error" sx={{ fontSize: 18 }} />
                    ) : stageMeta.tone === 'primary' ? (
                      <AutoAwesomeRoundedIcon color="primary" sx={{ fontSize: 18 }} />
                    ) : (
                      <CheckCircleRoundedIcon color="success" sx={{ fontSize: 18 }} />
                    )}
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: '0.88rem' }}>
                      {stageMeta.headline}
                    </Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.82rem', lineHeight: 1.4 }}>
                    {stageMeta.narrative}
                  </Typography>
                </Box>
              </Box>
            </Card>

            {/* Enterprise Telemetry Metric Cards */}
            <KPICards kpis={results.kpis} />

            {/* Live physical junction loop (ESP32 advisory aspects) */}
            <JunctionPanel />

            {/* Topological Track & Signal Interlocking Map */}
            <RailwayView
              topology={snapshot.topology}
              schedule={activeSchedule}
              validation={results.validation}
            />

            {/* Dual Enterprise Dispatch Deck */}
            <Box
              sx={{
                display: 'grid',
                gap: 2.5,
                gridTemplateColumns: { xs: '1fr', lg: '1fr 1.35fr' },
              }}
            >
              {/* Left Column: Automated Safety Validator Matrix */}
              <Card>
                <Box sx={{ p: 2.5 }}>
                  <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <ShieldOutlinedIcon color="primary" sx={{ fontSize: 20 }} />
                      <Typography variant="h6" sx={{ fontSize: '0.98rem', fontWeight: 800 }}>
                        Automated Safety Rule Verification
                      </Typography>
                    </Stack>
                    <Chip
                      size="small"
                      color={results.validation?.valid ? 'success' : 'error'}
                      variant={results.validation?.valid ? 'outlined' : 'filled'}
                      label={results.validation?.valid ? 'ALL 5 PASSING' : `${results.kpis?.conflicts} CONFLICTS`}
                      sx={{ fontWeight: 800, fontSize: '0.68rem', fontFamily: 'monospace' }}
                    />
                  </Stack>

                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                    Real-time European Rail Traffic Management System (ERTMS) interlocking constraints:
                  </Typography>

                  <Stack spacing={1}>
                    {checks.map((check) => (
                      <Stack
                        key={check.id}
                        direction="row"
                        spacing={1.25}
                        alignItems="center"
                        sx={{
                          p: 1.25,
                          borderRadius: 1.25,
                          border: 1,
                          borderColor: 'divider',
                          backgroundColor: (theme) =>
                            check.status === 'pass'
                              ? alpha(theme.palette.success.main, 0.04)
                              : alpha(theme.palette.error.main, 0.08),
                        }}
                      >
                        {check.status === 'pass' ? (
                          <CheckCircleRoundedIcon color="success" sx={{ fontSize: 18 }} />
                        ) : (
                          <ErrorOutlineRoundedIcon color="error" sx={{ fontSize: 18 }} />
                        )}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="subtitle2" sx={{ fontSize: '0.8rem', fontWeight: 700 }}>
                            {check.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                            {check.description}
                          </Typography>
                        </Box>
                        <Chip
                          size="small"
                          color={check.status === 'pass' ? 'success' : 'error'}
                          variant={check.status === 'pass' ? 'outlined' : 'filled'}
                          label={check.status === 'pass' ? 'PASS' : 'FAIL'}
                          sx={{ height: 18, fontSize: '0.62rem', fontWeight: 800, fontFamily: 'monospace' }}
                        />
                      </Stack>
                    ))}
                  </Stack>
                </Box>
              </Card>

              {/* Right Column: Comparative Timetable & Schedule Recovery */}
              <Card>
                <Box sx={{ p: 2.5 }}>
                  <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                    <Box>
                      <Typography variant="h6" sx={{ fontSize: '0.98rem', fontWeight: 800 }}>
                        Live Corridor Dispatch Timetable
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Comparative analysis of arrival times and AI mitigation
                      </Typography>
                    </Box>

                    <Stack direction="row" spacing={1}>
                      <Chip
                        size="small"
                        color="warning"
                        variant="outlined"
                        label={`Cascade: ${totals.cascade_total_delay_min ?? 0}m`}
                        sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                      />
                      <Chip
                        size="small"
                        color={isOptimized ? 'success' : 'default'}
                        variant={isOptimized ? 'filled' : 'outlined'}
                        label={`AI Schedule: ${isOptimized ? `${totals.optimized_total_delay_min}m` : 'Pending'}`}
                        sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                      />
                    </Stack>
                  </Stack>

                  {/* Delay Chart */}
                  <Box sx={{ width: '100%', height: 180, mb: 2 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                        <XAxis dataKey="name" tick={{ fill: theme.palette.text.secondary, fontSize: 11 }} />
                        <YAxis allowDecimals={false} tick={{ fill: theme.palette.text.secondary, fontSize: 11 }} unit="m" />
                        <ChartTooltip
                          cursor={{ fill: theme.palette.action.hover }}
                          formatter={(value, name) => [
                            `${value} min`,
                            name === 'cascade' ? 'Cascading Delay (No AI)' : 'AI Optimized Schedule',
                          ]}
                        />
                        <Legend
                          formatter={(val) => (val === 'cascade' ? 'Cascading Delay (No AI)' : 'AI Optimized Schedule')}
                          wrapperStyle={{ fontSize: '0.72rem' }}
                        />
                        <Bar dataKey="cascade" fill={theme.palette.warning.main} radius={[4, 4, 0, 0]} />
                        <Bar dataKey="optimized" fill={theme.palette.primary.main} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>

                  <Divider sx={{ my: 1.5 }} />

                  {/* Clean Enterprise Timetable */}
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Service</TableCell>
                          <TableCell>Booked Arrival</TableCell>
                          <TableCell>Actual Arrival</TableCell>
                          <TableCell>AI Re-Plan</TableCell>
                          <TableCell align="right">Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {rows.map((row) => {
                          const hasDelay = row.cascade_delay > 0
                          const optDelay = row.optimized_delay

                          return (
                            <TableRow key={row.train_id} hover>
                              <TableCell>
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <Box
                                    sx={{
                                      width: 8,
                                      height: 8,
                                      borderRadius: '50%',
                                      backgroundColor: row.colour || 'primary.main',
                                    }}
                                  />
                                  <Box>
                                    <Typography variant="caption" sx={{ fontWeight: 800, fontFamily: 'monospace', display: 'block' }}>
                                      {row.train_id}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                      {row.name}
                                    </Typography>
                                  </Box>
                                </Stack>
                              </TableCell>
                              <TableCell sx={{ fontSize: '0.8rem', fontVariantNumeric: 'tabular-nums' }}>
                                {row.booked_arrival_label}
                              </TableCell>
                              <TableCell sx={{ fontSize: '0.8rem', fontVariantNumeric: 'tabular-nums' }}>
                                {row.cascade_arrival_label}{' '}
                                {row.cascade_delay > 0 ? (
                                  <Typography component="span" variant="caption" color="warning.main" sx={{ fontWeight: 700 }}>
                                    (+{row.cascade_delay}m)
                                  </Typography>
                                ) : null}
                              </TableCell>
                              <TableCell sx={{ fontSize: '0.8rem', fontVariantNumeric: 'tabular-nums' }}>
                                {isOptimized && optDelay !== null && optDelay !== undefined ? (
                                  <>
                                    {row.optimized_arrival_label}{' '}
                                    <Typography
                                      component="span"
                                      variant="caption"
                                      color={optDelay === 0 ? 'success.main' : 'primary.main'}
                                      sx={{ fontWeight: 700 }}
                                    >
                                      ({optDelay === 0 ? 'On Time' : `+${optDelay}m`})
                                    </Typography>
                                  </>
                                ) : (
                                  '—'
                                )}
                              </TableCell>
                              <TableCell align="right">
                                {isOptimized ? (
                                  <Chip
                                    size="small"
                                    color={optDelay === 0 ? 'success' : optDelay < row.cascade_delay ? 'primary' : 'warning'}
                                    variant="outlined"
                                    label={optDelay === 0 ? 'ON TIME' : optDelay < row.cascade_delay ? 'MITIGATED' : 'HELD'}
                                    sx={{ height: 18, fontSize: '0.62rem', fontWeight: 800, fontFamily: 'monospace' }}
                                  />
                                ) : hasDelay ? (
                                  <Chip
                                    size="small"
                                    color="warning"
                                    variant="outlined"
                                    label={`+${row.cascade_delay}m DELAY`}
                                    sx={{ height: 18, fontSize: '0.62rem', fontWeight: 800, fontFamily: 'monospace' }}
                                  />
                                ) : (
                                  <Chip
                                    size="small"
                                    color="success"
                                    variant="outlined"
                                    label="ON TIME"
                                    sx={{ height: 18, fontSize: '0.62rem', fontWeight: 800, fontFamily: 'monospace' }}
                                  />
                                )}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              </Card>
            </Box>
          </>
        ) : null}

        {/* Professional Footer */}
        <Typography
          variant="caption"
          color="text.disabled"
          sx={{ textAlign: 'center', display: 'block', pt: 2, pb: 1, fontSize: '0.72rem' }}
        >
          RAILTRAFFIC TMS · Enterprise Railway Decision Support Platform · Demo Simulation
        </Typography>
      </Box>

      {/* Global Toast */}
      <Snackbar
        open={Boolean(notice)}
        autoHideDuration={4000}
        onClose={() => setNotice(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setNotice(null)}
          severity={notice?.severity ?? 'success'}
          variant="filled"
          sx={{ width: '100%', borderRadius: 2 }}
        >
          {notice?.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}
