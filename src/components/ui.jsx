import Icon from './Icon.jsx'

/* ---------- Card / panel shell ---------- */

export function Card({ className = '', children, ...rest }) {
  return (
    <article className={`card ${className}`} {...rest}>
      {children}
    </article>
  )
}

export function Section({ id, eyebrow, title, subtitle, icon, aside, children }) {
  return (
    <section id={id} className="section">
      <header className="section__head">
        <div className="section__headtext">
          {eyebrow && (
            <span className="section__eyebrow">
              <Icon name={icon} size={14} />
              {eyebrow}
            </span>
          )}
          <h2 className="section__title">{title}</h2>
          {subtitle && <p className="section__subtitle">{subtitle}</p>}
        </div>
        {aside && <div className="section__aside">{aside}</div>}
      </header>
      {children}
    </section>
  )
}

export function PanelTitle({ icon, title, meta, tone = 'teal' }) {
  return (
    <div className="panel__head">
      <span className={`panel__icon tone-${tone}`}>
        <Icon name={icon} size={17} />
      </span>
      <h3 className="panel__title">{title}</h3>
      {meta && <span className="panel__meta">{meta}</span>}
    </div>
  )
}

/* ---------- Badges & pills ---------- */

export function Badge({ tone = 'muted', children, dot = false, pulse = false, className = '' }) {
  return (
    <span className={`badge tone-${tone} ${className}`}>
      {dot && <i className={`badge__dot ${pulse ? 'is-pulsing' : ''}`} />}
      {children}
    </span>
  )
}

export function StatusDot({ tone = 'success', label }) {
  return (
    <span className="statusdot">
      <i className={`statusdot__core tone-${tone}`} />
      {label && <span className="statusdot__label">{label}</span>}
    </span>
  )
}

/* ---------- Buttons ---------- */

export function Button({ icon, children, variant = 'ghost', size = 'md', ...rest }) {
  return (
    <button type="button" className={`btn btn--${variant} btn--${size}`} {...rest}>
      {icon && <Icon name={icon} size={16} />}
      {children}
    </button>
  )
}

/* ---------- Progress / meters ---------- */

export function Meter({ value, max = 100, tone = 'teal', label, right }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <div className="meter">
      {(label || right) && (
        <div className="meter__top">
          <span className="meter__label">{label}</span>
          <span className="meter__value">{right}</span>
        </div>
      )}
      <div className="meter__track">
        <div className={`meter__fill tone-${tone}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export function Sparkline({ points, tone = 'teal', width = 148, height = 42, fill = true }) {
  if (!points?.length) return null
  const min = Math.min(...points)
  const max = Math.max(...points)
  const span = max - min || 1
  const stepX = width / (points.length - 1 || 1)
  const coords = points.map((p, i) => [i * stepX, height - 3 - ((p - min) / span) * (height - 8)])
  const line = coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
  const area = `${line} L${width} ${height} L0 ${height} Z`
  const last = coords[coords.length - 1]

  return (
    <svg className={`spark tone-${tone}`} viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={`spark-${tone}-g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.38" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && <path d={area} fill={`url(#spark-${tone}-g)`} />}
      <path d={line} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r="3" fill="currentColor" />
      <circle cx={last[0]} cy={last[1]} r="3" fill="currentColor" className="spark__ping" />
    </svg>
  )
}

/* ---------- Section heading helper ---------- */

export function Stat({ label, value, tone = 'teal' }) {
  return (
    <div className="stat">
      <span className={`stat__value tone-${tone}`}>{value}</span>
      <span className="stat__label">{label}</span>
    </div>
  )
}
