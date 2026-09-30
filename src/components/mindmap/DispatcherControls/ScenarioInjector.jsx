import React, { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

export default function ScenarioInjector() {
  const prefersReducedMotion = useReducedMotion()
  const [activeScenario, setActiveScenario] = useState(null)
  const [logs, setLogs] = useState([])

  const scenarios = [
    {
      id: 'ghost_sensor',
      name: 'Ghost Sensor Pulse (Fault Injection)',
      icon: '👻',
      color: '#f87171',
      description: 'Injects spurious pulse on Sensor S2 to test debounce filtering and fail-safe block locking.',
      expectedResult: 'Debounce filter suppresses noise (<100ms); interlock holds steady state.',
    },
    {
      id: 'station_delay',
      name: 'Late Station Departure (+3 min)',
      icon: '⏱️',
      color: '#fbbf24',
      description: 'Simulates heavy passenger boarding causing T-101 departure variance at Station Alpha.',
      expectedResult: 'CP-SAT re-optimizes corridor schedule dynamically in 3.8ms.',
    },
    {
      id: 'low_adhesion',
      name: 'Wet Rail / Low Friction Adhesion',
      icon: '🌧️',
      color: '#38bdf8',
      description: 'Reduces wheel-rail braking coefficient from μ=0.15 to μ=0.08, expanding braking distances.',
      expectedResult: 'Safety buffer expands from 150m to 280m; amber aspect displayed early.',
    },
  ]

  const triggerScenario = (scenario) => {
    setActiveScenario(scenario.id)
    const timestamp = new Date().toLocaleTimeString()
    setLogs((prev) => [
      { time: timestamp, name: scenario.name, status: 'INJECTED', result: scenario.expectedResult },
      ...prev.slice(0, 4),
    ])

    setTimeout(() => {
      setActiveScenario(null)
    }, 4000)
  }

  return (
    <div
      className="card"
      role="region"
      aria-label="Scenario Stress Injector"
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
            <span style={{ fontSize: '18px' }}>🧪</span>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#f4f4f5' }}>
              Scenario Stress & Chaos Injector
            </h3>
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#a1a1aa' }}>
            Simulate real-world operational anomalies to validate solver resilience and fail-safe interlocks.
          </p>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '14px',
          marginBottom: '20px',
        }}
      >
        {scenarios.map((sc) => {
          const isTriggered = activeScenario === sc.id
          return (
            <motion.div
              key={sc.id}
              whileHover={{ y: -2 }}
              style={{
                background: isTriggered ? `${sc.color}15` : 'rgba(255, 255, 255, 0.03)',
                border: `1px solid ${isTriggered ? sc.color : 'rgba(255, 255, 255, 0.06)'}`,
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '12px',
                transition: 'all 0.2s',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '18px' }}>{sc.icon}</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#fafafa' }}>{sc.name}</span>
                </div>
                <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#a1a1aa', lineHeight: 1.4 }}>
                  {sc.description}
                </p>
              </div>

              <button
                onClick={() => triggerScenario(sc)}
                disabled={activeScenario !== null}
                style={{
                  background: isTriggered ? sc.color : 'rgba(255, 255, 255, 0.06)',
                  color: isTriggered ? '#09090b' : '#f4f4f5',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: activeScenario !== null ? 'not-allowed' : 'pointer',
                  transition: 'background 0.2s',
                }}
                aria-label={`Inject scenario: ${sc.name}`}
              >
                {isTriggered ? 'Simulating Anomaly...' : 'Inject Anomaly'}
              </button>
            </motion.div>
          )
        })}
      </div>

      {logs.length > 0 && (
        <div
          style={{
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '10px',
            padding: '12px 16px',
            border: '1px solid rgba(255,255,255,0.05)',
            fontSize: '12px',
          }}
        >
          <div style={{ fontWeight: 600, color: '#a1a1aa', marginBottom: '8px' }}>Recent Chaos Injections:</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {logs.map((log, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', color: '#d4d4d8', gap: '12px' }}>
                <span>
                  <strong style={{ color: '#71717a' }}>[{log.time}]</strong> {log.name}
                </span>
                <span style={{ color: '#34d399', fontSize: '11px' }}>{log.result}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
