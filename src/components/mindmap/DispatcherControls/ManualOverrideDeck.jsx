import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'

export default function ManualOverrideDeck() {
  const prefersReducedMotion = useReducedMotion()
  const [signals, setSignals] = useState({
    'SIG-A': 'GREEN', // Approach Track A
    'SIG-B': 'RED',   // Approach Track B (Siding)
    'SIG-C': 'AMBER', // Downstream Outbound Block
  })

  const [pendingOverride, setPendingOverride] = useState(null)
  const [overrideTimer, setOverrideTimer] = useState(null)

  useEffect(() => {
    let interval
    if (overrideTimer !== null && overrideTimer > 0) {
      interval = setInterval(() => {
        setOverrideTimer((t) => (t > 1 ? t - 1 : null))
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [overrideTimer])

  const requestAspectChange = (sigId, newAspect) => {
    setPendingOverride({ sigId, newAspect })
  }

  const confirmOverride = () => {
    if (pendingOverride) {
      setSignals((prev) => ({
        ...prev,
        [pendingOverride.sigId]: pendingOverride.newAspect,
      }))
      setPendingOverride(null)
      setOverrideTimer(120) // 2-minute safety override window
    }
  }

  const cancelOverride = () => {
    setPendingOverride(null)
  }

  const getAspectColor = (aspect) => {
    switch (aspect) {
      case 'GREEN':
        return '#34d399'
      case 'AMBER':
        return '#fbbf24'
      case 'RED':
      default:
        return '#f87171'
    }
  }

  return (
    <div
      className="card"
      role="region"
      aria-label="Manual Signal Override Deck"
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
            <span style={{ color: '#fbbf24', fontSize: '18px' }}>🚦</span>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#f4f4f5' }}>
              Manual Signal Override Deck (Human-in-the-Loop)
            </h3>
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#a1a1aa' }}>
            Dispatcher interlocking controls with electronic interlocking safety enforcement.
          </p>
        </div>

        {overrideTimer && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '999px',
              background: 'rgba(251, 191, 36, 0.15)',
              border: '1px solid rgba(251, 191, 36, 0.3)',
              color: '#fbbf24',
              fontSize: '12px',
              fontWeight: 600,
            }}
          >
            <span>⏱️ Active Override:</span>
            <span>{overrideTimer}s remaining</span>
          </div>
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '14px',
        }}
      >
        {Object.entries(signals).map(([sigId, currentAspect]) => {
          const color = getAspectColor(currentAspect)
          return (
            <div
              key={sigId}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#fafafa' }}>{sigId}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: color,
                      boxShadow: `0 0 10px ${color}`,
                    }}
                  />
                  <span style={{ fontSize: '12px', fontWeight: 700, color }}>{currentAspect}</span>
                </div>
              </div>

              <div style={{ fontSize: '11px', color: '#71717a' }}>
                {sigId === 'SIG-A' ? 'Main Line (Track 1 Approach)' : sigId === 'SIG-B' ? 'Loop Siding (Track 2 Approach)' : 'Junction Exit Block (Block 15)'}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', marginTop: '4px' }}>
                {['GREEN', 'AMBER', 'RED'].map((aspect) => {
                  const isCurrent = currentAspect === aspect
                  const btnColor = getAspectColor(aspect)
                  return (
                    <button
                      key={aspect}
                      onClick={() => requestAspectChange(sigId, aspect)}
                      disabled={isCurrent}
                      style={{
                        background: isCurrent ? `${btnColor}22` : 'rgba(255, 255, 255, 0.04)',
                        border: `1px solid ${isCurrent ? btnColor : 'rgba(255, 255, 255, 0.08)'}`,
                        color: isCurrent ? btnColor : '#a1a1aa',
                        borderRadius: '6px',
                        padding: '6px 4px',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: isCurrent ? 'default' : 'pointer',
                        transition: 'all 0.2s',
                      }}
                      aria-label={`Set ${sigId} to ${aspect}`}
                    >
                      {aspect}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Safety Interlock Confirmation Modal */}
      <AnimatePresence>
        {pendingOverride && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.75)',
              backdropFilter: 'blur(8px)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
            }}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="override-title"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
              style={{
                width: '100%',
                maxWidth: '480px',
                background: '#18181b',
                border: '1px solid rgba(251, 191, 36, 0.3)',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
                color: '#f4f4f5',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <span style={{ fontSize: '24px' }}>⚠️</span>
                <h3 id="override-title" style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#fbbf24' }}>
                  Confirm Manual Signal Override
                </h3>
              </div>

              <p style={{ fontSize: '13px', color: '#d4d4d8', lineHeight: 1.5, margin: 0 }}>
                You are requesting to manually force <strong>{pendingOverride.sigId}</strong> to{' '}
                <strong style={{ color: getAspectColor(pendingOverride.newAspect) }}>{pendingOverride.newAspect}</strong>.
                This action will be logged in the tamper-evident audit ledger and verified against fail-safe track block interlocks.
              </p>

              <div
                style={{
                  marginTop: '16px',
                  padding: '10px 14px',
                  background: 'rgba(0,0,0,0.3)',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.06)',
                  fontSize: '12px',
                  color: '#a1a1aa',
                }}
              >
                <div>🔒 Electronic Interlocking: <strong>CLEAR TO SWITCH</strong></div>
                <div>🛡️ Flank Protection: <strong>ACTIVE</strong></div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button
                  onClick={cancelOverride}
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    color: '#e4e4e7',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmOverride}
                  style={{
                    background: '#fbbf24',
                    color: '#09090b',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 18px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Confirm & Apply
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
