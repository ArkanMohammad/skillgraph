import { useMemo } from 'react'
import { Navigate } from 'react-router-dom'
import { ReactFlow, Background, Controls } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useGoalGraph } from '../hooks/useGoalGraph'
import { useTheme } from '../hooks/useTheme'
import { buildFlowElements } from '../utils/graphLayout'
import '../styles/pages.css'

const LEGEND = [
  { label: 'Mastered', color: 'var(--mastered)' },
  { label: 'Learning', color: 'var(--learning)' },
  { label: 'Ready', color: 'var(--ready)' },
  { label: 'Locked', color: 'var(--locked)' },
]

function SkillGraphPage() {
  const { goal, graph, loading, error } = useGoalGraph()
  const { theme } = useTheme()

  // Recompute the layout only when the graph data changes
  const elements = useMemo(
    () => (graph ? buildFlowElements(graph) : { nodes: [], edges: [] }),
    [graph]
  )

  if (!goal) return <Navigate to="/select-goal" replace />
  if (loading) return <p className="muted">Loading graph...</p>
  if (error) return <p className="form-error">{error}</p>

  return (
    <div>
      <p className="page-eyebrow">Skill Graph</p>
      <h1 className="page-title">{goal.name}</h1>

      <div className="legend">
        {LEGEND.map((item) => (
          <span key={item.label}>
            <span className="legend-dot" style={{ background: item.color }} />
            {item.label}
          </span>
        ))}
      </div>

      {/* React Flow needs a container with a fixed height */}
      <div className="graph-box">
        <ReactFlow
          nodes={elements.nodes}
          edges={elements.edges}
          colorMode={theme}
          nodesDraggable={false}
          fitView
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  )
}

export default SkillGraphPage