import { HARDWARE } from '../data/analytics.js'
import Icon from './Icon.jsx'
import { Badge, Card, Meter, PanelTitle, Stat, StatusDot } from './ui.jsx'

const METHOD_TONE = { POST: 'teal', GET: 'indigo' }

export default function Hardware() {
  return (
    <div className="hardware">
      <Card className="hardware__device">
        <PanelTitle icon="board" title="ESP32 device" meta={HARDWARE.firmware} tone="teal" />
        <div className="device">
          <div className="device__head">
            <span className="device__icon">
              <Icon name="board" size={26} />
            </span>
            <div>
              <strong>{HARDWARE.device}</strong>
              <small className="mono">
                {HARDWARE.ip} · RSSI {HARDWARE.rssi} dBm
              </small>
            </div>
            <StatusDot tone="success" label="Online" />
          </div>
          <div className="device__stats">
            <Stat label="Last heartbeat" value="0.4 s" tone="emerald" />
            <Stat label="Round trip" value={`${HARDWARE.latency} ms`} tone="cyan" />
            <Stat label="Poll loop" value="100 ms" tone="indigo" />
          </div>
          <Meter value={HARDWARE.rssi} max={-30} tone="teal" label="Signal quality" right={`${HARDWARE.rssi} dBm`} />
        </div>
      </Card>

      <Card className="hardware__contract">
        <PanelTitle icon="bolt" title="API contract" meta="locked" tone="indigo" />
        <ul className="endpoints">
          {HARDWARE.contract.map((e) => (
            <li key={`${e.method}${e.path}`} className="endpoint">
              <Badge tone={METHOD_TONE[e.method]}>{e.method}</Badge>
              <code className="endpoint__path">{e.path}</code>
              <span className="endpoint__purpose">{e.purpose}</span>
              <span className="endpoint__auth mono">{e.auth}</span>
            </li>
          ))}
        </ul>
        <div className="schema">
          <span className="schema__title">
            <Icon name="info" size={14} />
            {HARDWARE.schema.title}
          </span>
          <div className="schema__rows">
            {HARDWARE.schema.fields.map(([f, t, ex]) => (
              <div key={f} className="schema__row">
                <code className="schema__field">{f}</code>
                <span className="schema__type mono">{t}</span>
                <span className="schema__example mono">{ex}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card className="hardware__pins">
        <PanelTitle icon="pin" title="GPIO mapping" meta="4 inputs" tone="violet" />
        <div className="pintable">
          <div className="pintable__head">
            <span>Pin</span>
            <span>Block</span>
            <span>Mode</span>
            <span>Pull</span>
            <span>Drives</span>
          </div>
          {HARDWARE.pins.map((p) => (
            <div key={p.pin} className="pintable__row">
              <code>{p.pin}</code>
              <b>{p.block}</b>
              <span className="mono">{p.dir}</span>
              <span className="mono">{p.pull}</span>
              <code className="pintable__sig">{p.signal}</code>
            </div>
          ))}
        </div>
        <p className="pintable__note">
          <Icon name="warn" size={14} />
          Firmware debounces every input, POSTs the event, then polls <code>/block-state</code> to drive the
          LEDs — the advisory state is the single source of truth for the physical signals.
        </p>
      </Card>
    </div>
  )
}
