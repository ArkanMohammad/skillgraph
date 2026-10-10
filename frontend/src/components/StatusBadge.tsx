import type { SkillStatus } from '../types/api'

// Maps every skill state to one of the four badge colors
const TONE: Record<SkillStatus, string> = {
  MASTERED: 'mastered',
  LEARNING: 'learning',
  PRACTICING: 'learning',
  ASSESSING: 'learning',
  READY: 'ready',
  LOCKED: 'locked',
}

function StatusBadge({ status }: { status: SkillStatus }) {
  const label = status.charAt(0) + status.slice(1).toLowerCase()
  return <span className={`badge badge-${TONE[status]}`}>{label}</span>
}

export default StatusBadge