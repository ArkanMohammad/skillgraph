import { useState, type FormEvent } from 'react'
import { Check, Copy, Dices } from 'lucide-react'
import { MENTOR_LIMITS, createAdminMentor } from '../../services/adminMentorService'
import type { AdminMentor } from '../../services/adminService'
import type { Goal } from '../../types/api'
import Modal from '../Modal'
import { getMessage } from './adminHelpers'
import '../../styles/admin.css'
import '../../styles/mentor-form.css'

// No 0, O, 1, I or l, so a password is easy to read aloud and to type
const PASSWORD_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'

// A random first password of 12 characters (uses the secure random numbers of the browser)
function makePassword() {
  const numbers = crypto.getRandomValues(new Uint32Array(12))
  return Array.from(numbers, (n) => PASSWORD_ALPHABET[n % PASSWORD_ALPHABET.length]).join('')
}

// Window to create a brand new account with the role MENTOR.
// After saving, the same window shows the login details once, so the admin can pass them on.
function MentorForm(props: {
  goals: Goal[]
  onCreated: (mentor: AdminMentor) => void // the parent loads the mentors table again
  onClose: () => void
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState(() => makePassword())
  const [goalIds, setGoalIds] = useState<number[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [created, setCreated] = useState<{ email: string; password: string } | null>(null)
  const [copied, setCopied] = useState(false)

  function toggleGoal(id: number) {
    setGoalIds((list) => (list.includes(id) ? list.filter((item) => item !== id) : [...list, id]))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!name.trim()) return setError('Enter the name of the mentor')
    if (!email.trim()) return setError('Enter the email of the mentor')
    if (password.length < MENTOR_LIMITS.passwordMin) {
      return setError(`The password needs at least ${MENTOR_LIMITS.passwordMin} characters`)
    }

    setSaving(true)
    try {
      const data = await createAdminMentor({ name, email, password, goalIds })
      setCreated({ email: data.mentor.email, password })
      props.onCreated(data.mentor)
    } catch (err) {
      setError(getMessage(err))
    } finally {
      setSaving(false)
    }
  }

  async function copyDetails() {
    if (!created) return
    try {
      await navigator.clipboard.writeText(`Email: ${created.email}\nPassword: ${created.password}`)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2500)
    } catch {
      setError('The browser did not allow copying. Select the text and copy it by hand.')
    }
  }

  // Second step: the account exists
  if (created) {
    return (
      <Modal
        title="Mentor created"
        onClose={props.onClose}
        footer={
          <>
            <button type="button" className="btn btn-outline btn-sm" onClick={copyDetails}>
              {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy login details'}
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={props.onClose}>
              Done
            </button>
          </>
        }
      >
        {error && <p className="form-error">{error}</p>}
        <p className="muted">
          Give these login details to the mentor. The password is not shown again, but the mentor can change it in
          the profile page.
        </p>
        <div className="mentor-created">
          <div>
            <span>Email: </span>
            {created.email}
          </div>
          <div>
            <span>Password: </span>
            {created.password}
          </div>
        </div>
      </Modal>
    )
  }

  return (
    <Modal
      title="Add mentor"
      subtitle="Creates a new account with the role MENTOR"
      onClose={props.onClose}
      footer={
        <>
          <button type="button" className="btn btn-outline btn-sm" onClick={props.onClose}>
            Cancel
          </button>
          <button type="submit" form="mentor-form" className="btn btn-primary btn-sm" disabled={saving}>
            {saving ? 'Creating...' : 'Create mentor'}
          </button>
        </>
      }
    >
      <form id="mentor-form" onSubmit={handleSubmit}>
        {error && <p className="form-error">{error}</p>}

        <label className="field">
          <span>Name</span>
          <input
            className="input"
            value={name}
            maxLength={MENTOR_LIMITS.nameMax}
            onChange={(e) => setName(e.target.value)}
          />
        </label>

        <label className="field">
          <span>Email</span>
          <input
            className="input"
            type="email"
            value={email}
            autoComplete="off"
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>

        <label className="field">
          <span>First password</span>
          <div className="mentor-form-password">
            <input
              className="input"
              value={password}
              maxLength={MENTOR_LIMITS.passwordMax}
              autoComplete="off"
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setPassword(makePassword())}>
              <Dices size={14} /> Generate
            </button>
          </div>
        </label>

        <div className="mentor-form-goals">
          <p className="muted">Goals this mentor looks after (optional, you can change them later)</p>
          {props.goals.length === 0 ? (
            <p className="muted">There are no goals yet.</p>
          ) : (
            <div className="admin-check-grid">
              {props.goals.map((goal) => (
                <label key={goal.id} className="admin-check">
                  <input type="checkbox" checked={goalIds.includes(goal.id)} onChange={() => toggleGoal(goal.id)} />
                  {goal.name}
                </label>
              ))}
            </div>
          )}
        </div>
      </form>
    </Modal>
  )
}

export default MentorForm