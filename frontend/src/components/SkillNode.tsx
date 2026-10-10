import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { SkillStatus } from '../types/api'
import type { SkillFlowNode } from '../utils/graphLayout'

// Border and text color of a circle by skill state
const STATE_COLORS: Record<SkillStatus, string> = {
  LOCKED: '#c4c8d4',
  READY: '#f59e0b',
  LEARNING: '#6366f1',
  PRACTICING: '#6366f1',
  ASSESSING: '#6366f1',
  MASTERED: '#22c55e',
}

// One skill drawn as a circle (custom React Flow node)
function SkillNode({ data }: NodeProps<SkillFlowNode>) {
  const color = data.recommended ? '#8b5cf6' : STATE_COLORS[data.state]
  const locked = data.state === 'LOCKED'

  return (
    <div
      className={`skill-node ${data.recommended ? 'recommended' : ''}`}
      style={{ borderColor: color, color: locked ? '#b0b5c3' : color }}
    >
      {/* Invisible handles: React Flow needs them to attach the edges */}
      <Handle type="target" position={Position.Top} className="skill-handle" />
      <span className="skill-node-name">{data.name}</span>
      <span className="skill-node-pct">{data.mastery}%</span>
      <Handle type="source" position={Position.Bottom} className="skill-handle" />
    </div>
  )
}

export default SkillNode