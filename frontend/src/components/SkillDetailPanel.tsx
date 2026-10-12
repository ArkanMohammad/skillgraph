import { Link } from 'react-router-dom'
import { X } from 'lucide-react'
import StatusBadge from './StatusBadge'
import ProgressBar from './ProgressBar'
import type { GraphNode, GraphResponse } from '../types/api'
import type { Recommendation } from '../services/recommendationService'
import { PATHS } from '../routes/paths'
import '../styles/skill-panel.css'

// Side panel of the skill graph: everything about one skill and why it is (or is not) recommended.
// It only reads data the backend already sent; no calculation of the recommendation happens here.
function SkillDetailPanel(props: {
  skillId: number
  graph: GraphResponse
  recommendation: Recommendation | null
  onSelect: (skillId: number) => void
  onClose: () => void
}) {
  const { graph, recommendation } = props
  const byId = new Map(graph.nodes.map((node) => [node.id, node]))
  const node = byId.get(props.skillId)
  if (!node) return null

  // Skills that must come first, and the skills this one opens
  const prerequisites = graph.edges
    .filter((edge) => edge.target === node.id)
    .map((edge) => byId.get(edge.source))
    .filter((item): item is GraphNode => Boolean(item))
  const unlocks = graph.edges
    .filter((edge) => edge.source === node.id)
    .map((edge) => byId.get(edge.target))
    .filter((item): item is GraphNode => Boolean(item))
  const missing = prerequisites.filter((item) => item.userState !== 'MASTERED')

  // Only READY skills are candidates, so a locked or mastered skill has no explanation
  const candidate = recommendation?.candidates.find((item) => item.skillId === node.id)
  const isNext = recommendation?.next?.skillId === node.id
  const locked = node.userState === 'LOCKED'

  function renderLinks(items: GraphNode[]) {
    return (
      <div className="skill-panel-links">
        {items.map((item) => (
          <button
            type="button"
            key={item.id}
            className="skill-panel-link"
            onClick={() => props.onSelect(item.id)}
          >
            <span>{item.name}</span>
            <StatusBadge status={item.userState} />
          </button>
        ))}
      </div>
    )
  }

  return (
    <aside className="skill-panel" aria-label={`Details of ${node.name}`}>
      <div className="skill-panel-top">
        <div>
          <h3>{node.name}</h3>
          <StatusBadge status={node.userState} />
          {node.category && <span className="muted"> · {node.category}</span>}
        </div>
        <button type="button" className="skill-panel-close" onClick={props.onClose} aria-label="Close details">
          <X size={18} />
        </button>
      </div>

      <h4>Your mastery</h4>
      <ProgressBar value={node.mastery} tone={node.userState === 'MASTERED' ? 'mastered' : undefined} />
      <p className="muted">
        {node.mastery}% of the required {node.requiredMastery}%
        {node.confidence > 0 ? ` · confidence ${node.confidence}%` : ''}
      </p>

      {candidate && (
        <>
          <h4>{isNext ? 'Why this is your next skill' : 'About this skill'}</h4>
          <div className="skill-panel-why">
            <p>{candidate.explanation.summary}</p>
            <ul className="skill-panel-reasons">
              {candidate.explanation.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
              <li>about {candidate.estimatedHours} hours of study</li>
            </ul>
          </div>
        </>
      )}

      {locked && missing.length > 0 && (
        <>
          <h4>Master these first</h4>
          {renderLinks(missing)}
        </>
      )}

      {prerequisites.length > 0 && !locked && (
        <>
          <h4>Builds on</h4>
          {renderLinks(prerequisites)}
        </>
      )}

      {unlocks.length > 0 && (
        <>
          <h4>Opens the way to</h4>
          {renderLinks(unlocks)}
        </>
      )}

      {!locked && (
        <Link className="btn btn-primary" to={PATHS.assessmentQuiz(node.id)}>
          {node.userState === 'MASTERED' ? 'Retake test' : 'Start test'}
        </Link>
      )}
    </aside>
  )
}

export default SkillDetailPanel