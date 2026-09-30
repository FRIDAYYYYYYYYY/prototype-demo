import Icon from './Icon.jsx'
import ThemeToggle from './ThemeToggle.jsx'
import { SYSTEM } from '../data/core.js'
import { useBackend, useClock } from '../hooks.js'
import { Badge, Button } from './ui.jsx'

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
      </div>

      <button type="button" className="topbar__search" onClick={onOpenPalette} aria-label="Search pages">
        <Icon name="search" size={15} />
        <span>Search pages…</span>
        <kbd>{IS_APPLE ? '⌘' : 'Ctrl'} K</kbd>
      </button>

      <div className="topbar__right">
        {/* One indicator, not two. The "Conflict live" badge and the
            "Backend live" dot were both driven by the same `online` flag from
            the same poll, so they could never disagree - they were just
            saying the same thing twice, in two different colours.
            Tone follows the real state: live reads as a neutral success,
            a stale connection reads as a warning. */}
        {online ? (
          <Badge tone="success" dot pulse>
            Live
          </Badge>
        ) : (
          <Badge tone="warn" dot>
            {checked ? 'Recorded values' : 'Connecting…'}
          </Badge>
        )}
        <span className="topbar__clock mono">{clock}</span>
        <ThemeToggle />
        <Button icon="bolt" variant="primary" size="sm" onClick={() => onJump('live')}>
          Live junction
        </Button>
      </div>
    </header>
  )
}
