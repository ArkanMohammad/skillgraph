import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink, X } from 'lucide-react'
import StatusBadge from './StatusBadge'
import ProgressBar from './ProgressBar'
import type { GraphNode, GraphResponse } from '../types/api'
import type { FactorScores, RankedSkill } from '../services/recommendationService'
import { getLearningResources, getStudyTips } from '../utils/learningResources'
import { PATHS } from '../routes/paths'
import '../styles/why-modal.css'

// Name and weight (percent) of each factor in the utility score
const FACTORS: { key: keyof FactorScores; label: string; weight: number }[] = [
  { key: 'goalImpact', label: 'Importance for your goal', weight: 30 },
  { key: 'readiness', label: 'How prepared you are', weight: 25 },
  { key: 'unlockPotential', label: 'Skills it opens', weight: 20 },
  { key: 'gapPriority', label: 'Gap still to close', weight: 15 },
  { key: 'timeEfficiency', label: 'Time efficiency', weight: 10 },
]

// Full-screen window that explains why a skill is recommended and how to study it.
// It only shows data the backend already calculated.
function WhySkillModal(props: {
  skill: RankedSkill
  candidates: RankedSkill[]
  graph: GraphResponse
  onClose: () => void
}) {
  const { skill, candidates, graph, onClose } = props
  const closeRef = useRef<HTMLButtonElement>(null)

  // Close with Escape, lock the page scroll while open, and focus the close button
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [onClose])

  const byId = new Map(graph.nodes.map((node) => [node.id, node]))
  const node = byId.get(skill.skillId)
  const prerequisites = graph.edges
    .filter((edge) => edge.target === skill.skillId)
    .map((edge) => byId.get(edge.source))
    .filter((item): item is GraphNode => Boolean(item))
  const unlocks = graph.edges
    .filter((edge) => edge.source === skill.skillId)
    .map((edge) => byId.get(edge.target))
    .filter((item): item is GraphNode => Boolean(item))

  const runnerUp = candidates.find((item) => item.skillId !== skill.skillId)
  const topCandidates = candidates.slice(0, 4)
  const topScore = Math.max(...topCandidates.map((item) => item.utilityScore), 1)

  return (
    <div className="why-overlay" onClick={onClose}>
      <div
        className="why-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="why-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="why-header">
          <div>
            <p className="why-eyebrow">Why this skill?</p>
            <h2 id="why-title">{skill.skillName}</h2>
            <div className="why-meta">
              {node && <StatusBadge status={node.userState} />}
              {skill.category && <span className="muted">{skill.category}</span>}
              <span className="muted">about {skill.estimatedHours} hours</span>
            </div>
          </div>
          <button ref={closeRef} type="button" className="why-close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </header>

        <div className="why-body">
          <section className="why-section why-summary">
            <p>{skill.explanation.summary}</p>
            <ul>
              {skill.explanation.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </section>

          <section className="why-section">
            <h3>Your progress</h3>
            <ProgressBar value={skill.currentMastery} />
            <p className="muted">
              {skill.currentMastery}% of the required {skill.requiredMastery}% (gap: {skill.gap}%)
            </p>
          </section>

          <section className="why-section">
            <h3>How the score is built</h3>
            <p className="muted">Total score: {skill.utilityScore.toFixed(1)} points. Each factor is weighted.</p>
            <div className="why-factors">
              {FACTORS.map((factor) => (
                <div key={factor.key} className="why-factor">
                  <div className="why-factor-top">
                    <span>
                      {factor.label} <span className="muted">({factor.weight}%)</span>
                    </span>
                    <strong>+{skill.contributions[factor.key].toFixed(1)}</strong>
                  </div>
                  <ProgressBar value={skill.factors[factor.key]} />
                </div>
              ))}
            </div>
          </section>

          {topCandidates.length > 1 && (
            <section className="why-section">
              <h3>Compared with your other ready skills</h3>
              {runnerUp && skill.explanation.margin !== null && (
                <p className="muted">
                  It scores {skill.explanation.margin.toFixed(1)} points higher than {runnerUp.skillName}.
                </p>
              )}
              <div className="why-compare">
                {topCandidates.map((item) => (
                  <div key={item.skillId} className={`why-compare-row ${item.skillId === skill.skillId ? 'current' : ''}`}>
                    <span>{item.skillName}</span>
                    <div className="why-compare-bar">
                      <span style={{ width: `${(item.utilityScore / topScore) * 100}%` }} />
                    </div>
                    <strong>{item.utilityScore.toFixed(1)}</strong>
                  </div>
                ))}
              </div>
            </section>
          )}

          {(prerequisites.length > 0 || unlocks.length > 0) && (
            <section className="why-section why-two-cols">
              {prerequisites.length > 0 && (
                <div>
                  <h3>Builds on</h3>
                  <div className="why-chips">
                    {prerequisites.map((item) => (
                      <span key={item.id} className="why-chip">
                        {item.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {unlocks.length > 0 && (
                <div>
                  <h3>Opens the way to</h3>
                  <div className="why-chips">
                    {unlocks.map((item) => (
                      <span key={item.id} className="why-chip">
                        {item.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          <section className="why-section">
            <h3>Where to learn it</h3>
            <div className="why-resources">
              {getLearningResources(skill.skillName).map((resource) => (
                <a key={resource.label} href={resource.url} target="_blank" rel="noopener noreferrer" className="why-resource">
                  <span>
                    <strong>{resource.label}</strong>
                    <span className="muted">{resource.description}</span>
                  </span>
                  <ExternalLink size={16} />
                </a>
              ))}
            </div>
          </section>

          <section className="why-section">
            <h3>Study tips</h3>
            <ul className="why-tips">
              {getStudyTips(skill.estimatedHours, skill.currentMastery).map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </section>
        </div>

        <footer className="why-footer">
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Close
          </button>
          <Link className="btn btn-primary" to={PATHS.assessmentQuiz(skill.skillId)}>
            Start test
          </Link>
        </footer>
      </div>
    </div>
  )
}

export default WhySkillModal