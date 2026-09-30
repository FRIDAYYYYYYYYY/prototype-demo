import React, { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

export default function TurnoutTopologyView() {
  const prefersReducedMotion = useReducedMotion()
  const [pointState, setPointState] = useState('NORMAL') // NORMAL = Straight (Main), REVERSE = Turnout (Siding)

  const togglePoint = () => {
    setPointState((p) => (p === 'NORMAL' ? 'REVERSE' : 'NORMAL'))
  }

  return (
    <div
      className="card"
      role="region"
      aria-label="Turnout & Loop Siding Topology"
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
            <span style={{ fontSize: '18px' }}>🔀</span>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#f4f4f5' }}>
              Switch Points & Siding Turnout Topology
            </h3>
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#a1a1aa' }}>
            Physical track switch geometry, point machine lock status, and loop siding alignment.
          </p>
        </div>

        <button
          onClick={togglePoint}
          style={{
            background: pointState === 'NORMAL' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(251, 191, 36, 0.15)',
            border: `1px solid ${pointState === 'NORMAL' ? 'rgba(56, 189, 248, 0.4)' : 'rgba(251, 191, 36, 0.4)'}`,
            color: pointState === 'NORMAL' ? '#38bdf8' : '#fbbf24',
            borderRadius: '8px',
            padding: '6px 14px',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          aria-label={`Toggle switch point machine. Current state: ${pointState}`}
        >
          Point 14A: {pointState === 'NORMAL' ? 'MAIN LINE (Normal)' : 'LOOP SIDING (Reverse)'}
        </button>
      </div>

      <div
        style={{
          background: 'rgba(0,0,0,0.4)',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.06)',
          padding: '20px',
        }}
      >
        <svg viewBox="0 0 700 200" style={{ width: '100%', height: 'auto', display: 'block' }}>
          {/* Main Track 1 (Straight) */}
          <line x1="50" y1="80" x2="650" y2="80" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" />
          <text x="60" y="65" fill="#38bdf8" fontSize="11" fontWeight="bold">Main Line (Up Express)</text>

          {/* Siding Track (Turnout Divergence) */}
          <path
            d="M 220 80 Q 280 80 340 140 L 650 140"
            fill="none"
            stroke={pointState === 'REVERSE' ? '#fbbf24' : 'rgba(255,255,255,0.2)'}
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <text x="350" y="160" fill="#fbbf24" fontSize="11" fontWeight="bold">Loop Siding 2 (Freight Hold Track)</text>

          {/* Switch Point Machine Blade indicator */}
          <motion.line
            x1="220"
            y1="80"
            animate={{
              x2: pointState === 'NORMAL' ? 260 : 255,
              y2: pointState === 'NORMAL' ? 80 : 98,
            }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.3, ease: 'easeInOut' }}
            stroke="#ffffff"
            strokeWidth="5"
            strokeLinecap="round"
          />

          {/* Point Lock Status Box */}
          <rect x="200" y="20" width="120" height="30" rx="6" fill="#18181b" stroke="rgba(255,255,255,0.15)" />
          <text x="260" y="39" fill="#34d399" fontSize="10" fontWeight="bold" textAnchor="middle">
            🔒 POINT 14A: LOCKED
          </text>
        </svg>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginTop: '14px' }}>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)', fontSize: '11px', color: '#a1a1aa' }}>
            Max Turnout Speed: <strong style={{ color: '#fafafa' }}>30 km/h</strong>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)', fontSize: '11px', color: '#a1a1aa' }}>
            Siding Usable Length: <strong style={{ color: '#fafafa' }}>720 meters</strong>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)', fontSize: '11px', color: '#a1a1aa' }}>
            Flank Interlock: <strong style={{ color: '#34d399' }}>Protected</strong>
          </div>
        </div>
      </div>
    </div>
  )
}
