import React, { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

export default function MultiJunctionGrid() {
  const prefersReducedMotion = useReducedMotion()
  const [selectedJunction, setSelectedJunction] = useState('J14')

  const junctions = [
    {
      id: 'J12',
      name: 'Junction 12 (North Apex)',
      throughput: '18 trains/hr',
      efficiency: '97.4%',
      status: 'Optimal',
      color: '#34d399',
      activeTrains: ['T-108', 'T-204'],
    },
    {
      id: 'J14',
      name: 'Junction 14 (Central Interlock)',
      throughput: '24 trains/hr',
      efficiency: '94.2%',
      status: 'High Load (Active CP-SAT)',
      color: '#38bdf8',
      activeTrains: ['T-101 (Express)', 'F-902 (Freight)'],
    },
    {
      id: 'J16',
      name: 'Junction 16 (South Yard)',
      throughput: '14 trains/hr',
      efficiency: '96.1%',
      status: 'Optimal',
      color: '#34d399',
      activeTrains: ['F-905'],
    },
  ]

  return (
    <div
      className="card"
      role="region"
      aria-label="Multi-Junction Corridor Grid"
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
            <span style={{ fontSize: '18px' }}>🌐</span>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#f4f4f5' }}>
              Multi-Junction Corridor Scalability (J12 → J14 → J16)
            </h3>
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#a1a1aa' }}>
            Synchronized network-wide dispatching preventing cascading delay ripple across adjacent sectors.
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
          Network Sync: 3/3 Nodes Active
        </span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '14px',
        }}
      >
        {junctions.map((j) => {
          const isSelected = selectedJunction === j.id
          return (
            <motion.div
              key={j.id}
              onClick={() => setSelectedJunction(j.id)}
              whileHover={{ y: -2 }}
              style={{
                background: isSelected ? 'rgba(56, 189, 248, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                border: `1px solid ${isSelected ? '#38bdf8' : 'rgba(255, 255, 255, 0.06)'}`,
                borderRadius: '12px',
                padding: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              tabIndex={0}
              role="button"
              aria-pressed={isSelected}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setSelectedJunction(j.id)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#f4f4f5' }}>{j.id}</span>
                <span style={{ fontSize: '11px', fontWeight: 600, color: j.color }}>{j.status}</span>
              </div>
              <div style={{ fontSize: '12px', color: '#a1a1aa', marginTop: '2px' }}>{j.name}</div>

              <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '10px', color: '#71717a' }}>Throughput</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#fafafa', fontFamily: 'monospace' }}>
                    {j.throughput}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '10px', color: '#71717a' }}>Efficiency</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: j.color, fontFamily: 'monospace' }}>
                    {j.efficiency}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '12px', background: 'rgba(0,0,0,0.3)', padding: '8px 10px', borderRadius: '6px', fontSize: '11px', color: '#a1a1aa' }}>
                Inbound: <strong style={{ color: '#d4d4d8' }}>{j.activeTrains.join(', ')}</strong>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
