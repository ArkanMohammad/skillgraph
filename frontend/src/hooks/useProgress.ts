import { useEffect, useState } from 'react'
import { getProgress, type ProgressOverview } from '../services/progressService'
import { ApiError } from '../services/apiClient'

// Loads the progress of the current goal (reloaded every time a page using it opens)
export function useProgress() {
  const [progress, setProgress] = useState<ProgressOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false // ignore the result if the page was left meanwhile

    async function load() {
      try {
        const data = await getProgress()
        if (!cancelled) setProgress(data)
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

  return { progress, loading, error }
}