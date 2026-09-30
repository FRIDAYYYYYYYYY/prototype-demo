import React, { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

export default function MareyStringDiagram() {
  const prefersReducedMotion = useReducedMotion()
  const [highlightTrain, setHighlightTrain] = useState(null)

  return (
    <div
      className="card"
      role="region"
      aria-label="Marey Time-Distance Diagram"
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
            <span style={{ fontSize: '18px' }}>📈</span>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#f4f4f5' }}>
              Time-Distance String Diagram (Marey Chart)
            </h3>
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#a1a1aa' }}>
            Interactive trajectory slopes, headway separation buffers, and conflict diamond detection.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#38bdf8' }}>
            <span style={{ width: '12px', height: '3px', background: '#38bdf8', borderRadius: '2px' }} />
            <span>T-101 (Express)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#fbbf24' }}>
            <span style={{ width: '12px', height: '3px', background: '#fbbf24', borderRadius: '2px' }} />
            <span>F-902 (Freight)</span>
          </div>
        </div>
      </div>

      {/* SVG Time-Distance Plot */}
      <div
        style={{
          background: 'rgba(0, 0, 0, 0.4)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          padding: '16px',
          position: 'relative',
        }}
      >
        <svg viewBox="0 0 800 320" style={{ width: '100%', height: 'auto', display: 'block' }}>
          {/* Grid lines */}
          <line x1="80" y1="40" x2="760" y2="40" stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
          <line x1="80" y1="120" x2="760" y2="120" stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
          <line x1="80" y1="200" x2="760" y2="200" stroke="rgba(255,255,255,0.1)" />
          <line x1="80" y1="280" x2="760" y2="280" stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />

          {/* Time Verticals */}
          <line x1="80" y1="20" x2="80" y2="280" stroke="rgba(255,255,255,0.15)" />
          <line x1="250" y1="20" x2="250" y2="280" stroke="rgba(255,255,255,0.05)" />
          <line x1="420" y1="20" x2="420" y2="280" stroke="rgba(255,255,255,0.05)" />
          <line x1="590" y1="20" x2="590" y2="280" stroke="rgba(255,255,255,0.05)" />
          <line x1="760" y1="20" x2="760" y2="280" stroke="rgba(255,255,255,0.15)" />

          {/* Location Axis Labels (Y-axis) */}
          <text x="70" y="45" fill="#71717a" fontSize="11" textAnchor="end">Station A (KM 0)</text>
          <text x="70" y="125" fill="#71717a" fontSize="11" textAnchor="end">Block 12 (KM 4)</text>
          <text x="70" y="205" fill="#38bdf8" fontSize="11" fontWeight="bold" textAnchor="end">Junction 14 (KM 8)</text>
          <text x="70" y="285" fill="#71717a" fontSize="11" textAnchor="end">Station B (KM 12)</text>

          {/* Time Axis Labels (X-axis) */}
          <text x="80" y="305" fill="#71717a" fontSize="11" textAnchor="middle">18:30</text>
          <text x="250" y="305" fill="#71717a" fontSize="11" textAnchor="middle">18:35</text>
          <text x="420" y="305" fill="#71717a" fontSize="11" textAnchor="middle">18:40</text>
          <text x="590" y="305" fill="#71717a" fontSize="11" textAnchor="middle">18:45</text>
          <text x="760" y="305" fill="#71717a" fontSize="11" textAnchor="middle">18:50</text>

          {/* Conflict Diamond Zone */}
          <rect
            x="360"
            y="180"
            width="120"
            height="40"
            fill="rgba(239, 68, 68, 0.12)"
            stroke="rgba(239, 68, 68, 0.35)"
            strokeDasharray="3 3"
            rx="4"
          />
          <text x="420" y="174" fill="#f87171" fontSize="10" textAnchor="middle" fontWeight="bold">
            Projected Conflict Diamond
          </text>

          {/* Freight F-902 Trajectory (Steeper slope = slower speed + siding dwell plateau) */}
          <motion.path
            d="M 100 40 L 220 120 L 320 200 L 460 200 L 640 280"
            fill="none"
            stroke="#fbbf24"
            strokeWidth={highlightTrain === 'freight' ? 4 : 2.5}
            strokeDasharray={highlightTrain === 'freight' ? 'none' : 'none'}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: prefersReducedMotion ? 0 : 1.2, ease: 'easeInOut' }}
            style={{ cursor: 'pointer' }}
            onMouseEnter={() => setHighlightTrain('freight')}
            onMouseLeave={() => setHighlightTrain(null)}
          />

          {/* Express T-101 Trajectory (Gentler slope = high velocity, uninterrupted through J14) */}
          <motion.path
            d="M 180 40 L 310 120 L 440 200 L 570 280"
            fill="none"
            stroke="#38bdf8"
            strokeWidth={highlightTrain === 'express' ? 4 : 3}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: prefersReducedMotion ? 0 : 1, ease: 'easeInOut' }}
            style={{ cursor: 'pointer' }}
            onMouseEnter={() => setHighlightTrain('express')}
            onMouseLeave={() => setHighlightTrain(null)}
          />

          {/* Highlight Marker Nodes */}
          <circle cx="440" cy="200" r="5" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.5" />
          <text x="450" y="195" fill="#38bdf8" fontSize="10" fontWeight="bold">T-101 Clears J14 (18:41:10)</text>

          <circle cx="320" cy="200" r="5" fill="#fbbf24" stroke="#ffffff" strokeWidth="1.5" />
          <text x="310" y="218" fill="#fbbf24" fontSize="10" textAnchor="end" fontWeight="bold">F-902 Enters Siding (18:37:30)</text>
        </svg>

        <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#a1a1aa' }}>
          <span>💡 <em>Hover over trajectories to isolate trains</em></span>
          <span>Headway Buffer Margin: <strong style={{ color: '#34d399' }}>+3 min 40s Separation</strong></span>
        </div>
      </div>
    </div>
  )
}
