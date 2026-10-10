import dagre from '@dagrejs/dagre'
import type { Node, Edge } from '@xyflow/react'
import type { GraphResponse, SkillStatus } from '../types/api'

const NODE_WIDTH = 180
const NODE_HEIGHT = 50

// Background color of each node by the user's skill state
const STATE_COLORS: Record<SkillStatus, string> = {
  LOCKED: '#9ca3af',
  READY: '#f59e0b',
  LEARNING: '#6366f1',
  PRACTICING: '#8b5cf6',
  ASSESSING: '#ec4899',
  MASTERED: '#22c55e',
}

// Converts the API graph into React Flow nodes and edges.
// The backend sends no positions, so dagre computes a left-to-right layout.
export function buildFlowElements(graph: GraphResponse): {
  nodes: Node[]
  edges: Edge[]
} {
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: 'LR', nodesep: 30, ranksep: 80 })

  graph.nodes.forEach((n) =>
    g.setNode(String(n.id), { width: NODE_WIDTH, height: NODE_HEIGHT })
  )
  graph.edges.forEach((e) => g.setEdge(String(e.source), String(e.target)))

  dagre.layout(g)

  const nodes: Node[] = graph.nodes.map((n) => {
    const pos = g.node(String(n.id))
    return {
      id: String(n.id),
      // dagre returns the node center; React Flow expects the top-left corner
      position: { x: pos.x - NODE_WIDTH / 2, y: pos.y - NODE_HEIGHT / 2 },
      data: { label: `${n.name} (${n.mastery}%)` },
      style: {
        width: NODE_WIDTH,
        background: STATE_COLORS[n.userState],
        color: '#fff',
        border: 'none',
      },
    }
  })

  const edges: Edge[] = graph.edges.map((e) => ({
    id: `${e.source}-${e.target}`,
    source: String(e.source),
    target: String(e.target),
    animated: true,
  }))

  return { nodes, edges }
}