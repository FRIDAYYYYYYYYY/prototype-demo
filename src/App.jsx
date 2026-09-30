import { useCallback, useEffect, useState } from 'react'
import { Outlet, Route, Routes, useLocation, useNavigate, useOutletContext } from 'react-router-dom'
import CommandPalette from './components/CommandPalette.jsx'
import Sidebar from './components/Sidebar.jsx'
import Topbar from './components/Topbar.jsx'
import Icon from './components/Icon.jsx'
import { SYSTEM, pathFor } from './data/core.js'
import OverviewPage from './pages/OverviewPage.jsx'
import LivePage from './pages/LivePage.jsx'
import DecisionPage from './pages/DecisionPage.jsx'
import AnalyticsPage from './pages/AnalyticsPage.jsx'
import HardwarePage from './pages/HardwarePage.jsx'
import PlanPage from './pages/PlanPage.jsx'
import ArchitecturePage from './pages/ArchitecturePage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'

/**
 * Persistent chrome around the routed pages.
 *
 * The sidebar, topbar and command palette used to sit on one long scrolling
 * page. They now wrap an <Outlet/>, so the shell (and the live backend poll
 * inside the topbar) survives navigation while the page content swaps.
 */
export default function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const navigate = useNavigate()
  const closeMenu = useCallback(() => setMenuOpen(false), [])

  // Section ids are the stable key used by the palette, the topbar button and
  // the overview hero, so those callers still pass an id while the target is a
  // route. Closing the drawer here covers every in-app navigation path, since
  // the sidebar links, the palette and `jump` all funnel through it.
  const jump = useCallback(
    (id) => {
      setMenuOpen(false)
      navigate(pathFor(id))
    },
    [navigate],
  )

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
      <Sidebar open={menuOpen} onClose={closeMenu} />

      <div className="shell__main">
        <Topbar
          onMenu={() => setMenuOpen(true)}
          onJump={jump}
          onOpenPalette={() => setPaletteOpen(true)}
        />

        <main className="content">
          <Routes>
            <Route element={<RoutedPage />}>
              <Route path="/" element={<OverviewPage />} />
              <Route path="/live" element={<LivePage />} />
              <Route path="/decision" element={<DecisionPage />} />
              <Route path="/architecture" element={<ArchitecturePage />} />
              <Route path="/mindmap" element={<ArchitecturePage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/hardware" element={<HardwarePage />} />
              <Route path="/plan" element={<PlanPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>

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

/**
 * Pathless layout route. It supplies `onJump` to the pages that render
 * cross-links (the overview hero), and moves focus to the new page heading so
 * keyboard and screen-reader users land on the content rather than back at the
 * top of the document after every navigation.
 */
function RoutedPage() {
  const location = useLocation()
  const jump = useOutletContext()

  useEffect(() => {
    const heading = document.querySelector('[data-page-title]')
    if (heading instanceof HTMLElement) heading.focus({ preventScroll: true })
  }, [location.pathname])

  return <Outlet context={jump} />
}
