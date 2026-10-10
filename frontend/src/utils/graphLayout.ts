import dagre from '@dagrejs/dagre'
import type { Edge, Node } from '@xyflow/react'
import type { GraphResponse, SkillStatus } from '../types/api'

const NODE_SIZE = 88

// Data shown inside each circle
export type SkillNodeData = {
  name: string
  mastery: number
  state: SkillStatus
  recommended: boolean
}
export type SkillFlowNode = Node<SkillNodeData, 'skill'>

// Converts the API graph into React Flow nodes and edges.
// The backend sends no positions, so dagre computes a top-to-bottom layout.
export function buildFlowElements(
  graph: GraphResponse,
  recommendedId?: number
): { nodes: SkillFlowNode[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: 'TB', nodesep: 60, ranksep: 70 })

  graph.nodes.forEach((n) => g.setNode(String(n.id), { width: NODE_SIZE, height: NODE_SIZE }))
  graph.edges.forEach((e) => g.setEdge(String(e.source), String(e.target)))

  dagre.layout(g)

  const stateById = new Map(graph.nodes.map((n) => [n.id, n.userState]))

  const nodes: SkillFlowNode[] = graph.nodes.map((n) => {
    const pos = g.node(String(n.id))
    return {
      id: String(n.id),
      type: 'skill',
      // dagre returns the node center; React Flow expects the top-left corner
      position: { x: pos.x - NODE_SIZE / 2, y: pos.y - NODE_SIZE / 2 },
      data: {
        name: n.name,
        mastery: n.mastery,
        state: n.userState,
        recommended: n.id === recommendedId,
      },
    }
  })

  // Edges that lead to a locked skill are dashed
  const edges: Edge[] = graph.edges.map((e) => ({
    id: `${e.source}-${e.target}`,
    source: String(e.source),
    target: String(e.target),
    type: 'straight',
    style: {
      stroke: '#c7c9f5',
      strokeWidth: 2,
      strokeDasharray: stateById.get(e.target) === 'LOCKED' ? '6 6' : undefined,
    },
  }))

  return { nodes, edges }
}