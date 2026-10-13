import { useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { ReactFlow, Controls } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useGoalGraph } from '../hooks/useGoalGraph'
import { useRecommendation } from '../hooks/useRecommendation'
import { useTheme } from '../hooks/useTheme'
import { buildFlowElements } from '../utils/graphLayout'
import SkillNode from '../components/SkillNode'
import SkillDetailPanel from '../components/SkillDetailPanel'
import WhySkillModal from '../components/WhySkillModal'
import ErrorState from '../components/ErrorState'
import '../styles/pages.css'
import '../styles/skill-panel.css'
import { PATHS } from '../routes/paths'

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
  const { goal, graph, loading, error, reload } = useGoalGraph()
  const { recommendation } = useRecommendation()
  const { theme } = useTheme()
  // The skill whose details are open in the side panel
  const [selectedId, setSelectedId] = useState<number | null>(null)
  // Whether the full "Why this skill?" window is open
  const [whyOpen, setWhyOpen] = useState(false)
  const recommendedId = recommendation?.next?.skillId

  // Recompute the layout only when the graph data or the recommendation changes
  const elements = useMemo(() => {
    if (!graph) return { nodes: [], edges: [] }
    return buildFlowElements(graph, recommendedId)
  }, [graph, recommendedId])

  if (!goal) return <Navigate to={PATHS.selectGoal} replace />
  if (loading) return <p className="muted">Loading graph...</p>
  if (error) return <ErrorState title="Could not load the skill graph" message={error} onRetry={reload} />

  const skills = graph?.nodes ?? []
  const mastered = skills.filter((s) => s.userState === 'MASTERED').length
  const next = recommendation?.next ?? null
  const panelOpen = selectedId !== null && skills.some((s) => s.id === selectedId)

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

      {next && (
        <div className="graph-recommend">
          <span>
            Recommended next: <strong>{next.skillName}</strong>
          </span>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setWhyOpen(true)}>
            Why this skill?
          </button>
        </div>
      )}

      <div className={`graph-layout ${panelOpen ? 'with-panel' : ''}`}>
        {/* React Flow needs a container with a fixed height */}
        <div className="graph-box">
          <ReactFlow
            nodes={elements.nodes}
            edges={elements.edges}
            nodeTypes={nodeTypes}
            colorMode={theme}
            nodesDraggable={false}
            nodesConnectable={false}
            onNodeClick={(_, node) => setSelectedId(Number(node.id))}
            onPaneClick={() => setSelectedId(null)}
            fitView
          >
            <Controls showInteractive={false} />
          </ReactFlow>
        </div>

        {panelOpen && graph && selectedId !== null && (
          <SkillDetailPanel
            skillId={selectedId}
            graph={graph}
            recommendation={recommendation}
            onSelect={setSelectedId}
            onClose={() => setSelectedId(null)}
          />
        )}
      </div>

      {whyOpen && next && graph && (
        <WhySkillModal
          skill={next}
          candidates={recommendation?.candidates ?? []}
          graph={graph}
          onClose={() => setWhyOpen(false)}
        />
      )}
    </div>
  )
}

export default SkillGraphPage