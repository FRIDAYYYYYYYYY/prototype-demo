import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { NAV } from '../data/core.js'
import Icon from './Icon.jsx'

const SECTION_META = {
  overview: 'KPI overview and measured CP-SAT gain',
  live: 'Signals, blocks and the sensor stream',
  decision: 'Conflict, CP-SAT, validation, recommendation',
  analytics: 'Measured value, not assumed value',
  hardware: 'The contract the firmware codes against',
  plan: 'Remaining work and the demo runbook',
}

/**
 * Spotlight-style command palette (Cmd/Ctrl + K) for jumping between sections.
 * Full keyboard support: arrows to move, Enter to select, Esc to close.
 */
export default function CommandPalette({ open, onClose, onNavigate }) {
  const [query, setQuery] = useState('')
  const [cursor, setCursor] = useState(0)
  const inputRef = useRef(null)

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return NAV
    return NAV.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        (SECTION_META[item.id] ?? '').toLowerCase().includes(q),
    )
  }, [query])

  // Focus the input when the palette opens.
  useEffect(() => {
    if (!open) return
    const id = requestAnimationFrame(() => inputRef.current?.focus())
    return () => cancelAnimationFrame(id)
  }, [open])

  const choose = useCallback(
    (id) => {
      onNavigate(id)
      onClose()
    },
    [onNavigate, onClose],
  )

  const onKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setCursor((c) => (results.length ? (c + 1) % results.length : 0))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setCursor((c) => (results.length ? (c - 1 + results.length) % results.length : 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (results[cursor]) choose(results[cursor].id)
      }
    },
    [cursor, results, choose, onClose],
  )

  if (!open) return null

  return (
    <div className="palette" onClick={onClose} role="dialog" aria-modal="true" aria-label="Jump to section">
      {/* Stop the click from bubbling to the backdrop when interacting with the sheet */}
      <div className="palette__sheet" onClick={(e) => e.stopPropagation()}>
        <div className="palette__search">
          <Icon name="search" size={17} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setCursor(0)
            }}
            onKeyDown={onKeyDown}
            placeholder="Jump to a section…"
            aria-label="Search sections"
          />
          <kbd>Esc</kbd>
        </div>

        {results.length ? (
          <ul className="palette__list">
            {results.map((item, i) => (
              <li key={item.id}>
                <button
                  type="button"
                  className={`palette__item ${i === cursor ? 'is-active' : ''}`}
                  onMouseEnter={() => setCursor(i)}
                  onClick={() => choose(item.id)}
                >
                  <Icon name={item.icon} size={17} />
                  <b>{item.label}</b>
                  <small>{SECTION_META[item.id]}</small>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="palette__empty">No section matches “{query}”.</p>
        )}

        <div className="palette__foot">
          <span>
            <kbd>↑</kbd>
            <kbd>↓</kbd> navigate
          </span>
          <span>
            <kbd>↵</kbd> open
          </span>
          <span>
            <kbd>esc</kbd> close
          </span>
        </div>
      </div>
    </div>
  )
}