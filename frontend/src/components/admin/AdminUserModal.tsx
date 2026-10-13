import { useEffect, useState, type FormEvent } from 'react'
import { Send, Trash2 } from 'lucide-react'
import {
  getAdminUserDetail,
  sendAdminAdvice,
  type AdminUser,
  type AdminUserDetail,
} from '../../services/adminService'
import StatusBadge from '../StatusBadge'
import ProgressBar from '../ProgressBar'
import Modal from '../Modal'
import { getMessage } from './adminHelpers'

const MAX_ADVICE_LENGTH = 1000

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

// Window with everything about one user: progress per skill, recent tests, and the advice
// the admin wrote for them. The admin can write a new advice or start deleting the user here.
function AdminUserModal(props: {
  user: AdminUser // the table row, used for the title while the details load
  isSelf: boolean
  onClose: () => void
  onDelete: () => void
}) {
  const { user } = props
  const [detail, setDetail] = useState<AdminUserDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const data = await getAdminUserDetail(user.id)
        if (!cancelled) setDetail(data)
      } catch (err) {
        if (!cancelled) setError(getMessage(err))
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [user.id])

  async function handleSend(e: FormEvent) {
    e.preventDefault()
    if (!message.trim()) {
      setSendError('Write an advice first')
      return
    }
    setSending(true)
    setSendError(null)
    try {
      const created = await sendAdminAdvice(user.id, message)
      setDetail((current) => (current ? { ...current, advice: [created, ...current.advice] } : current))
      setMessage('')
    } catch (err) {
      setSendError(getMessage(err))
    } finally {
      setSending(false)
    }
  }

  const canDelete = !props.isSelf && user.role !== 'ADMIN'

  return (
    <Modal
      title={user.name}
      subtitle={user.email}
      size="lg"
      dismissOnOverlay
      onClose={props.onClose}
      footer={
        <>
          <button
            type="button"
            className="btn btn-outline btn-sm admin-danger"
            disabled={!canDelete}
            title={
              props.isSelf
                ? 'You cannot delete your own account'
                : user.role === 'ADMIN'
                  ? 'Change the role to USER first'
                  : undefined
            }
            onClick={props.onDelete}
          >
            <Trash2 size={14} /> Delete user
          </button>
          <button type="button" className="btn btn-outline btn-sm" onClick={props.onClose}>
            Close
          </button>
        </>
      }
    >
      {error && <p className="form-error">{error}</p>}
      {!detail && !error && <p className="muted">Loading...</p>}

      {detail && (
        <>
          <div className="admin-facts">
            <div>
              <span className="muted">Role</span>
              <strong>{detail.role}</strong>
            </div>
            <div>
              <span className="muted">Joined</span>
              <strong>{formatDate(detail.createdAt)}</strong>
            </div>
            <div>
              <span className="muted">Goal</span>
              <strong>{detail.currentGoal?.name ?? 'No goal yet'}</strong>
            </div>
            <div>
              <span className="muted">Weekly hours</span>
              <strong>{detail.weeklyHours ?? '—'}</strong>
            </div>
            <div>
              <span className="muted">Tests taken</span>
              <strong>{detail.assessmentsCompleted}</strong>
            </div>
          </div>

          {detail.summary ? (
            <section className="admin-section">
              <h3>Progress</h3>
              <ProgressBar value={detail.summary.percent} />
              <p className="muted">
                {detail.summary.percent}% of the goal · {detail.summary.masteredSkills} of{' '}
                {detail.summary.totalSkills} skills mastered · about {detail.summary.hoursRemaining} hours
                left
              </p>

              <table className="table admin-table-flat">
                <thead>
                  <tr>
                    <th>Skill</th>
                    <th>Status</th>
                    <th>Mastery</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.skills.map((skill) => (
                    <tr key={skill.id}>
                      <td>
                        {skill.name}
                        {skill.category && <div className="muted">{skill.category}</div>}
                      </td>
                      <td>
                        <StatusBadge status={skill.state} />
                      </td>
                      <td className="admin-mastery-cell">
                        <ProgressBar value={skill.mastery} tone={skill.state === 'MASTERED' ? 'mastered' : undefined} />
                        <span className="muted">
                          {skill.mastery}% of {skill.requiredMastery}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ) : (
            <p className="muted">This user has not chosen a goal yet, so there is no progress to show.</p>
          )}

          {detail.recentAssessments.length > 0 && (
            <section className="admin-section">
              <h3>Recent tests</h3>
              {detail.recentAssessments.map((item) => (
                <div className="skill-row-top" key={item.assessmentId}>
                  <span>
                    {item.skillName} <span className="muted">· {formatDate(item.completedAt)}</span>
                  </span>
                  <strong>{item.score}%</strong>
                </div>
              ))}
            </section>
          )}

          <section className="admin-section">
            <h3>Advice for {detail.name}</h3>
            <form onSubmit={handleSend}>
              {sendError && <p className="form-error">{sendError}</p>}
              <label className="field">
                <span>The user sees this on their dashboard</span>
                <textarea
                  className="input"
                  value={message}
                  maxLength={MAX_ADVICE_LENGTH}
                  placeholder="For example: Your Networking score is low. Finish the basics before moving on."
                  onChange={(e) => setMessage(e.target.value)}
                />
              </label>
              <div className="admin-advice-actions">
                <span className="muted">
                  {message.length} / {MAX_ADVICE_LENGTH}
                </span>
                <button type="submit" className="btn btn-primary btn-sm" disabled={sending}>
                  <Send size={14} /> {sending ? 'Sending...' : 'Send advice'}
                </button>
              </div>
            </form>

            {detail.advice.length === 0 ? (
              <p className="muted">No advice sent yet.</p>
            ) : (
              <ul className="admin-advice-list">
                {detail.advice.map((item) => (
                  <li key={item.id}>
                    <p>{item.message}</p>
                    <span className="muted">
                      {formatDate(item.createdAt)}
                      {item.adminName ? ` · ${item.adminName}` : ''} ·{' '}
                      {item.readAt ? 'read by the user' : 'not read yet'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </Modal>
  )
}

export default AdminUserModal