import { NavLink } from 'react-router-dom'
import Icon from './Icon.jsx'
import { NAV, SYSTEM } from '../data/core.js'
import { useBackend } from '../hooks.js'
import { Badge, StatusDot } from './ui.jsx'

/**
 * Primary navigation.
 *
 * Each entry is a real <NavLink>, so the URL, the browser back/forward stack
 * and middle-click all behave the way they do for any other site. NavLink also
 * supplies `aria-current="page"` for free, which replaces the manual
 * `active === item.id` comparison the scroll-spy version needed.
 */
export default function Sidebar({ open, onClose }) {
  // Same poll as the topbar, so the two can never contradict each other.
  // Polled once here rather than shared via context: it is one extra health
  // request per 5s and avoids re-rendering the whole shell on every tick.
  const { online } = useBackend(5000)

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
                {/* end: "/" must not match every route, or Overview would
                    read as active on /live and every other page. */}
                <NavLink
                  to={item.path}
                  end
                  className={({ isActive }) => `navitem ${isActive ? 'is-active' : ''}`}
                  onClick={() => onClose()}
                >
                  <span className="navitem__icon">
                    <Icon name={item.icon} size={18} />
                  </span>
                  <span className="navitem__label">{item.label}</span>
                  <span className="navitem__rail" />
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar__foot">
          <div className="sidebar__status">
            {/* This used to be hardcoded to tone="success", so the sidebar
                claimed "Bridge online" even when the API was unreachable and
                the topbar was simultaneously saying "Recorded values". It now
                reads the same polled state the topbar uses. */}
            <StatusDot
              tone={online ? 'success' : 'warn'}
              label={online ? 'Bridge online' : 'Bridge offline'}
            />
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
