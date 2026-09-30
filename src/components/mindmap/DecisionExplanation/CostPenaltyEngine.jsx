import React, { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

export default function CostPenaltyEngine() {
  const prefersReducedMotion = useReducedMotion()
  const [activeScenario, setActiveScenario] = useState('case2') // case2 = Express Proceed, case3 = Express Held

  const scenarioData = {
    case2: {
      name: 'Case 2: Optimal Schedule (Express Proceed / Freight Held)',
      solverStatus: 'OPTIMAL (4.2ms)',
      totalCost: 1420,
      breakdown: [
        { label: 'Passenger-Minute Penalty', value: 420, max: 2500, color: '#38bdf8', pct: '29%' },
        { label: 'Downstream Cascade Risk', value: 280, max: 2000, color: '#34d399', pct: '20%' },
        { label: 'Platform Connection Margin', value: 120, max: 1500, color: '#a78bfa', pct: '8%' },
        { label: 'Freight Siding Dwell Cost', value: 600, max: 2000, color: '#fbbf24', pct: '43%' },
      ],
      netSavings: '₹3,880 saved vs Unregulated Queue',
      conflictProbability: '0.0% (Interlock Locked)',
    },
    case3: {
      name: 'Case 3: Inverted Priority (Freight Proceed / Express Held)',
      solverStatus: 'SUBOPTIMAL (+380% Cost)',
      totalCost: 5300,
      breakdown: [
        { label: 'Passenger-Minute Penalty', value: 2450, max: 2500, color: '#f87171', pct: '98%' },
        { label: 'Downstream Cascade Risk', value: 1800, max: 2000, color: '#fb923c', pct: '90%' },
        { label: 'Platform Connection Margin', value: 850, max: 1500, color: '#f43f5e', pct: '56%' },
        { label: 'Freight Siding Dwell Cost', value: 200, max: 2000, color: '#34d399', pct: '10%' },
      ],
      netSavings: '₹0 (Penalty Incurred)',
      conflictProbability: 'Elevated Downstream Ripple',
    },
  }

  const current = scenarioData[activeScenario]

  return (
    <div
      className="card"
      role="region"
      aria-label="Cost Weight Penalty Engine"
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
            <span style={{ color: '#34d399', fontSize: '18px' }}>⚖️</span>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#f4f4f5' }}>
              Cost-Weight Penalty Engine
            </h3>
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#a1a1aa' }}>
            Multi-factor economic loss formulation evaluated per dispatch decision.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.4)', padding: '4px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            onClick={() => setActiveScenario('case2')}
            style={{
              background: activeScenario === 'case2' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
              color: activeScenario === 'case2' ? '#38bdf8' : '#a1a1aa',
              border: activeScenario === 'case2' ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid transparent',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            aria-pressed={activeScenario === 'case2'}
          >
            Optimal (Case 2)
          </button>
          <button
            onClick={() => setActiveScenario('case3')}
            style={{
              background: activeScenario === 'case3' ? 'rgba(248, 113, 113, 0.2)' : 'transparent',
              color: activeScenario === 'case3' ? '#f87171' : '#a1a1aa',
              border: activeScenario === 'case3' ? '1px solid rgba(248, 113, 113, 0.4)' : '1px solid transparent',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            aria-pressed={activeScenario === 'case3'}
          >
            Inverted (Case 3)
          </button>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px 16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontSize: '11px', color: '#71717a' }}>Computed Objective Cost</div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: activeScenario === 'case2' ? '#34d399' : '#f87171', fontFamily: 'monospace', marginTop: '2px' }}>
            ₹{current.totalCost.toLocaleString()}
          </div>
          <div style={{ fontSize: '11px', color: '#a1a1aa', marginTop: '2px' }}>{current.netSavings}</div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px 16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontSize: '11px', color: '#71717a' }}>Solver Verification</div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#fafafa', marginTop: '4px' }}>
            {current.solverStatus}
          </div>
          <div style={{ fontSize: '11px', color: '#38bdf8', marginTop: '2px' }}>{current.conflictProbability}</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {current.breakdown.map((item, idx) => (
          <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: '#d4d4d8', fontWeight: 500 }}>{item.label}</span>
              <span style={{ color: item.color, fontWeight: 700, fontFamily: 'monospace' }}>
                ₹{item.value} <span style={{ color: '#71717a', fontSize: '11px' }}>({item.pct})</span>
              </span>
            </div>
            <div
              style={{
                height: '8px',
                width: '100%',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '999px',
                overflow: 'hidden',
              }}
              role="progressbar"
              aria-valuenow={item.value}
              aria-valuemin="0"
              aria-valuemax={item.max}
              aria-label={item.label}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (item.value / item.max) * 100)}%` }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.6, delay: idx * 0.05, ease: 'easeOut' }}
                style={{
                  height: '100%',
                  background: `linear-gradient(90deg, ${item.color}88, ${item.color})`,
                  borderRadius: '999px',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
