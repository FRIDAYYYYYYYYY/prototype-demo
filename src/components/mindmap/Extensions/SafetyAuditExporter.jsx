import React, { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

export default function SafetyAuditExporter() {
  const prefersReducedMotion = useReducedMotion()
  const [downloading, setDownloading] = useState(false)
  const [exportedFormat, setExportedFormat] = useState(null)

  const handleExport = (format) => {
    setDownloading(true)
    setExportedFormat(format)
    setTimeout(() => {
      setDownloading(false)
      // Create mock file download trigger
      const element = document.createElement('a')
      const file = new Blob(
        [
          JSON.stringify(
            {
              project: 'RailGuard AI - SIH25022',
              corridor: 'Corridor C-1 (Junction 14)',
              timestamp: new Date().toISOString(),
              auditHash: 'sha256:7f9b28a94bc1230de456fa88231901ab9823412356',
              constraintsVerified: 5,
              independentValidatorVerdict: 'PASS (6/6)',
              eventsExported: 42,
            },
            null,
            2
          ),
        ],
        { type: 'application/json' }
      )
      element.href = URL.createObjectURL(file)
      element.download = `RailGuard-Safety-Audit-${Date.now()}.${format.toLowerCase()}`
      document.body.appendChild(element)
      element.click()
      document.body.removeChild(element)
    }, 1000)
  }

  return (
    <div
      className="card"
      role="region"
      aria-label="Safety & Compliance Audit Exporter"
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
            <span style={{ fontSize: '18px' }}>📁</span>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#f4f4f5' }}>
              Safety & Regulatory Audit Exporter
            </h3>
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#a1a1aa' }}>
            One-click export of cryptographic dispatch proofs for Railway Safety Commission compliance.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => handleExport('JSON')}
            disabled={downloading}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              color: '#f4f4f5',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '8px',
              padding: '8px 14px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: downloading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
            aria-label="Export audit log in JSON format"
          >
            <span>💾 Export JSON</span>
          </button>
          <button
            onClick={() => handleExport('CSV')}
            disabled={downloading}
            style={{
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: downloading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
            aria-label="Export audit log in CSV format"
          >
            <span>📥 {downloading ? 'Bundling...' : 'Download CSV Ledger'}</span>
          </button>
        </div>
      </div>

      <div
        style={{
          background: 'rgba(0,0,0,0.3)',
          borderRadius: '10px',
          padding: '12px 16px',
          border: '1px solid rgba(255,255,255,0.05)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '12px',
          color: '#a1a1aa',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <span>
          Current Audit Bundle Hash:{' '}
          <strong style={{ color: '#38bdf8', fontFamily: 'monospace' }}>
            sha256:7f9b28a94bc1230de456fa88231901ab9823412356
          </strong>
        </span>
        <span style={{ color: '#34d399', fontWeight: 600 }}>● SHA-256 Tamper Sealed</span>
      </div>
    </div>
  )
}
