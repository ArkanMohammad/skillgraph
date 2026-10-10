import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { completeAssessment, startAssessment, submitAnswer } from '../services/assessmentService'
import { ApiError } from '../services/apiClient'
import { useGoalGraph } from '../hooks/useGoalGraph'
import ProgressBar from '../components/ProgressBar'
import ThemeToggle from '../components/ThemeToggle'
import type { AssessmentQuestion } from '../types/api'
import '../styles/pages.css'

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']

// What we keep about the running assessment (the server decides every question)
type Session = {
  assessmentId: number
  skillId: number
  totalQuestions: number
}

function AssessmentQuizPage() {
  const { skillId } = useParams()
  const navigate = useNavigate()
  const { graph } = useGoalGraph() // only used to show the skill name

  const [session, setSession] = useState<Session | null>(null)
  const [question, setQuestion] = useState<AssessmentQuestion | null>(null) // question on screen
  const [answeredCount, setAnsweredCount] = useState(0) // how many questions are already answered
  const [selected, setSelected] = useState<number | null>(null) // chosen option id
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // React dev mode runs effects twice; this ref makes sure we start only ONE assessment
  const startedRef = useRef(false)

  // Scores the assessment and opens the results page
  async function finish(assessmentId: number) {
    const result = await completeAssessment(assessmentId)
    // Pass the result to the results page through router state
    navigate('/assessment/results', { state: result, replace: true })
  }

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true

    async function start() {
      try {
        const started = await startAssessment(Number(skillId))
        setSession({
          assessmentId: started.assessmentId,
          skillId: started.skillId,
          totalQuestions: started.totalQuestions,
        })
        setQuestion(started.question)
        setAnsweredCount(started.answeredCount)

        // A resumed assessment may already have all answers: just score it
        if (started.finished) {
          const result = await completeAssessment(started.assessmentId)
          navigate('/assessment/results', { state: result, replace: true })
        }
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Cannot reach the server')
      } finally {
        setLoading(false)
      }
    }
    start()
  }, [skillId, navigate])

  // Save the answer, then show the next question the server chose (or finish)
  async function handleSubmit() {
    if (!session || !question || selected === null) return

    setSubmitting(true)
    setError(null)
    try {
      const next = await submitAnswer(session.assessmentId, question.id, selected)

      if (next.finished || !next.question) {
        await finish(session.assessmentId)
      } else {
        setQuestion(next.question)
        setAnsweredCount(next.answeredCount)
        setSelected(null)
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Cannot reach the server')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <p className="muted quiz-page">Preparing your assessment...</p>

  if (!session || !question) {
    return (
      <div className="quiz-page">
        <p className="form-error">{error ?? 'Could not start the assessment'}</p>
        <Link to="/assessment">Back to assessments</Link>
      </div>
    )
  }

  const total = session.totalQuestions
  const current = answeredCount + 1 // number of the question on screen
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
            {current} / {total}
          </strong>
        </div>
      </div>

      <ProgressBar value={(current / total) * 100} />

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
          {submitting ? 'Saving...' : current === total ? 'Finish' : 'Submit Answer'}
        </button>
      </div>
    </div>
  )
}

export default AssessmentQuizPage