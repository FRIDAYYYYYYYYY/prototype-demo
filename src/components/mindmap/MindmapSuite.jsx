import React, { useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'

import PriorityMatrixCard from './DecisionExplanation/PriorityMatrixCard.jsx'
import CostPenaltyEngine from './DecisionExplanation/CostPenaltyEngine.jsx'
import ExplainabilityModal from './DecisionExplanation/ExplainabilityModal.jsx'

import ManualOverrideDeck from './DispatcherControls/ManualOverrideDeck.jsx'
import EmergencyOperationsBar from './DispatcherControls/EmergencyOperationsBar.jsx'
import ScenarioInjector from './DispatcherControls/ScenarioInjector.jsx'
import DispatcherAuditLog from './DispatcherControls/DispatcherAuditLog.jsx'

import MareyStringDiagram from './Visualizations/MareyStringDiagram.jsx'
import TurnoutTopologyView from './Visualizations/TurnoutTopologyView.jsx'
import CongestionHeatmap from './Visualizations/CongestionHeatmap.jsx'

import MultiJunctionGrid from './Extensions/MultiJunctionGrid.jsx'
import GreenCorridorAnalytics from './Extensions/GreenCorridorAnalytics.jsx'
import SafetyAuditExporter from './Extensions/SafetyAuditExporter.jsx'

export default function MindmapSuite() {
  const prefersReducedMotion = useReducedMotion()
  const [activeLayer, setActiveLayer] = useState('layer1')

  const layers = [
    {
      id: 'layer1',
      title: '1. Decision Explanation',
      icon: '🧠',
      badge: 'CP-SAT Logic',
      description: 'Priority weight matrices, objective loss breakdown, and mathematical solver rationale.',
    },
    {
      id: 'layer2',
      title: '2. Dispatcher Controls',
      icon: '🕹️',
      badge: 'Human-in-the-Loop',
      description: 'Signal aspect overrides, corridor Master E-Stop, and chaotic fault injection.',
    },
    {
      id: 'layer3',
      title: '3. Advanced Visualizations',
      icon: '📊',
      badge: 'Kinematics & Marey',
      description: 'Time-distance Marey string diagrams, siding point geometries, and block density waves.',
    },
    {
      id: 'layer4',
      title: '4. Enterprise Extensions',
      icon: '🌐',
      badge: 'Network Scale',
      description: 'Multi-junction cascade grid, green regenerative energy metrics, and SHA-256 safety audit exporter.',
    },
  ]

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        width: '100%',
        margin: '0 auto',
      }}
      role="region"
      aria-label="RailGuard 4-Layer UI Architecture Showcase"
    >
      {/* Navigation Layer Pill Tabs */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '10px',
          background: 'rgba(24, 24, 27, 0.6)',
          padding: '8px',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(16px)',
        }}
        role="tablist"
      >
        {layers.map((layer) => {
          const isActive = activeLayer === layer.id
          return (
            <button
              key={layer.id}
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${layer.id}`}
              id={`tab-${layer.id}`}
              onClick={() => setActiveLayer(layer.id)}
              style={{
                background: isActive
                  ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.18) 0%, rgba(99, 102, 241, 0.18) 100%)'
                  : 'transparent',
                border: isActive ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid transparent',
                borderRadius: '12px',
                padding: '12px 14px',
                color: isActive ? '#f4f4f5' : '#a1a1aa',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                position: 'relative',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: isActive ? '#38bdf8' : '#e4e4e7' }}>
                  {layer.icon} {layer.title}
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    padding: '2px 6px',
                    borderRadius: '999px',
                    background: isActive ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.06)',
                    color: isActive ? '#38bdf8' : '#71717a',
                  }}
                >
                  {layer.badge}
                </span>
              </div>
              <span style={{ fontSize: '11px', color: '#71717a', lineHeight: 1.3 }}>
                {layer.description}
              </span>
            </button>
          )
        })}
      </div>

      {/* Layer Content Panels with Smooth Motion Transitions */}
      <AnimatePresence mode="wait">
        {activeLayer === 'layer1' && (
          <motion.div
            key="layer1"
            id="panel-layer1"
            role="tabpanel"
            aria-labelledby="tab-layer1"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.25 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
          >
            <PriorityMatrixCard />
            <CostPenaltyEngine />
            <ExplainabilityModal />
          </motion.div>
        )}

        {activeLayer === 'layer2' && (
          <motion.div
            key="layer2"
            id="panel-layer2"
            role="tabpanel"
            aria-labelledby="tab-layer2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.25 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
          >
            <ManualOverrideDeck />
            <EmergencyOperationsBar />
            <ScenarioInjector />
            <DispatcherAuditLog />
          </motion.div>
        )}

        {activeLayer === 'layer3' && (
          <motion.div
            key="layer3"
            id="panel-layer3"
            role="tabpanel"
            aria-labelledby="tab-layer3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.25 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
          >
            <MareyStringDiagram />
            <TurnoutTopologyView />
            <CongestionHeatmap />
          </motion.div>
        )}

        {activeLayer === 'layer4' && (
          <motion.div
            key="layer4"
            id="panel-layer4"
            role="tabpanel"
            aria-labelledby="tab-layer4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.25 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
          >
            <MultiJunctionGrid />
            <GreenCorridorAnalytics />
            <SafetyAuditExporter />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
