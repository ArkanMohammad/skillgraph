import { Link, Navigate, useLocation } from 'react-router-dom'
import Logo from '../components/Logo'
import StatusBadge from '../components/StatusBadge'
import ThemeToggle from '../components/ThemeToggle'
import type { CompleteAssessmentResponse } from '../types/api'
import '../styles/pages.css'

function AssessmentResultsPage() {
  // The quiz page sends the result here; without it (e.g. direct URL) go back
  const result = useLocation().state as CompleteAssessmentResponse | null
  if (!result) return <Navigate to="/assessment" replace />

  const mastered = result.state === 'MASTERED'

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
          {result.correctAnswers} of {result.totalQuestions} answers correct
        </p>

        <StatusBadge status={result.state} />
        <p>
          {mastered
            ? 'Great work! You mastered this skill.'
            : `Your mastery is ${result.mastery}%. The goal requires ${result.requiredMastery}%. Keep practicing and try again.`}
        </p>

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