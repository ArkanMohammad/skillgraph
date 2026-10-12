import { useEffect, useState } from 'react'
import { useAppDispatch } from './reduxHooks'
import { clearRecommendation, setNextBestSkill } from '../features/recommendation/recommendationSlice'
import { getNextRecommendation, type Recommendation } from '../services/recommendationService'
import { ApiError } from '../services/apiClient'

// Loads the Next Best Skill of the current goal from the backend.
// The page reloads it every time it opens, so a finished assessment is always reflected.
export function useRecommendation() {
  const dispatch = useAppDispatch()
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0) // bumped by reload() to fetch again

  useEffect(() => {
    let cancelled = false // ignore the result if the page was left meanwhile

    async function load() {
      try {
        const data = await getNextRecommendation()
        if (!cancelled) {
          setRecommendation(data)
          // Keep the Next Best Skill in the store for the other screens
          if (data.next) {
            dispatch(
              setNextBestSkill({
                skillId: data.next.skillId,
                name: data.next.skillName,
                score: data.next.utilityScore,
                explanation: data.next.explanation.summary,
              })
            )
          } else {
            dispatch(clearRecommendation())
          }
        }
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
  }, [dispatch, attempt])

  // Try again after a failure (or refresh on demand)
  function reload() {
    setLoading(true)
    setError(null)
    setAttempt((n) => n + 1)
  }

  return { recommendation, loading, error, reload }
}