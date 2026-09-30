import React, { useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import Icon from '../Icon.jsx'

export default function PriorityMatrixCard() {
  const prefersReducedMotion = useReducedMotion()
  const [weights, setWeights] = useState({
    express: 1.0,
    passenger: 2.0,
    freight: 3.0,
  })
  const [activeTier, setActiveTier] = useState('express')

  const tiers = [
    {
      id: 'express',
      name: 'Class 1: Express / Vande Bharat',
      type: 'T-101 / High Speed',
      baseWeight: weights.express,
      costPerMin: 1250,
      color: '#38bdf8',
      bgGlow: 'rgba(56, 189, 248, 0.15)',
      description: 'Zero-tolerance delay penalty. Highest right-of-way through critical junction interlocks.',
      passengers: '1,120 passengers',
      punctualityTarget: '99.2%',
    },
    {
      id: 'passenger',
      name: 'Class 2: Regional Passenger',
      type: 'T-102 / Suburban Commuter',
      baseWeight: weights.passenger,
      costPerMin: 680,
      color: '#34d399',
      bgGlow: 'rgba(52, 211, 153, 0.15)',
      description: 'Balanced headway scheduling with standard dwell times and platform transfer margins.',
      passengers: '850 passengers',
      punctualityTarget: '95.0%',
    },
    {
      id: 'freight',
      name: 'Class 3: Heavy Freight',
      type: 'F-902 / Bulk Cargo',
      baseWeight: weights.freight,
      costPerMin: 220,
      color: '#fbbf24',
      bgGlow: 'rgba(251, 191, 36, 0.15)',
      description: 'High kinetic inertia, longer braking curves. Prioritized into loop sidings during peak conflict.',
      passengers: 'Cargo (3,400 T)',
      punctualityTarget: '88.5%',
    },
  ]

  const handleWeightChange = (id, val) => {
    setWeights((prev) => ({ ...prev, [id]: parseFloat(val) }))
  }

  const containerVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        staggerChildren: 0.1,
        duration: prefersReducedMotion ? 0 : 0.4,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.96 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { type: 'spring', stiffness: 300, damping: 25 },
    },
  }

  return (
    <div
      className="card"
      role="region"
      aria-label="Priority Class Matrix"
      style={{
        background: 'linear-gradient(135deg, rgba(24, 24, 27, 0.75) 0%, rgba(9, 9, 11, 0.9) 100%)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#38bdf8', fontSize: '18px' }}>⚡</span>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#f4f4f5' }}>
              Priority Class Weighting Matrix
            </h3>
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#a1a1aa' }}>
            Dynamic cost weight parameters feeding the CP-SAT solver objective function.
          </p>
        </div>
        <span
          style={{
            fontSize: '11px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            padding: '4px 10px',
            borderRadius: '999px',
            background: 'rgba(56, 189, 248, 0.12)',
            color: '#38bdf8',
            border: '1px solid rgba(56, 189, 248, 0.25)',
          }}
        >
          Live Solver Feed
        </span>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '16px',
          marginBottom: '20px',
        }}
      >
        {tiers.map((tier) => {
          const isSelected = activeTier === tier.id
          return (
            <motion.div
              key={tier.id}
              variants={itemVariants}
              onClick={() => setActiveTier(tier.id)}
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              style={{
                background: isSelected ? tier.bgGlow : 'rgba(255, 255, 255, 0.03)',
                border: `1px solid ${isSelected ? tier.color : 'rgba(255, 255, 255, 0.07)'}`,
                borderRadius: '12px',
                padding: '16px',
                cursor: 'pointer',
                transition: 'border-color 0.2s, background 0.2s',
                position: 'relative',
                overflow: 'hidden',
              }}
              tabIndex={0}
              role="button"
              aria-pressed={isSelected}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setActiveTier(tier.id)}
            >
              {isSelected && (
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: '60px',
                    height: '60px',
                    background: `radial-gradient(circle, ${tier.color}33 0%, transparent 70%)`,
                    pointerEvents: 'none',
                  }}
                />
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '12px', color: tier.color, fontWeight: 700, letterSpacing: '0.04em' }}>
                  {tier.name}
                </span>
                <span style={{ fontSize: '11px', color: '#71717a' }}>{tier.type}</span>
              </div>

              <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#a1a1aa' }}>Delay Penalty / min</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#fafafa', fontFamily: 'monospace' }}>
                    ₹{(tier.costPerMin * (weights[tier.id] || 1)).toLocaleString()}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: '#a1a1aa' }}>Solver Weight</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: tier.color, fontFamily: 'monospace' }}>
                    {weights[tier.id].toFixed(1)}x
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '14px' }}>
                <label
                  htmlFor={`slider-${tier.id}`}
                  style={{ fontSize: '11px', color: '#71717a', display: 'flex', justifyContent: 'space-between' }}
                >
                  <span>Weight Multiplier</span>
                  <span>{weights[tier.id]}x</span>
                </label>
                <input
                  id={`slider-${tier.id}`}
                  type="range"
                  min="0.5"
                  max="5.0"
                  step="0.1"
                  value={weights[tier.id]}
                  onChange={(e) => handleWeightChange(tier.id, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    width: '100%',
                    marginTop: '6px',
                    accentColor: tier.color,
                    cursor: 'pointer',
                  }}
                  aria-label={`${tier.name} weight multiplier slider`}
                />
              </div>

              <p style={{ margin: '10px 0 0 0', fontSize: '12px', color: '#a1a1aa', lineHeight: 1.4 }}>
                {tier.description}
              </p>
            </motion.div>
          )
        })}
      </motion.div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          borderRadius: '10px',
          background: 'rgba(0, 0, 0, 0.25)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          fontSize: '12px',
          color: '#a1a1aa',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <span>
          <strong style={{ color: '#e4e4e7' }}>Active Selected Tier:</strong>{' '}
          {tiers.find((t) => t.id === activeTier)?.name} ({tiers.find((t) => t.id === activeTier)?.passengers})
        </span>
        <button
          onClick={() => setWeights({ express: 1.0, passenger: 2.0, freight: 3.0 })}
          style={{
            background: 'transparent',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '6px',
            padding: '4px 10px',
            color: '#d4d4d8',
            cursor: 'pointer',
            fontSize: '11px',
            fontWeight: 500,
            transition: 'background 0.2s',
          }}
          aria-label="Reset weights to defaults"
        >
          Reset Defaults
        </button>
      </div>
    </div>
  )
}
