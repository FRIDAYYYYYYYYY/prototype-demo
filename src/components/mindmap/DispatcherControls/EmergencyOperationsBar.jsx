import React, { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

export default function EmergencyOperationsBar() {
  const prefersReducedMotion = useReducedMotion()
  const [eStopActive, setEStopActive] = useState(false)
  const [speedLimit, setSpeedLimit] = useState(80) // km/h
  const [tsrActive, setTsrActive] = useState(false)

  const handleEStopToggle = () => {
    setEStopActive((prev) => !prev)
  }

  const handleTsrChange = (val) => {
    setSpeedLimit(Number(val))
    setTsrActive(Number(val) < 80)
  }

  return (
    <div
      className="card"
      role="region"
      aria-label="Emergency Operations & Speed Restrictions"
      style={{
        background: eStopActive
          ? 'linear-gradient(135deg, rgba(127, 29, 29, 0.85) 0%, rgba(69, 10, 10, 0.95) 100%)'
          : 'linear-gradient(135deg, rgba(24, 24, 27, 0.75) 0%, rgba(9, 9, 11, 0.9) 100%)',
        backdropFilter: 'blur(16px)',
        border: eStopActive ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: eStopActive ? '0 0 35px rgba(239, 68, 68, 0.4)' : '0 8px 32px rgba(0, 0, 0, 0.35)',
        transition: 'all 0.3s ease',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>🚨</span>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#f4f4f5' }}>
              Emergency Operations & Temporary Speed Restrictions (TSR)
            </h3>
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: eStopActive ? '#fecaca' : '#a1a1aa' }}>
            Simulated corridor fail-safe overrides and dynamic velocity capping.
          </p>
        </div>

        {eStopActive && (
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            style={{
              padding: '6px 14px',
              borderRadius: '999px',
              background: '#ef4444',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '0.05em',
            }}
          >
            ⚠️ SIMULATED ALL-STOP ACTIVE
          </motion.div>
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px',
        }}
      >
        {/* E-Stop Control */}
        <div
          style={{
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '12px',
            padding: '16px',
            border: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#fafafa' }}>
              Corridor Master E-Stop
            </div>
            <div style={{ fontSize: '12px', color: '#a1a1aa', marginTop: '4px' }}>
              Instant simulated signal red-lock & train halt.
            </div>
          </div>

          <button
            onClick={handleEStopToggle}
            style={{
              background: eStopActive ? '#f43f5e' : '#dc2626',
              color: '#ffffff',
              border: '2px solid rgba(255,255,255,0.2)',
              borderRadius: '12px',
              padding: '12px 20px',
              fontSize: '13px',
              fontWeight: 800,
              letterSpacing: '0.04em',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(220, 38, 38, 0.4)',
              transition: 'transform 0.1s, background 0.2s',
            }}
            aria-pressed={eStopActive}
            aria-label="Master corridor emergency stop toggle"
          >
            {eStopActive ? 'RELEASE E-STOP' : 'HALT CORRIDOR'}
          </button>
        </div>

        {/* Dynamic Speed Restriction Slider */}
        <div
          style={{
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '12px',
            padding: '16px',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#fafafa' }}>
              Temporary Speed Restriction (TSR)
            </span>
            <span
              style={{
                fontSize: '13px',
                fontWeight: 700,
                fontFamily: 'monospace',
                color: tsrActive ? '#fbbf24' : '#34d399',
              }}
            >
              {speedLimit} km/h {tsrActive && '(RESTRICTED)'}
            </span>
          </div>

          <input
            type="range"
            min="20"
            max="120"
            step="5"
            value={speedLimit}
            onChange={(e) => handleTsrChange(e.target.value)}
            style={{
              width: '100%',
              marginTop: '12px',
              accentColor: tsrActive ? '#fbbf24' : '#34d399',
              cursor: 'pointer',
            }}
            aria-label="Temporary speed restriction limit in kilometers per hour"
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#71717a', marginTop: '6px' }}>
            <span>Caution (20 km/h)</span>
            <span>Nominal (80 km/h)</span>
            <span>Express Max (120 km/h)</span>
          </div>
        </div>
      </div>
    </div>
  )
}
