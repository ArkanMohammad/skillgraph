import { useEffect, useState } from 'react'
import { useAppSelector } from './reduxHooks'
import { getGraph } from '../services/graphService'
import { ApiError } from '../services/apiClient'
import type { GraphResponse } from '../types/api'

// Loads the skill graph of the currently selected goal
export function useGoalGraph() {
  const goal = useAppSelector((state) => state.goal.selectedGoal)

  const [graph, setGraph] = useState<GraphResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!goal) return
    let cancelled = false // ignore the result if the page was left meanwhile

    async function load(goalId: number) {
      try {
        const data = await getGraph(goalId)
        if (!cancelled) setGraph(data)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Cannot reach the server')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load(goal.id)
    return () => {
      cancelled = true
    }
  }, [goal])

  return { goal, graph, loading, error }
}