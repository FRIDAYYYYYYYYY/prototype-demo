import Icon from './Icon.jsx'
import { Badge, Card, PanelTitle } from './ui.jsx'
import { usePolledEndpoint } from '../hooks.js'
import { useCountUpNumber, useStaggerEntrance } from '../motion/hooks.js'
import api from '../api.js'

const FALLBACK_FORECASTS = [
  {
    train_id: 'T101',
    name: 'Rajdhani Express',
    type: 'Express',
    distance_to_junction_km: 14.0,
    raw_timetable_speed_kmh: 140.0,
    assumed_speed_kmh: 110.0,
    baseline_eta_s: 458.2,
    ml_eta_s: 458.8,
    variance_vs_baseline_s: 0.6,
    method: 'ml-synthetic',
  },
  {
    train_id: 'T204',
    name: 'Intercity Passenger',
    type: 'Passenger',
    distance_to_junction_km: 14.0,
    raw_timetable_speed_kmh: 80.0,
    assumed_speed_kmh: 80.0,
    baseline_eta_s: 630.0,
    ml_eta_s: 631.5,
    variance_vs_baseline_s: 1.5,
    method: 'ml-synthetic',
  },
  {
    train_id: 'T305',
    name: 'Freight Carrier',
    type: 'Freight',
    distance_to_junction_km: 14.0,
    raw_timetable_speed_kmh: 45.0,
    assumed_speed_kmh: 45.0,
    baseline_eta_s: 1120.0,
    ml_eta_s: 1123.8,
    variance_vs_baseline_s: 3.8,
    method: 'ml-synthetic',
  },
  {
    train_id: 'T408',
    name: 'Superfast Express',
    type: 'Express',
    distance_to_junction_km: 14.0,
    raw_timetable_speed_kmh: 140.0,
    assumed_speed_kmh: 110.0,
    baseline_eta_s: 458.2,
    ml_eta_s: 458.8,
    variance_vs_baseline_s: 0.6,
    method: 'ml-synthetic',
  },
]

export function EtaCard({ item }) {
  const method = item.method || 'physics'
  const isMl = method !== 'physics'

  const animatedBaseline = useCountUpNumber(item.baseline_eta_s, { decimals: 1 })
  const animatedMl = useCountUpNumber(item.ml_eta_s, { decimals: 1 })
  const animatedVariance = useCountUpNumber(item.variance_vs_baseline_s, { decimals: 1 })

  // Method badge config according to showcase contract
  const methodBadge = {
    'ml-synthetic': { label: 'ML · simulated data', tone: 'violet' },
    'ml-real': { label: 'ML · live data', tone: 'teal' },
    physics: { label: 'Physics only', tone: 'muted' },
  }[method] || { label: method, tone: 'muted' }

  const trainTone = {
    Express: 'teal',
    Passenger: 'indigo',
    Freight: 'warn',
  }[item.type] || 'teal'

  const formatMinSec = (secStr) => {
    const s = parseFloat(secStr)
    if (isNaN(s)) return '—'
    const min = Math.floor(s / 60)
    const rem = (s % 60).toFixed(1)
    return min > 0 ? `${min}m ${rem}s` : `${rem}s`
  }

  return (
    <div className={`etacard tone-${trainTone} motion-item`}>
      <div className="etacard__head">
        <div className="etacard__train">
          <span className="etacard__id mono">{item.train_id}</span>
          <div className="etacard__info">
            <strong className="etacard__name">{item.name}</strong>
            <small className="etacard__meta">
              {item.type} · {item.distance_to_junction_km} km approach @ {item.assumed_speed_kmh} km/h
            </small>
          </div>
        </div>
        <Badge tone={methodBadge.tone} dot={isMl}>
          {methodBadge.label}
        </Badge>
      </div>

      <div className={`etacard__metrics ${isMl ? 'is-ml' : 'is-physics'}`}>
        <div className="etacard__col">
          <span className="etacard__col-label">Physics ETA</span>
          <strong className="etacard__col-val mono">{formatMinSec(animatedBaseline)}</strong>
          <small className="etacard__col-sub">({animatedBaseline}s kinematic)</small>
        </div>

        {isMl && (
          <>
            <div className="etacard__divider" />
            <div className="etacard__col">
              <span className="etacard__col-label">ML ETA</span>
              <strong className="etacard__col-val etacard__col-val--ml mono">
                {formatMinSec(animatedMl)}
              </strong>
              <small className="etacard__col-sub">({animatedMl}s gradient boost)</small>
            </div>

            <div className="etacard__divider" />
            <div className="etacard__col etacard__col--delta">
              <span className="etacard__col-label">Variance</span>
              <span className={`etacard__delta mono ${Number(animatedVariance) > 0 ? 'is-delay' : ''}`}>
                {Number(animatedVariance) >= 0 ? `+${animatedVariance}` : animatedVariance}s
              </span>
              <small className="etacard__col-sub">non-linear brake</small>
            </div>
          </>
        )}
      </div>

      <div className="etacard__foot">
        <Icon name="shield" size={12} />
        <span>Advisory only. Scheduling decisions are made by CP-SAT.</span>
      </div>
    </div>
  )
}

export default function EtaForecast() {
  const { data: etaData } = usePolledEndpoint(api.etaForecast, 3000)
  const containerRef = useStaggerEntrance({ selector: '.motion-item', delay: 60 })

  const forecasts = etaData?.forecasts || FALLBACK_FORECASTS
  const method = etaData?.method || 'ml-synthetic'
  const isLive = Boolean(etaData)

  return (
    <Card className="etaforecast motion-item" ref={containerRef}>
      <PanelTitle
        icon="pulse"
        title="ML ETA Forecast"
        meta={isLive ? `Live telemetry · ${method === 'ml-synthetic' ? 'ML · simulated data' : method}` : 'Recorded prototype model'}
        tone="violet"
      />
      <p className="card__note">
        Comparison of direct kinematic baseline against the corridor arrival regressor.
        Estimates terminal junction approach transit time with non-linear braking compensation.
      </p>

      <div className="etaforecast__grid">
        {forecasts.map((item) => (
          <EtaCard key={item.train_id} item={item} />
        ))}
      </div>

      <div className="etaforecast__footer">
        <Icon name="info" size={14} />
        <span>
          <strong>Advisory only:</strong> Scheduling decisions are made by CP-SAT.
          The ML model provides arrival time estimation for human decision support without altering safety constraints.
        </span>
      </div>
    </Card>
  )
}
