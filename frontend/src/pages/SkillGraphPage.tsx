import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { ReactFlow, Background, Controls } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useAppSelector } from '../hooks/reduxHooks'
import { getGraph } from '../services/graphService'
import { ApiError } from '../services/apiClient'
import { buildFlowElements } from '../utils/graphLayout'
import type { GraphResponse } from '../types/api'

function SkillGraphPage() {
  const goal = useAppSelector((state) => state.goal.selectedGoal)

  const [graph, setGraph] = useState<GraphResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load the graph of the selected goal
  useEffect(() => {
    if (!goal) return
    async function loadGraph(goalId: number) {
      try {
        setGraph(await getGraph(goalId))
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Cannot reach the server')
      } finally {
        setLoading(false)
      }
    }
    loadGraph(goal.id)
  }, [goal])

  // Recompute the layout only when the graph data changes
  const elements = useMemo(
    () => (graph ? buildFlowElements(graph) : { nodes: [], edges: [] }),
    [graph]
  )

  if (!goal) return <Navigate to="/select-goal" replace />
  if (loading) return <p>Loading graph...</p>
  if (error) return <p>{error}</p>

  return (
    <div>
      <h1>Skill Graph - {goal.name}</h1>
      <Link to="/dashboard">Back to dashboard</Link>

      {/* React Flow needs a container with a fixed height */}
      <div style={{ height: '75vh', border: '1px solid #ccc' }}>
        <ReactFlow
          nodes={elements.nodes}
          edges={elements.edges}
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