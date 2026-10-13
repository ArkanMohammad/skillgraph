import { useState } from 'react'
import { Check, CheckCheck } from 'lucide-react'
import { markAdviceRead, markAllAdviceRead, type AdviceItem } from '../services/adviceService'
import { ApiError } from '../services/apiClient'
import Modal from './Modal'
import '../styles/advice.css'

type Filter = 'all' | 'unread'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

// Window "Advice from admin": the messages an admin wrote for the user.
// Unread messages come first. The user can mark one message or all of them as read.
function AdviceModal(props: {
  advice: AdviceItem[]
  unread: number
  onChanged: () => void // asks the parent to load the advice again
  onClose: () => void
}) {
  const [filter, setFilter] = useState<Filter>('all')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Unread first, then the newest
  const sorted = [...props.advice].sort((a, b) => {
    if ((a.readAt === null) !== (b.readAt === null)) return a.readAt === null ? -1 : 1
    return b.createdAt.localeCompare(a.createdAt)
  })
  const shown = filter === 'unread' ? sorted.filter((item) => item.readAt === null) : sorted

  async function run(action: () => Promise<unknown>) {
    setBusy(true)
    setError(null)
    try {
      await action()
      props.onChanged()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Cannot reach the server')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      title="Advice from admin"
      subtitle={props.unread > 0 ? `${props.unread} unread` : 'You have read everything'}
      dismissOnOverlay
      onClose={props.onClose}
      footer={
        <>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            disabled={busy || props.unread === 0}
            onClick={() => run(markAllAdviceRead)}
          >
            <CheckCheck size={14} /> Mark all as read
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={props.onClose}>
            Close
          </button>
        </>
      }
    >
      <div className="pills" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={filter === 'all'}
          className={`pill ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={filter === 'unread'}
          className={`pill ${filter === 'unread' ? 'active' : ''}`}
          onClick={() => setFilter('unread')}
        >
          Unread
        </button>
      </div>

      {error && <p className="form-error">{error}</p>}

      {shown.length === 0 ? (
        <p className="muted">
          {props.advice.length === 0
            ? 'No advice yet. When an admin writes advice for you, it appears here.'
            : 'No unread advice.'}
        </p>
      ) : (
        <ul className="advice-list">
          {shown.map((item) => (
            <li key={item.id} className={item.readAt ? '' : 'advice-unread'}>
              <p>{item.message}</p>
              <div className="advice-meta">
                <span className="muted">
                  {item.adminName ?? 'Admin'} · {formatDate(item.createdAt)}
                </span>
                {item.readAt ? (
                  <span className="advice-read">
                    <Check size={14} /> Read
                  </span>
                ) : (
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    disabled={busy}
                    onClick={() => run(() => markAdviceRead(item.id))}
                  >
                    Mark as read
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  )
}

export default AdviceModal