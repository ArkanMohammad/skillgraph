import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAppDispatch } from '../hooks/reduxHooks'
import {
  completeAssessment as markAssessmentCompleted,
  resetAssessment,
  submitAnswer as storeAnswer,
} from '../features/assessment/assessmentSlice'
import {
  completeAssessment,
  startAssessment,
  submitAnswer,
  type SubmitAnswerResult,
} from '../services/assessmentService'
import { ApiError } from '../services/apiClient'
import { useGoalGraph } from '../hooks/useGoalGraph'
import Modal from '../components/Modal'
import ProgressBar from '../components/ProgressBar'
import ThemeToggle from '../components/ThemeToggle'
import type { AssessmentQuestion } from '../types/api'
import '../styles/pages.css'
import '../styles/results.css'
import { PATHS } from '../routes/paths'

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
  const dispatch = useAppDispatch()
  const { graph } = useGoalGraph() // only used to show the skill name

  const [session, setSession] = useState<Session | null>(null)
  const [question, setQuestion] = useState<AssessmentQuestion | null>(null) // question on screen
  const [answeredCount, setAnsweredCount] = useState(0) // how many questions are already answered
  const [selected, setSelected] = useState<number | null>(null) // chosen option id
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmExit, setConfirmExit] = useState(false) // opens the "leave the assessment?" window
  // After an answer is saved we show green/red first; the next question waits for "Next"
  const [feedback, setFeedback] = useState<SubmitAnswerResult | null>(null)

  // React dev mode runs effects twice; this ref makes sure we start only ONE assessment
  const startedRef = useRef(false)

  // Scores the assessment and opens the results page
  async function finish(assessmentId: number) {
    const result = await completeAssessment(assessmentId)
    dispatch(markAssessmentCompleted())
    // Pass the result to the results page through router state
    navigate(PATHS.assessmentResults, { state: result, replace: true })
  }

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true
    dispatch(resetAssessment()) // a new quiz always starts from a clean store

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
          dispatch(markAssessmentCompleted())
          navigate(PATHS.assessmentResults, { state: result, replace: true })
        }
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Cannot reach the server')
      } finally {
        setLoading(false)
      }
    }
    start()
  }, [skillId, navigate, dispatch])

  // Save the answer and show if it was right (green) or wrong (red)
  async function handleSubmit() {
    if (!session || !question || selected === null) return

    setSubmitting(true)
    setError(null)
    try {
      const result = await submitAnswer(session.assessmentId, question.id, selected)
      dispatch(storeAnswer({ questionId: question.id, selectedAnswer: String(selected) }))
      setFeedback(result)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Cannot reach the server')
    } finally {
      setSubmitting(false)
    }
  }

  // After the user saw the result: go to the next question the server chose (or finish)
  async function handleNext() {
    if (!session || !feedback) return

    if (feedback.finished || !feedback.question) {
      setSubmitting(true)
      setError(null)
      try {
        await finish(session.assessmentId)
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Cannot reach the server')
        setSubmitting(false)
      }
      return
    }

    setQuestion(feedback.question)
    setAnsweredCount(feedback.answeredCount)
    setSelected(null)
    setFeedback(null)
  }

  // CSS class of one option: green for the right one, red for a wrong choice
  function optionClass(optionId: number) {
    if (feedback) {
      if (optionId === feedback.correctOptionId) return 'option option-correct'
      if (optionId === selected) return 'option option-wrong'
      return 'option option-dim'
    }
    return `option ${selected === optionId ? 'selected' : ''}`
  }

  if (loading) return <p className="muted quiz-page">Preparing your assessment...</p>

  if (!session || !question) {
    return (
      <div className="quiz-page">
        <p className="form-error">{error ?? 'Could not start the assessment'}</p>
        <Link to={PATHS.assessments}>Back to assessments</Link>
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
            className={optionClass(option.id)}
            disabled={feedback !== null}
            onClick={() => setSelected(option.id)}
          >
            <span className="option-letter">{LETTERS[i]}.</span>
            {option.text}
          </button>
        ))}
      </div>

      {feedback && (
        <p className={feedback.isCorrect ? 'quiz-feedback quiz-feedback-correct' : 'quiz-feedback quiz-feedback-wrong'}>
          {feedback.isCorrect ? 'Correct!' : 'Not quite. The right answer is shown in green.'}
        </p>
      )}

      {error && <p className="form-error">{error}</p>}

      <div className="quiz-actions quiz-actions-split">
        <button
          className="btn btn-outline"
          type="button"
          onClick={() => setConfirmExit(true)}
          disabled={submitting}
        >
          Exit assessment
        </button>
        {feedback ? (
          <button className="btn btn-primary" onClick={handleNext} disabled={submitting}>
            {feedback.finished ? 'See results' : 'Next question'}
          </button>
        ) : (
          <button className="btn btn-primary" onClick={handleSubmit} disabled={selected === null || submitting}>
            {submitting ? 'Saving...' : 'Submit Answer'}
          </button>
        )}
      </div>

      {confirmExit && (
        <Modal
          title="Leave this assessment?"
          dismissOnOverlay
          onClose={() => setConfirmExit(false)}
          footer={
            <>
              <button className="btn btn-outline" type="button" onClick={() => setConfirmExit(false)}>
                Stay
              </button>
              <button className="btn btn-primary" type="button" onClick={() => navigate(PATHS.dashboard)}>
                Leave
              </button>
            </>
          }
        >
          <p>Your answers so far are saved, and you can continue later.</p>
        </Modal>
      )}
    </div>
  )
}

export default AssessmentQuizPage