import { useCallback, useEffect, useState } from 'react'
import Analytics from './components/Analytics.jsx'
import CommandPalette from './components/CommandPalette.jsx'
import DecisionCore from './components/DecisionCore.jsx'
import Hardware from './components/Hardware.jsx'
import LiveJunction from './components/LiveJunction.jsx'
import Overview from './components/Overview.jsx'
import Plan from './components/Plan.jsx'
import Sidebar from './components/Sidebar.jsx'
import Topbar from './components/Topbar.jsx'
import Icon from './components/Icon.jsx'
import { Section } from './components/ui.jsx'
import { SYSTEM } from './data/core.js'

export default function App() {
  const [active, setActive] = useState('overview')
  const [menuOpen, setMenuOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)

  const jump = useCallback((id) => {
    setActive(id)
    setMenuOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  // Highlight whichever section is currently in the viewport.
  useEffect(() => {
    const ids = ['overview', 'live', 'decision', 'analytics', 'hardware', 'plan']
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (hit) setActive(hit.target.id)
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: [0, 0.25, 0.6] },
    )
    ids.forEach((id) => {
      const el = document.getElementById(id)
      if (el) io.observe(el)
    })
    return () => io.disconnect()
  }, [])

  // Global shortcut: Cmd/Ctrl + K opens the command palette.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="shell">
      <Sidebar active={active} onNavigate={jump} open={menuOpen} onClose={() => setMenuOpen(false)} />

      <div className="shell__main">
        <Topbar
          onMenu={() => setMenuOpen(true)}
          onJump={jump}
          onOpenPalette={() => setPaletteOpen(true)}
        />

        <main className="content">
          <Overview onJump={jump} />

          <Section
            id="live"
            eyebrow="Live junction"
            icon="track"
            title="Signal & Sensor Monitor"
            subtitle="Real-time signal monitoring and sensor event tracking."
          >
            <LiveJunction />
          </Section>

          <Section
            id="decision"
            eyebrow="Decision core"
            icon="cpu"
            title="Optimization & Validation"
            subtitle="Conflict resolution, optimization and validation pipeline."
          >
            <DecisionCore />
          </Section>

          <Section
            id="analytics"
            eyebrow="Analytics"
            icon="chart"
            title="Performance Analytics"
            subtitle="Performance comparison and traffic analysis metrics."
          >
            <Analytics />
          </Section>

          <Section
            id="hardware"
            eyebrow="Hardware bridge"
            icon="board"
            title="Hardware Integration"
            subtitle="Hardware device status and API integration."
          >
            <Hardware />
          </Section>

          <Section
            id="plan"
            eyebrow="Roadmap"
            icon="flag"
            title="Project Milestones"
            subtitle="Completed and in-progress development phases."
          >
            <Plan />
          </Section>

          <footer className="footer">
            <div className="footer__brand">
              <Icon name="train" size={20} />
              <strong>{SYSTEM.name}</strong>
              <span>{SYSTEM.subtitle}</span>
            </div>
          </footer>
        </main>
      </div>

      <CommandPalette
        key={paletteOpen ? 'open' : 'closed'}
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onNavigate={jump}
      />
    </div>
  )
}
