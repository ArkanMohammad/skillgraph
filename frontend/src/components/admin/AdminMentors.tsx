import { useEffect, useState } from 'react'
import { Plus, UserPlus, X } from 'lucide-react'
import { getGoals } from '../../services/goalService'
import {
  assignAdminMentor,
  getAdminMentors,
  removeAdminMentor,
  type AdminMentor,
} from '../../services/adminService'
import type { Goal } from '../../types/api'
import ErrorState from '../ErrorState'
import MentorForm from './MentorForm'
import { getMessage } from './adminHelpers'
import '../../styles/mentors.css'
import '../../styles/mentor-form.css'

type Notice = { type: 'ok' | 'error'; text: string }

// Tab to add mentors and to choose which goals each mentor looks after.
// A mentor is either a brand new account made here (Add mentor)
// or an existing user whose role an admin changed to MENTOR (Overview tab).
function AdminMentors() {
  const [mentors, setMentors] = useState<AdminMentor[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [picked, setPicked] = useState<Record<string, string>>({}) // mentor id -> goal chosen in the list
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null) // the tab could not load
  const [notice, setNotice] = useState<Notice | null>(null) // result of the last change
  const [busy, setBusy] = useState(false)
  const [adding, setAdding] = useState(false) // the "Add mentor" window is open
  const [attempt, setAttempt] = useState(0) // bumped to fetch again

  useEffect(() => {
    let cancelled = false // ignore the result if the tab was left meanwhile

    async function load() {
      try {
        const [mentorData, goalData] = await Promise.all([getAdminMentors(), getGoals()])
        if (cancelled) return
        setMentors(mentorData.mentors)
        setGoals(goalData.goals)
      } catch (err) {
        if (!cancelled) setError(getMessage(err))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [attempt])

  function retry() {
    setLoading(true)
    setError(null)
    setAttempt((n) => n + 1)
  }

  // Runs one change, shows its result and loads the table again
  async function run(action: () => Promise<string>) {
    setBusy(true)
    setNotice(null)
    try {
      const text = await action()
      setNotice({ type: 'ok', text })
      setAttempt((n) => n + 1)
    } catch (err) {
      setNotice({ type: 'error', text: getMessage(err) })
    } finally {
      setBusy(false)
    }
  }

  async function handleAssign(mentor: AdminMentor) {
    const goal = goals.find((item) => String(item.id) === picked[mentor.id])
    if (!goal) {
      setNotice({ type: 'error', text: 'Choose a goal first' })
      return
    }
    await run(async () => {
      await assignAdminMentor(goal.id, mentor.id)
      setPicked((current) => ({ ...current, [mentor.id]: '' }))
      return `${mentor.name} now looks after ${goal.name}`
    })
  }

  async function handleRemove(mentor: AdminMentor, goal: { id: number; name: string }) {
    await run(async () => {
      await removeAdminMentor(goal.id, mentor.id)
      return `${mentor.name} no longer looks after ${goal.name}`
    })
  }

  if (loading) return <p className="muted">Loading mentors...</p>
  if (error) {
    return <ErrorState title="Could not load mentors" message={error} onRetry={retry} />
  }

  return (
    <div>
      <div className="card admin-panel">
        <div className="mentors-head">
          <div>
            <h3>Mentors</h3>
            <p className="muted">
              A mentor is a person from the field who helps the learners of a goal. Add a new mentor here, or change
              the role of an existing user to MENTOR in the Overview tab. Then choose the goals below. A goal can have
              several mentors.
            </p>
          </div>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => setAdding(true)}>
            <UserPlus size={14} /> Add mentor
          </button>
        </div>
      </div>

      {notice && (
        <p className={notice.type === 'ok' ? 'admin-notice admin-notice-ok' : 'form-error'}>{notice.text}</p>
      )}

      <div className="card card-flush">
        {mentors.length === 0 ? (
          <p className="muted admin-flush-message">No mentors yet. Use "Add mentor" to create the first one.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Mentor</th>
                <th>Goals</th>
                <th>Add a goal</th>
              </tr>
            </thead>
            <tbody>
              {mentors.map((mentor) => {
                const freeGoals = goals.filter((goal) => !mentor.goals.some((item) => item.id === goal.id))
                return (
                  <tr key={mentor.id}>
                    <td>
                      <div>{mentor.name}</div>
                      <div className="muted">{mentor.email}</div>
                    </td>
                    <td>
                      {mentor.goals.length === 0 ? (
                        <span className="muted">No goal yet</span>
                      ) : (
                        <div className="mentor-chips">
                          {mentor.goals.map((goal) => (
                            <span className="mentor-chip" key={goal.id}>
                              {goal.name}
                              <button
                                type="button"
                                className="mentor-chip-remove"
                                aria-label={`Remove ${goal.name} from ${mentor.name}`}
                                disabled={busy}
                                onClick={() => handleRemove(mentor, goal)}
                              >
                                <X size={12} />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td>
                      {freeGoals.length === 0 ? (
                        <span className="muted">Every goal is assigned</span>
                      ) : (
                        <div className="mentor-assign">
                          <select
                            className="admin-role-select"
                            value={picked[mentor.id] ?? ''}
                            onChange={(e) => setPicked((current) => ({ ...current, [mentor.id]: e.target.value }))}
                          >
                            <option value="">Choose a goal</option>
                            {freeGoals.map((goal) => (
                              <option key={goal.id} value={goal.id}>
                                {goal.name}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            disabled={busy}
                            onClick={() => handleAssign(mentor)}
                          >
                            <Plus size={14} /> Assign
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {adding && (
        <MentorForm
          goals={goals}
          onClose={() => setAdding(false)}
          onCreated={(mentor) => {
            setNotice({ type: 'ok', text: `${mentor.name} is now a mentor` })
            setAttempt((n) => n + 1)
          }}
        />
      )}
    </div>
  )
}

export default AdminMentors