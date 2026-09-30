import React, { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

export default function DispatcherAuditLog() {
  const prefersReducedMotion = useReducedMotion()
  const [filter, setFilter] = useState('ALL')

  const initialEntries = [
    {
      id: 'LOG-8841',
      timestamp: '18:42:15',
      type: 'ADVISORY_ACCEPTED',
      actor: 'Dispatcher (Duty Officer)',
      details: 'Accepted CP-SAT recommendation: T-101 (Express) Proceed, F-902 (Freight) Siding Hold.',
      hash: 'sha256:7f9b2...e14a',
      badgeColor: '#34d399',
    },
    {
      id: 'LOG-8840',
      timestamp: '18:39:02',
      type: 'SOLVER_RUN',
      actor: 'OR-Tools Engine',
      details: 'Feasible schedule generated in 4.2ms. All 5 safety constraints verified.',
      hash: 'sha256:a23c4...998b',
      badgeColor: '#38bdf8',
    },
    {
      id: 'LOG-8839',
      timestamp: '18:35:44',
      type: 'MANUAL_OVERRIDE',
      actor: 'Dispatcher (Duty Officer)',
      details: 'Temporary signal aspect hold applied to SIG-B for track inspection clearance.',
      hash: 'sha256:d48e1...321c',
      badgeColor: '#fbbf24',
    },
    {
      id: 'LOG-8838',
      timestamp: '18:30:11',
      type: 'INTERLOCK_CHECK',
      actor: 'Electronic Interlocking (EI)',
      details: 'Point Machine 14A locked Normal. Route integrity verified.',
      hash: 'sha256:5c1d9...881f',
      badgeColor: '#a78bfa',
    },
  ]

  const filtered = filter === 'ALL' ? initialEntries : initialEntries.filter((e) => e.type === filter)

  return (
    <div
      className="card"
      role="region"
      aria-label="Dispatcher Audit Ledger"
      style={{
        background: 'linear-gradient(135deg, rgba(24, 24, 27, 0.75) 0%, rgba(9, 9, 11, 0.9) 100%)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>📜</span>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#f4f4f5' }}>
              Dispatcher Decision & Audit Ledger
            </h3>
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#a1a1aa' }}>
            Immutable chronological record of dispatcher acceptances, overrides, and solver proofs.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          {['ALL', 'ADVISORY_ACCEPTED', 'MANUAL_OVERRIDE'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                background: filter === f ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                color: filter === f ? '#f4f4f5' : '#a1a1aa',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {f.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filtered.map((entry) => (
          <div
            key={entry.id}
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '10px',
              padding: '12px 16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: `${entry.badgeColor}22`,
                    color: entry.badgeColor,
                    border: `1px solid ${entry.badgeColor}44`,
                  }}
                >
                  {entry.type}
                </span>
                <span style={{ fontSize: '12px', color: '#71717a', fontFamily: 'monospace' }}>
                  {entry.timestamp}
                </span>
                <span style={{ fontSize: '12px', color: '#a1a1aa' }}>• {entry.actor}</span>
              </div>
              <div style={{ fontSize: '13px', color: '#d4d4d8', marginTop: '6px' }}>{entry.details}</div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span
                style={{
                  fontSize: '11px',
                  color: '#71717a',
                  fontFamily: 'monospace',
                  background: 'rgba(0,0,0,0.3)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                }}
              >
                {entry.hash}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
