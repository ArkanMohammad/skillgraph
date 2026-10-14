import { useEffect, useState } from 'react'
import { getMyMentors, type MyMentors } from '../services/mentorService'

// Loads the mentors of the current goal.
// The mentor card is an extra, so a failure is not shown as an error: the card just stays hidden.
export function useMyMentors() {
  const [data, setData] = useState<MyMentors | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false // ignore the result if the page was left meanwhile

    async function load() {
      try {
        const result = await getMyMentors()
        if (!cancelled) setData(result)
      } catch {
        if (!cancelled) setData(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  return { data, loading }
}