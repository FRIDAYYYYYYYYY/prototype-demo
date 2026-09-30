import React, { useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'

export default function ExplainabilityModal() {
  const prefersReducedMotion = useReducedMotion()
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('tree') // tree, counterfactual, slack

  const constraints = [
    { id: 'C1', name: 'Mutual Exclusion (Safety Headway)', slack: '+12.4s', status: 'PASS', critical: true },
    { id: 'C2', name: 'Speed Profile Adherence (PSR ≤ 80 km/h)', slack: '+8.0 km/h', status: 'PASS', critical: false },
    { id: 'C3', name: 'Flank Protection / Siding Point Lock', slack: '0.0s (Exact)', status: 'LOCKED', critical: true },
    { id: 'C4', name: 'Signal Aspect Cascade (Green -> Amber -> Red)', slack: '+45.0m buffer', status: 'PASS', critical: true },
    { id: 'C5', name: 'Station Dwell Margin (Min 120s)', slack: '+34.0s', status: 'PASS', critical: false },
  ]

  return (
    <div
      className="card"
      role="region"
      aria-label="Explainability Inspector"
      style={{
        background: 'linear-gradient(135deg, rgba(24, 24, 27, 0.75) 0%, rgba(9, 9, 11, 0.9) 100%)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#a78bfa', fontSize: '18px' }}>🔍</span>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#f4f4f5' }}>
              Decision Explainability Inspector
            </h3>
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#a1a1aa' }}>
            Formal mathematical proof and counterfactual "What-If" solver audit.
          </p>
        </div>

        <button
          onClick={() => setIsOpen(true)}
          style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.35)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
          aria-haspopup="dialog"
        >
          <span>Open Full Solver Rationale</span>
          <span>↗</span>
        </button>
      </div>

      <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontSize: '11px', color: '#71717a' }}>CP-SAT Decision Rationale</div>
          <div style={{ fontSize: '13px', color: '#e4e4e7', fontWeight: 600, marginTop: '2px' }}>
            Delay Minimization + Passenger Weight
          </div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontSize: '11px', color: '#71717a' }}>Safety Margin Slack</div>
          <div style={{ fontSize: '13px', color: '#34d399', fontWeight: 600, marginTop: '2px' }}>
            5/5 Constraints Feasible (+12.4s margin)
          </div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontSize: '11px', color: '#71717a' }}>Deterministic Seed</div>
          <div style={{ fontSize: '13px', color: '#38bdf8', fontFamily: 'monospace', marginTop: '2px' }}>
            SHA-256 Verified
          </div>
        </div>
      </div>

      {/* Modal Dialog */}
      <AnimatePresence>
        {isOpen && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(10px)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="explainability-title"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
              style={{
                width: '100%',
                maxWidth: '720px',
                background: '#09090b',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '16px',
                padding: '28px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
                color: '#f4f4f5',
                maxHeight: '90vh',
                overflowY: 'auto',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h2 id="explainability-title" style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>
                    Solver Explainability & Verification Audit
                  </h2>
                  <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#a1a1aa' }}>
                    Google OR-Tools CP-SAT formulation breakdown for Junction 14 Dispatch.
                  </p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: 'none',
                    color: '#f4f4f5',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  aria-label="Close dialog"
                >
                  ✕
                </button>
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px', marginBottom: '20px' }}>
                {[
                  { id: 'tree', label: 'Decision Tree Rationale' },
                  { id: 'counterfactual', label: 'Counterfactual "What-If"' },
                  { id: 'slack', label: 'Constraint Slack Analysis' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    style={{
                      background: activeTab === t.id ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                      color: activeTab === t.id ? '#818cf8' : '#a1a1aa',
                      border: activeTab === t.id ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
                      borderRadius: '6px',
                      padding: '6px 14px',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {activeTab === 'tree' && (
                <div style={{ fontSize: '13px', lineHeight: 1.6 }}>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontWeight: 600, color: '#38bdf8', marginBottom: '6px' }}>
                      Step 1: Conflict Zone Identification
                    </div>
                    <p style={{ margin: 0, color: '#d4d4d8' }}>
                      Sensors S1 and S2 both recorded inbound trains (T-101 at 72 km/h, F-902 at 45 km/h) projected to occupy Block B-14 within a 34-second overlapping window.
                    </p>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)', marginTop: '12px' }}>
                    <div style={{ fontWeight: 600, color: '#34d399', marginBottom: '6px' }}>
                      Step 2: Objective Cost Evaluation
                    </div>
                    <p style={{ margin: 0, color: '#d4d4d8' }}>
                      The CP-SAT model evaluated <code>min ∑ (W_i × Delay_i + DownstreamPenalty_i)</code>. Giving T-101 right-of-way yields total objective cost ₹1,420 vs ₹5,300 for reverse priority.
                    </p>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)', marginTop: '12px' }}>
                    <div style={{ fontWeight: 600, color: '#a78bfa', marginBottom: '6px' }}>
                      Step 3: Flank Siding Confirmation
                    </div>
                    <p style={{ margin: 0, color: '#d4d4d8' }}>
                      Freight F-902 safely routed to Loop Siding 2 with sufficient decelerating track distance (650m available vs 420m required stopping distance).
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'counterfactual' && (
                <div style={{ fontSize: '13px' }}>
                  <p style={{ color: '#a1a1aa', marginTop: 0 }}>
                    Comparison between Recommended Dispatch vs Alternative "What-If" Dispatch:
                  </p>
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '12px', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', color: '#71717a' }}>
                        <th style={{ padding: '8px' }}>Metric</th>
                        <th style={{ padding: '8px', color: '#34d399' }}>Recommended (Case 2)</th>
                        <th style={{ padding: '8px', color: '#f87171' }}>What-If: Hold Express (Case 3)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '8px', color: '#d4d4d8' }}>Express Delay</td>
                        <td style={{ padding: '8px', color: '#34d399', fontWeight: 600 }}>0.0 min</td>
                        <td style={{ padding: '8px', color: '#f87171' }}>+4.8 min</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '8px', color: '#d4d4d8' }}>Freight Delay</td>
                        <td style={{ padding: '8px', color: '#fbbf24' }}>+2.3 min (Siding)</td>
                        <td style={{ padding: '8px', color: '#34d399' }}>0.0 min</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '8px', color: '#d4d4d8' }}>Cumulative Passenger Delay</td>
                        <td style={{ padding: '8px', color: '#34d399', fontWeight: 600 }}>0 pax-hrs</td>
                        <td style={{ padding: '8px', color: '#f87171', fontWeight: 600 }}>89.6 pax-hrs</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '8px', color: '#d4d4d8' }}>Downstream Network Ripple</td>
                        <td style={{ padding: '8px', color: '#34d399' }}>0 Block Conflicts</td>
                        <td style={{ padding: '8px', color: '#f87171' }}>2 Cascading Delays (J16)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'slack' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {constraints.map((c) => (
                    <div
                      key={c.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px 16px',
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: '8px',
                        border: '1px solid rgba(255,255,255,0.06)',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#f4f4f5' }}>
                          <span style={{ color: '#818cf8', marginRight: '6px' }}>[{c.id}]</span>
                          {c.name}
                        </div>
                        <div style={{ fontSize: '11px', color: '#a1a1aa', marginTop: '2px' }}>
                          Constraint Margin Slack: <strong style={{ color: '#38bdf8' }}>{c.slack}</strong>
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: c.status === 'PASS' ? 'rgba(52, 211, 153, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                          color: c.status === 'PASS' ? '#34d399' : '#818cf8',
                        }}
                      >
                        {c.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setIsOpen(false)}
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    color: '#f4f4f5',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 18px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Close Audit
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
