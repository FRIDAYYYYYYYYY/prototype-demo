import Icon from './Icon.jsx'
import ThemeToggle from './ThemeToggle.jsx'
import { CONFLICT } from '../data/decision.js'
import { SYSTEM } from '../data/core.js'
import { useBackend, useClock } from '../hooks.js'
import { Badge, Button, StatusDot } from './ui.jsx'

const IS_APPLE = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)

export default function Topbar({ onMenu, onJump, onOpenPalette }) {
  const clock = useClock()
  // Real connection state, so the demo can never claim to be live when it is not.
  const { online, checked } = useBackend(3000)

  return (
    <header className="topbar">
      <button type="button" className="topbar__menu" onClick={onMenu} aria-label="Open navigation">
        <Icon name="menu" size={20} />
      </button>

      <div className="topbar__where">
        <span className="topbar__corridor">
          <Icon name="pin" size={15} />
          {SYSTEM.corridor}
        </span>
        <span className="topbar__divider" />
        <span className="topbar__conflict">
          Conflict <code>{CONFLICT.id}</code>
        </span>
      </div>

      <button type="button" className="topbar__search" onClick={onOpenPalette} aria-label="Search sections">
        <Icon name="search" size={15} />
        <span>Search sections…</span>
        <kbd>{IS_APPLE ? '⌘' : 'Ctrl'} K</kbd>
      </button>

      <div className="topbar__right">
        {online ? (
          <Badge tone="danger" dot pulse>
            Conflict live
          </Badge>
        ) : (
          <Badge tone="warn" dot>
            {checked ? 'Recorded values' : 'Connecting…'}
          </Badge>
        )}
        <StatusDot
          tone={online ? 'success' : 'muted'}
          label={online ? 'Backend live' : 'Backend offline'}
        />
        <span className="topbar__clock mono">{clock}</span>
        <ThemeToggle />
        <Button icon="bolt" variant="primary" size="sm" onClick={() => onJump('live')}>
          Live junction
        </Button>
      </div>
    </header>
  )
}
