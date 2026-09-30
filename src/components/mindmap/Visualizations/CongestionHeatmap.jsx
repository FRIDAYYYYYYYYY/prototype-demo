import React from 'react'
import { motion, useReducedMotion } from 'framer-motion'

export default function CongestionHeatmap() {
  const prefersReducedMotion = useReducedMotion()

  const blocks = [
    { id: 'BLK-10', name: 'Station Alpha Approach', occupancy: 42, color: '#34d399', status: 'Fluid (42%)' },
    { id: 'BLK-11', name: 'Intermediate Sector 1', occupancy: 65, color: '#fbbf24', status: 'Moderate (65%)' },
    { id: 'BLK-12', name: 'Junction Inbound Flank', occupancy: 88, color: '#f87171', status: 'High (88%)' },
    { id: 'BLK-14', name: 'Junction 14 Diamond Core', occupancy: 94, color: '#ef4444', status: 'Critical (94%)' },
    { id: 'BLK-15', name: 'Outbound Express Main', occupancy: 35, color: '#34d399', status: 'Clear (35%)' },
    { id: 'BLK-16', name: 'Station Beta Platform', occupancy: 50, color: '#38bdf8', status: 'Optimal (50%)' },
  ]

  return (
    <div
      className="card"
      role="region"
      aria-label="Corridor Congestion Heatmap"
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
            <span style={{ fontSize: '18px' }}>🔥</span>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#f4f4f5' }}>
              Corridor Block Congestion & Density Heatmap
            </h3>
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#a1a1aa' }}>
            Real-time block occupancy density waves and headway compression metrics across Corridor C-1.
          </p>
        </div>

        <span
          style={{
            fontSize: '11px',
            fontWeight: 600,
            padding: '4px 10px',
            borderRadius: '999px',
            background: 'rgba(239, 68, 68, 0.15)',
            color: '#f87171',
            border: '1px solid rgba(239, 68, 68, 0.3)',
          }}
        >
          Peak Wave: BLK-14 (94%)
        </span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
        }}
      >
        {blocks.map((b) => (
          <div
            key={b.id}
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: `1px solid ${b.color}44`,
              borderRadius: '12px',
              padding: '14px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                bottom: 0,
                width: `${b.occupancy}%`,
                background: `linear-gradient(90deg, transparent, ${b.color}18)`,
                pointerEvents: 'none',
              }}
            />

            <div style={{ fontSize: '11px', color: '#71717a', fontWeight: 600 }}>{b.id}</div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#f4f4f5', marginTop: '2px' }}>{b.name}</div>

            <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: '11px', color: '#a1a1aa' }}>Occupancy</span>
              <span style={{ fontSize: '16px', fontWeight: 700, color: b.color, fontFamily: 'monospace' }}>
                {b.occupancy}%
              </span>
            </div>

            <div
              style={{
                height: '6px',
                width: '100%',
                background: 'rgba(255, 255, 255, 0.06)',
                borderRadius: '999px',
                marginTop: '6px',
                overflow: 'hidden',
              }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${b.occupancy}%` }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.8, ease: 'easeOut' }}
                style={{
                  height: '100%',
                  background: b.color,
                  borderRadius: '999px',
                }}
              />
            </div>

            <div style={{ fontSize: '10px', color: b.color, marginTop: '6px', fontWeight: 600 }}>
              ● {b.status}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
