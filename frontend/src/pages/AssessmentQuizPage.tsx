import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { completeAssessment, startAssessment, submitAnswer } from '../services/assessmentService'
import { ApiError } from '../services/apiClient'
import { useGoalGraph } from '../hooks/useGoalGraph'
import ProgressBar from '../components/ProgressBar'
import ThemeToggle from '../components/ThemeToggle'
import type { StartAssessmentResponse } from '../types/api'
import '../styles/pages.css'

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']

function AssessmentQuizPage() {
  const { skillId } = useParams()
  const navigate = useNavigate()
  const { graph } = useGoalGraph() // only used to show the skill name

  const [session, setSession] = useState<StartAssessmentResponse | null>(null)
  const [index, setIndex] = useState(0) // current question
  const [selected, setSelected] = useState<number | null>(null) // chosen option id
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // React dev mode runs effects twice; this ref makes sure we start only ONE assessment
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true

    async function start() {
      try {
        setSession(await startAssessment(Number(skillId)))
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Cannot reach the server')
      } finally {
        setLoading(false)
      }
    }
    start()
  }, [skillId])

  // Save the answer, then go to the next question or finish the assessment
  async function handleSubmit() {
    if (!session || selected === null) return
    const question = session.questions[index]

    setSubmitting(true)
    setError(null)
    try {
      await submitAnswer(session.assessmentId, question.id, selected)

      if (index < session.questions.length - 1) {
        setIndex(index + 1)
        setSelected(null)
      } else {
        const result = await completeAssessment(session.assessmentId)
        // Pass the result to the results page through router state
        navigate('/assessment/results', { state: result, replace: true })
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Cannot reach the server')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <p className="muted quiz-page">Preparing your assessment...</p>

  if (!session) {
    return (
      <div className="quiz-page">
        <p className="form-error">{error ?? 'Could not start the assessment'}</p>
        <Link to="/assessment">Back to assessments</Link>
      </div>
    )
  }

  const total = session.questions.length
  const question = session.questions[index]
  const skillName = graph?.nodes.find((n) => n.id === session.skillId)?.name ?? 'Skill'

  return (
    <div className="quiz-page">
      <div className="quiz-head">
        <div>
          <p className="page-eyebrow">Skill assessment</p>
          <h1 className="page-title">{skillName}</h1>
        </div>
        <div className="quiz-count">
          <ThemeToggle showLabel={false} />
          <span className="muted">Question</span>
          <strong>
            {index + 1} / {total}
          </strong>
        </div>
      </div>

      <ProgressBar value={((index + 1) / total) * 100} />

      <div className="card quiz-card">
        <h2>{question.prompt}</h2>

        {question.options.map((option, i) => (
          <button
            key={option.id}
            type="button"
            className={`option ${selected === option.id ? 'selected' : ''}`}
            onClick={() => setSelected(option.id)}
          >
            <span className="option-letter">{LETTERS[i]}.</span>
            {option.text}
          </button>
        ))}
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="quiz-actions">
        <button className="btn btn-primary" onClick={handleSubmit} disabled={selected === null || submitting}>
          {submitting ? 'Saving...' : index === total - 1 ? 'Finish' : 'Submit Answer'}
        </button>
      </div>
    </div>
  )
}

export default AssessmentQuizPage