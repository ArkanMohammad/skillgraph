import { useEffect, useState } from 'react'
import { getReviewQueue, type ReviewQueue } from '../services/reviewService'

// Loads the knowledge decay data of the current goal.
// The review card is an extra, so a failure is not shown as an error: the card just stays hidden.
export function useReview() {
  const [queue, setQueue] = useState<ReviewQueue | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false // ignore the result if the page was left meanwhile

    async function load() {
      try {
        const data = await getReviewQueue()
        if (!cancelled) setQueue(data)
      } catch {
        if (!cancelled) setQueue(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  return { queue, loading }
}