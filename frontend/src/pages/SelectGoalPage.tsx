import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../hooks/reduxHooks'
import { useSignOut } from '../hooks/useSignOut'
import { selectGoal } from '../features/goal/goalSlice'
import { getGoals, saveSelectedGoal } from '../services/goalService'
import { getGoalsProgress, type GoalProgress } from '../services/progressService'
import { ApiError } from '../services/apiClient'
import type { Goal } from '../types/api'
import Logo from '../components/Logo'
import ThemeToggle from '../components/ThemeToggle'
import '../styles/pages.css'
import '../styles/progress.css'
import { PATHS } from '../routes/paths'

function SelectGoalPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const signOut = useSignOut()
  const currentGoal = useAppSelector((state) => state.goal.selectedGoal)

  const [goals, setGoals] = useState<Goal[]>([])
  // Share of every goal the user already covers (skills are shared between goals)
  const [covered, setCovered] = useState<Map<number, GoalProgress>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load the goals once when the page opens
  useEffect(() => {
    async function loadGoals() {
      try {
        const data = await getGoals()
        setGoals(data.goals)
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Cannot reach the server')
      } finally {
        setLoading(false)
      }
    }
    loadGoals()

    // Optional extra: a failure here must not block choosing a goal
    getGoalsProgress()
      .then((data) => setCovered(new Map(data.goals.map((item) => [item.goalId, item]))))
      .catch(() => {})
  }, [])

  // Save the chosen goal on the server, then in Redux, then go to the dashboard
  async function handleSelect(goal: Goal) {
    setError(null)
    try {
      await saveSelectedGoal(goal.id)
      dispatch(selectGoal(goal))
      navigate(PATHS.dashboard)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Cannot reach the server')
    }
  }

  return (
    <div className="goal-page">
      <div className="goal-top">
        <Logo />
        <div className="goal-top-actions">
          <ThemeToggle showLabel={false} />
          {currentGoal && (
            <Link className="btn btn-outline" to={PATHS.dashboard}>
              Keep current goal
            </Link>
          )}
          <button className="btn btn-outline" onClick={signOut}>
            Sign out
          </button>
        </div>
      </div>

      <h1>{currentGoal ? 'Change your career goal' : 'Choose your career goal'}</h1>
      <p className="muted">
        {currentGoal
          ? 'Your skills and scores are kept. A new goal starts with everything you already know.'
          : 'SkillGraph maps exactly what you need to learn for each path.'}
      </p>

      {error && <p className="form-error">{error}</p>}
      {loading && <p className="muted">Loading goals...</p>}

      <div className="goal-grid">
        {goals.map((goal) => {
          const progress = covered.get(goal.id)
          const isCurrent = currentGoal?.id === goal.id
          return (
            <button
              key={goal.id}
              className={`card goal-card ${isCurrent ? 'goal-card-current' : ''}`}
              onClick={() => handleSelect(goal)}
            >
              <div className="goal-icon">{goal.name.charAt(0)}</div>
              <h3>
                {goal.name}
                {isCurrent && <span className="goal-current-tag">Current</span>}
              </h3>
              <p className="muted">{goal.description}</p>
              {progress && progress.percent > 0 && (
                <span className="goal-covered">{progress.percent}% already covered</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default SelectGoalPage