import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch } from '../hooks/reduxHooks'
import { useSignOut } from '../hooks/useSignOut'
import { selectGoal } from '../features/goal/goalSlice'
import { getGoals, saveSelectedGoal } from '../services/goalService'
import { ApiError } from '../services/apiClient'
import type { Goal } from '../types/api'
import Logo from '../components/Logo'
import ThemeToggle from '../components/ThemeToggle'
import '../styles/pages.css'

function SelectGoalPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const signOut = useSignOut()

  const [goals, setGoals] = useState<Goal[]>([])
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
  }, [])

  // Save the chosen goal on the server, then in Redux, then go to the dashboard
  async function handleSelect(goal: Goal) {
    setError(null)
    try {
      await saveSelectedGoal(goal.id)
      dispatch(selectGoal(goal))
      navigate('/dashboard')
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
          <button className="btn btn-outline" onClick={signOut}>
            Sign out
          </button>
        </div>
      </div>

      <h1>Choose your career goal</h1>
      <p className="muted">SkillGraph maps exactly what you need to learn for each path.</p>

      {error && <p className="form-error">{error}</p>}
      {loading && <p className="muted">Loading goals...</p>}

      <div className="goal-grid">
        {goals.map((goal) => (
          <button key={goal.id} className="card goal-card" onClick={() => handleSelect(goal)}>
            <div className="goal-icon">{goal.name.charAt(0)}</div>
            <h3>{goal.name}</h3>
            <p className="muted">{goal.description}</p>
          </button>
        ))}
      </div>
    </div>
  )
}

export default SelectGoalPage