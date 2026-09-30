import React from 'react'
import { motion, useReducedMotion } from 'framer-motion'

export default function GreenCorridorAnalytics() {
  const prefersReducedMotion = useReducedMotion()

  const metrics = [
    { label: 'Energy Recaptured (Regen Braking)', value: '1,480 kWh', delta: '+14.2%', color: '#34d399', icon: '⚡' },
    { label: 'CO2 Emissions Avoided', value: '1.84 Tonnes', delta: '-18.5%', color: '#38bdf8', icon: '🌱' },
    { label: 'Unnecessary Stop-Starts Prevented', value: '12 / shift', delta: '84% Optimal', color: '#a78bfa', icon: '🛑' },
    { label: 'Traction Power Efficiency', value: '92.6%', delta: '+3.1%', color: '#fbbf24', icon: '🔋' },
  ]

  return (
    <div
      className="card"
      role="region"
      aria-label="Green Corridor & Energy Analytics"
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
            <span style={{ fontSize: '18px' }}>🌿</span>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#f4f4f5' }}>
              Green Corridor & Traction Energy Optimization
            </h3>
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#a1a1aa' }}>
            Kinematic smooth-flow dispatching reducing heavy freight braking cycles and kilowatt losses.
          </p>
        </div>

        <span
          style={{
            fontSize: '11px',
            fontWeight: 600,
            padding: '4px 10px',
            borderRadius: '999px',
            background: 'rgba(52, 211, 153, 0.12)',
            color: '#34d399',
            border: '1px solid rgba(52, 211, 153, 0.25)',
          }}
        >
          Eco-Score: A+ (98.4)
        </span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
        }}
      >
        {metrics.map((m, idx) => (
          <div
            key={idx}
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '12px',
              padding: '16px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '18px' }}>{m.icon}</span>
              <span style={{ fontSize: '11px', fontWeight: 600, color: m.color }}>{m.delta}</span>
            </div>

            <div style={{ fontSize: '18px', fontWeight: 700, color: '#f4f4f5', fontFamily: 'monospace', marginTop: '10px' }}>
              {m.value}
            </div>

            <div style={{ fontSize: '11px', color: '#a1a1aa', marginTop: '4px' }}>{m.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
