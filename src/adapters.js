// Adapters that map live backend payloads onto the shapes the components render.
//
// Each function is total: it always returns the same shape, falling back to the
// static values in `src/data/*` when the backend is not answering. That keeps
// every component free of `if (!data)` branches and guarantees the dashboard
// still renders (clearly marked as offline) when the API is down mid-demo.

import { EVENTS, REPLAYS } from './data/live.js'
import { CONFLICT } from './data/decision.js'

/** Live signal aspects for the two junction approaches. */
export function toSignals(blockState) {
  if (!blockState?.blocks?.length) return null
  return blockState.blocks.map((block) => ({
    id: `SIG-${block.block_id}`,
    approach: block.block_id,
    block: block.block_id,
    // A stale aspect must never read as a clearance.
    state: blockState.stale ? 'STALE' : block.signal,
    reason: blockState.reason,
  }))
}

/** Occupancy per logical block, derived from the hardware status snapshot. */
export function toOccupancy(hardwareStatus) {
  const occupancy = hardwareStatus?.state?.occupancy
  if (!occupancy) return null
  return occupancy
}

/** The most recent accepted sensor events, newest first. */
export function toEventStream(hardwareStatus, limit = 12) {
  const events = hardwareStatus?.events
  if (!Array.isArray(events) || events.length === 0) return null

  return events
    .slice(-limit)
    .reverse()
    .map((event) => ({
      seq: event.seq,
      block: event.sensor_id,
      approach: event.block_id,
      state: event.state === 'occupied' ? 'ACTIVE' : 'CLEAR',
      source: event.source,
      ms: event.latency_ms ?? null,
      result: describeEventResult(event),
    }))
}

function describeEventResult(event) {
  if (event.status === 'ignored') {
    return event.reason === 'state_redundant'
      ? 'Redundant state ignored'
      : 'Duplicate sequence ignored'
  }
  if (event.reason) return event.reason
  return event.state === 'occupied' ? 'Block occupied' : 'State cleared'
}

/**
 * The legacy-vs-CP-SAT comparison, from whichever source has real numbers.
 *
 * Priority: the live stored comparison (Phase D) → the live junction decision →
 * the static Phase C scenario. Only the first two are measurements; the static
 * one is labelled as a documented scenario by the caller.
 */
export function toComparison({ junctionComparisons, blockState, live = false }) {
  const latest = junctionComparisons?.[0]

  if (latest?.conflict) {
    const agrees = latest.payload?.agrees
    return {
      source: live ? 'measured' : 'recorded',
      runId: latest.run_id,
      legacyWinner: latest.payload?.legacy?.proceed?.[0] ?? null,
      cpsatWinner: latest.winner,
      heldBlock: latest.loser,
      differ: agrees === false,
      solverMs: latest.solver_ms,
      cpsatWeighted: latest.cpsat_weighted,
      legacyWeighted: latest.legacy_weighted,
    }
  }

  const decision = blockState?.decision
  if (decision?.conflict) {
    return {
      source: live ? 'measured' : 'recorded',
      runId: decision.run_id,
      cpsatWinner: null,
      heldBlock: null,
      differ: null,
      solverMs: null,
    }
  }

  return {
    source: 'scenario',
    runId: CONFLICT.id,
    legacyWinner: CONFLICT.legacy.winner,
    cpsatWinner: CONFLICT.cpsat.winner,
    heldBlock: CONFLICT.approachB?.split('—')[1]?.trim() ?? 'B',
    differ: CONFLICT.legacy.winner !== CONFLICT.cpsat.winner,
    solverMs: CONFLICT.cpsat.solveMs,
    legacyWeighted: CONFLICT.legacy.weighted,
    cpsatWeighted: CONFLICT.cpsat.weighted,
  }
}

/** Headline KPIs derived from the live `/results` payload. */
export function toLiveKpis(results) {
  if (!results?.kpis) return null
  const kpis = results.kpis
  return {
    totalDelay: kpis.total_delay_min,
    maxDelay: kpis.max_delay_min,
    conflicts: kpis.conflicts,
    cascadeConflicts: kpis.cascade_conflicts,
    onTime: kpis.on_time_trains,
    delayed: kpis.delayed_trains,
    recovered: kpis.recovered_vs_rule_based_min,
    solverMs: results.solver_info?.wall_time_ms ?? null,
    activeSchedule: results.active_schedule,
    activeScheduleLabel: results.active_schedule_label,
  }
}

/** Per-train delay rows for the comparison table / bar chart. */
export function toComparisonRows(results) {
  const rows = results?.comparison?.rows
  if (!Array.isArray(rows) || rows.length === 0) return null
  return rows
}

/** The delay-trend series, from stored KPI history when persistence is on. */
export function toTrend(kpiSeries) {
  if (!Array.isArray(kpiSeries) || kpiSeries.length < 2) return null
  return kpiSeries.map((row) => ({
    label: row.run_id,
    value: row.total_delay,
    conflicts: row.conflicts,
  }))
}

export { EVENTS, REPLAYS }
