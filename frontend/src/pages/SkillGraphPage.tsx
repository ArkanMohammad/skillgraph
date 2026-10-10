import { useMemo } from 'react'
import { Navigate } from 'react-router-dom'
import { ReactFlow, Controls } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useGoalGraph } from '../hooks/useGoalGraph'
import { useTheme } from '../hooks/useTheme'
import { buildFlowElements } from '../utils/graphLayout'
import { pickNextSkill } from '../utils/nextSkill'
import SkillNode from '../components/SkillNode'
import '../styles/pages.css'

// Defined outside the component so React Flow does not re-create it on every render
const nodeTypes = { skill: SkillNode }

const LEGEND = [
  { label: 'Mastered', color: '#22c55e' },
  { label: 'Learning', color: '#6366f1' },
  { label: 'Ready', color: '#f59e0b' },
  { label: 'Locked', color: '#c4c8d4' },
  { label: 'Recommended', color: '#8b5cf6' },
]

function SkillGraphPage() {
  const { goal, graph, loading, error } = useGoalGraph()
  const { theme } = useTheme()

  // Recompute the layout only when the graph data changes
  const elements = useMemo(() => {
    if (!graph) return { nodes: [], edges: [] }
    return buildFlowElements(graph, pickNextSkill(graph.nodes)?.id)
  }, [graph])

  if (!goal) return <Navigate to="/select-goal" replace />
  if (loading) return <p className="muted">Loading graph...</p>
  if (error) return <p className="form-error">{error}</p>

  const skills = graph?.nodes ?? []
  const mastered = skills.filter((s) => s.userState === 'MASTERED').length

  return (
    <div>
      <div className="graph-header">
        <div>
          <h1 className="page-title">Skill Graph</h1>
          <p className="muted">
            {goal.name} — {mastered} of {skills.length} skills mastered
          </p>
        </div>

        <div className="legend">
          {LEGEND.map((item) => (
            <span key={item.label}>
              <span className="legend-dot" style={{ background: item.color }} />
              {item.label}
            </span>
          ))}
        </div>
      </div>

      {/* React Flow needs a container with a fixed height */}
      <div className="graph-box">
        <ReactFlow
          nodes={elements.nodes}
          edges={elements.edges}
          nodeTypes={nodeTypes}
          colorMode={theme}
          nodesDraggable={false}
          nodesConnectable={false}
          fitView
        >
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
    </div>
  )
}

export default SkillGraphPage