import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAppSelector } from '../hooks/reduxHooks'
import { getGraph } from '../services/graphService'
import { ApiError } from '../services/apiClient'
import type { GraphResponse } from '../types/api'
import LogoutButton from '../components/LogoutButton'

function DashboardPage() {
  // The goal chosen on the Select Goal page
  const goal = useAppSelector((state) => state.goal.selectedGoal)

  const [graph, setGraph] = useState<GraphResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load the skills of the selected goal
  useEffect(() => {
    if (!goal) return
    async function loadGraph(goalId: number) {
      try {
        setGraph(await getGraph(goalId))
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Cannot reach the server')
      } finally {
        setLoading(false)
      }
    }
    loadGraph(goal.id)
  }, [goal])

  // No goal selected yet: send the user to choose one
  if (!goal) return <Navigate to="/select-goal" replace />

  if (loading) return <p>Loading dashboard...</p>
  if (error) return <p>{error}</p>

  const skills = graph?.nodes ?? []
  const mastered = skills.filter((s) => s.userState === 'MASTERED').length

  return (
    <div>
      <h1>{goal.name}</h1>
      <LogoutButton />
      <p>
        Progress: {mastered} / {skills.length} skills mastered
      </p>

      <Link to="/skill-graph">Open Skill Graph</Link>{' | '}
      <Link to="/select-goal">Change goal</Link>

      <h2>Skills</h2>
      <ul>
        {skills.map((skill) => (
          <li key={skill.id}>
            {skill.name} - {skill.userState} - mastery {skill.mastery}%
          </li>
        ))}
      </ul>
    </div>
  )
}

export default DashboardPage