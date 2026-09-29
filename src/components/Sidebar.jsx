import Icon from './Icon.jsx'
import { NAV, SYSTEM } from '../data/core.js'
import { Badge, StatusDot } from './ui.jsx'

export default function Sidebar({ active, onNavigate, open, onClose }) {
  return (
    <>
      <div className={`scrim ${open ? 'is-open' : ''}`} onClick={onClose} aria-hidden="true" />
      <aside className={`sidebar ${open ? 'is-open' : ''}`} aria-label="Primary navigation">
        <div className="sidebar__brand">
          <span className="brandmark">
            <Icon name="train" size={22} />
          </span>
          <span className="brandtext">
            <strong>{SYSTEM.name}</strong>
            <small>Traffic Control</small>
          </span>
          <button type="button" className="sidebar__close" onClick={onClose} aria-label="Close navigation">
            <Icon name="close" size={18} />
          </button>
        </div>

        <nav className="sidebar__nav">
          <span className="sidebar__label">Workspace</span>
          <ul>
            {NAV.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className={`navitem ${active === item.id ? 'is-active' : ''}`}
                  onClick={() => onNavigate(item.id)}
                  aria-current={active === item.id ? 'true' : undefined}
                >
                  <span className="navitem__icon">
                    <Icon name={item.icon} size={18} />
                  </span>
                  <span className="navitem__label">{item.label}</span>
                  <span className="navitem__rail" />
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar__foot">
          <div className="sidebar__status">
            <StatusDot tone="success" label="Bridge online" />
            <Badge tone="indigo">Phase B</Badge>
          </div>
          <p className="sidebar__safety">
            <Icon name="shield" size={15} />
            {SYSTEM.safety}
          </p>
        </div>
      </aside>
    </>
  )
}
