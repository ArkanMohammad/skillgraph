import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch } from '../hooks/reduxHooks'
import { selectGoal } from '../features/goal/goalSlice'
import { getGoals, saveSelectedGoal } from '../services/goalService'
import { ApiError } from '../services/apiClient'
import type { Goal } from '../types/api'
import LogoutButton from '../components/LogoutButton'

function SelectGoalPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

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

  if (loading) return <p>Loading goals...</p>

  return (
    <div>
      <h1>Select your career goal</h1>
      <LogoutButton />

      {error && <p>{error}</p>}

      <ul>
        {goals.map((goal) => (
          <li key={goal.id}>
            <h3>{goal.name}</h3>
            <p>{goal.description}</p>
            <button onClick={() => handleSelect(goal)}>Select</button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default SelectGoalPage