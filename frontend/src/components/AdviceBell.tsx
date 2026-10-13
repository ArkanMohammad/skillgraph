import { useCallback, useEffect, useState } from 'react'
import { MessageSquareText } from 'lucide-react'
import { getMyAdvice, type AdviceItem } from '../services/adviceService'
import AdviceModal from './AdviceModal'
import '../styles/advice.css'

const REFRESH_MS = 60_000 // look for new advice once a minute

// Icon in the top bar with a red counter. A click opens the "Advice from admin" window.
// The advice is optional, so a failed load never breaks the page: the icon just shows no counter.
function AdviceBell() {
  const [advice, setAdvice] = useState<AdviceItem[]>([])
  const [unread, setUnread] = useState(0)
  const [open, setOpen] = useState(false)

  const load = useCallback(async () => {
    try {
      const data = await getMyAdvice()
      setAdvice(data.advice)
      setUnread(data.unread)
    } catch {
      // Keep the last known advice
    }
  }, [])

  // Load once, then again every minute and whenever the user comes back to the tab
  useEffect(() => {
    load()
    const timer = window.setInterval(load, REFRESH_MS)
    window.addEventListener('focus', load)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('focus', load)
    }
  }, [load])

  function openWindow() {
    load() // always show the latest messages
    setOpen(true)
  }

  return (
    <>
      <button
        type="button"
        className="advice-bell"
        onClick={openWindow}
        aria-label={unread > 0 ? `Advice from admin, ${unread} unread` : 'Advice from admin'}
        title="Advice from admin"
      >
        <MessageSquareText size={20} />
        {unread > 0 && <span className="advice-badge">{unread > 9 ? '9+' : unread}</span>}
      </button>

      {open && (
        <AdviceModal advice={advice} unread={unread} onChanged={load} onClose={() => setOpen(false)} />
      )}
    </>
  )
}

export default AdviceBell