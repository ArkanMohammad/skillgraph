import { useEffect, useState } from 'react'
import { getNextRecommendation, type Recommendation } from '../services/recommendationService'
import { ApiError } from '../services/apiClient'

// Loads the Next Best Skill of the current goal from the backend.
// The page reloads it every time it opens, so a finished assessment is always reflected.
export function useRecommendation() {
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false // ignore the result if the page was left meanwhile

    async function load() {
      try {
        const data = await getNextRecommendation()
        if (!cancelled) setRecommendation(data)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Cannot reach the server')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  return { recommendation, loading, error }
}