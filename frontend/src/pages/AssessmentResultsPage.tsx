import { Link, Navigate, useLocation } from 'react-router-dom'
import Logo from '../components/Logo'
import ProgressBar from '../components/ProgressBar'
import StatusBadge from '../components/StatusBadge'
import ThemeToggle from '../components/ThemeToggle'
import type { AssessmentResult } from '../services/assessmentService'
import '../styles/pages.css'
import '../styles/results.css'

// Concepts below this score are shown as weak
const WEAK_SCORE = 60

// Builds the sentence under the badge
function buildMessage(result: AssessmentResult, weakNames: string[]) {
  if (result.state === 'MASTERED') return 'Great work! You mastered this skill.'

  const focus = weakNames.length > 0 ? ` Focus on: ${weakNames.join(', ')}.` : ''

  if (result.finalScore === 0) {
    return `No correct answers this time, and that is fine: start with the basics and try again.${focus}`
  }
  if (result.finalScore < result.mastery) {
    return `This attempt scored lower than your best, so your mastery stays at ${result.mastery}%. The goal requires ${result.requiredMastery}%.${focus}`
  }
  return `Your mastery is ${result.mastery}%. The goal requires ${result.requiredMastery}%.${focus}`
}

function AssessmentResultsPage() {
  // The quiz page sends the result here; without it (e.g. direct URL) go back
  const result = useLocation().state as AssessmentResult | null
  if (!result) return <Navigate to="/assessment" replace />

  const concepts = result.concepts ?? []
  const weakNames = concepts.filter((c) => c.score < WEAK_SCORE).map((c) => c.name)

  return (
    <div className="quiz-page">
      <div className="quiz-head">
        <Logo />
        <ThemeToggle showLabel={false} />
      </div>

      <div className="card result-card">
        <p className="page-eyebrow">Assessment complete</p>
        <div className="result-score">{result.finalScore}%</div>
        <p className="muted">
          {result.correctAnswers} of {result.totalQuestions} answers correct. Harder questions count more.
        </p>

        <StatusBadge status={result.state} />
        <p>{buildMessage(result, weakNames)}</p>
        <p className="muted result-confidence">
          Confidence in this score: {Math.round(result.confidence * 100)}%
        </p>

        {concepts.length > 0 && (
          <div className="result-concepts">
            <h3>Results by concept</h3>
            {concepts.map((concept) => (
              <div key={concept.conceptId ?? concept.name} className="concept-row">
                <div className="concept-head">
                  <span className="concept-name">{concept.name}</span>
                  <span className={concept.score < WEAK_SCORE ? 'concept-score concept-weak' : 'concept-score'}>
                    {concept.score}%
                  </span>
                </div>
                <ProgressBar value={concept.score} tone={concept.score >= WEAK_SCORE ? 'mastered' : undefined} />
                <span className="muted concept-meta">
                  {concept.correct} of {concept.total} correct, {concept.weight}% of the skill
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="result-actions">
          <Link className="btn btn-primary" to="/skill-graph">
            View Skill Graph
          </Link>
          <Link className="btn btn-outline" to="/assessment">
            More assessments
          </Link>
        </div>
      </div>
    </div>
  )
}

export default AssessmentResultsPage