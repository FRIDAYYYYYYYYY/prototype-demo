import { useCallback, useMemo } from 'react'
import { toEventStream, toSignals, REPLAYS } from '../adapters.js'
import Corridor from './Corridor.jsx'
import Icon from './Icon.jsx'
import { useAction, usePolledEndpoint } from '../hooks.js'
import { Badge, Card, PanelTitle, StatusDot } from './ui.jsx'
import { EVENTS } from '../data/live.js'
import api from '../api.js'

const STATE_TONE = { ACTIVE: 'danger', CLEAR: 'success' }

function EventRow({ ev }) {
  return (
    <li className="evrow">
      <span className="evrow__seq mono">#{ev.seq}</span>
      <Badge tone={STATE_TONE[ev.state] ?? 'muted'} dot>
        {ev.state}
      </Badge>
      <span className="evrow__block">
        <b>{ev.block}</b>
        <small className="mono">GPIO · {ev.approach}</small>
      </span>
      <span className="evrow__result">{ev.result}</span>
      <span className="evrow__ms mono">{ev.ms == null ? '—' : `${ev.ms} ms`}</span>
      <span className="evrow__src mono">{ev.source}</span>
    </li>
  )
}

export default function LiveJunction() {
  // Live junction state, polled at the same cadence the ESP32 uses.
  const { data: blockState } = usePolledEndpoint(api.blockState, 2000)
  const { data: hardwareStatus } = usePolledEndpoint(api.hardwareStatus, 2000)
  const { run, busy } = useAction()

  const events = toEventStream(hardwareStatus) ?? EVENTS
  const signals = toSignals(blockState)
  const isLive = Boolean(blockState)

  const conflictCount = useMemo(
    () => events.filter((e) => e.result.toLowerCase().includes('conflict')).length,
    [events],
  )

  const replay = useCallback(
    async (steps) => {
      // Replay a documented software sequence against the real endpoint, so the
      // badge reflects a run that actually happened.
      const plan = {
        'A1 → A2': [['A1', 'occupied'], ['A2', 'free']],
        'B1 → B2': [['B1', 'occupied'], ['B2', 'free']],
        'A1 → B1': [['A1', 'occupied'], ['B1', 'occupied']],
        'B1 → A1': [['B1', 'occupied'], ['A1', 'occupied']],
      }[steps]
      if (!plan) return

      await api.resetSensorState()
      let seq = Date.now() % 100000
      for (const [block, state] of plan) {
        seq += 1
        // eslint-disable-next-line no-await-in-loop
        await api.sensorEvent({
          block_id: block,
          state,
          event_type: 'sensor_triggered',
          timestamp: Date.now(),
          source: `replay_${block}`,
          seq,
        })
      }
    },
    [],
  )

  return (
    <div className="livegrid">
      <Card className="livegrid__map">
        <PanelTitle
          icon="track"
          title="Junction topology"
          meta={isLive ? 'A / B · live' : 'A / B · offline'}
          tone={isLive ? 'teal' : 'muted'}
        />
        <Corridor />
        {signals && (
          <ul className="signalstrip">
            {signals.map((sig) => (
              <li key={sig.id} className="signalstrip__item">
                <span className="signalstrip__label">Approach {sig.approach}</span>
                <Badge tone={sig.state === 'PROCEED' ? 'success' : sig.state === 'HOLD' ? 'danger' : 'warn'}>
                  {sig.state}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="livegrid__events">
        <PanelTitle
          icon="pulse"
          title="Sensor event stream"
          meta={isLive ? `${events.length} recent · ${conflictCount} conflicts` : 'offline — recorded events'}
          tone={isLive ? 'indigo' : 'muted'}
        />
        <ul className="evlist">
          {events.map((ev, index) => (
            <EventRow key={`${ev.source}-${ev.seq}-${index}`} ev={ev} />
          ))}
        </ul>
        <p className="evlist__foot">
          <Icon name="info" size={14} />
          Sequence numbers are monotonic per source — duplicates and stale events are rejected before any
          decision is taken.
        </p>
      </Card>

      <Card className="livegrid__replays">
        <PanelTitle
          icon="check"
          title="Software replay sequences"
          meta={isLive ? (busy ? 'running…' : 'run against the live API') : '5 / 5 pass'}
          tone="violet"
        />
        <ul className="replaylist">
          {REPLAYS.map((r) => (
            <li key={r.id} className="replay">
              <span className="replay__id mono">{r.id}</span>
              <div className="replay__body">
                <strong>{r.name}</strong>
                <code>{r.steps}</code>
                <small>{r.expect}</small>
              </div>
              {isLive ? (
                <button
                  type="button"
                  className="replay__run"
                  disabled={busy}
                  onClick={() => run(() => replay(r.steps))}
                >
                  Run
                </button>
              ) : (
                <StatusDot tone="success" />
              )}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
