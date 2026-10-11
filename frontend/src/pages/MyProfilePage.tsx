import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../hooks/reduxHooks'
import { logout } from '../features/auth/authSlice'
import { clearGoal } from '../features/goal/goalSlice'
import { changePassword, deleteAccount } from '../services/authService'
import { ApiError } from '../services/apiClient'
import { PATHS } from '../routes/paths'
import '../styles/pages.css'
import '../styles/my-profile.css'

// Builds the avatar letters from the user's name (e.g. "Jordan Lee" -> "JL")
function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')
}

// Turns any thrown error into a message for the screen
function getMessage(err: unknown) {
  return err instanceof ApiError ? err.message : 'Cannot reach the server'
}

// Which form of the Account card is open
type Panel = 'none' | 'password' | 'delete'

// Shows the account information and learning details of the logged-in user
function MyProfilePage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const user = useAppSelector((state) => state.auth.user)
  const goal = useAppSelector((state) => state.goal.selectedGoal)

  const name = user?.name ?? ''
  const email = user?.email ?? ''

  const [panel, setPanel] = useState<Panel>('none')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [deletePassword, setDeletePassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Opens one form and clears everything typed before
  function openPanel(next: Panel) {
    setPanel(panel === next ? 'none' : next)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setDeletePassword('')
    setError(null)
    setSuccess(null)
  }

  async function handleChangePassword(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSuccess(null)

    if (newPassword !== confirmPassword) {
      setError('The new passwords do not match')
      return
    }

    setSaving(true)
    try {
      await changePassword(currentPassword, newPassword)
      setPanel('none')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setSuccess('Password changed successfully')
    } catch (err) {
      setError(getMessage(err))
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteAccount(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSaving(true)
    try {
      await deleteAccount(deletePassword)
      // The server removed the account and the cookie: clear the screen state too
      dispatch(logout())
      dispatch(clearGoal())
      navigate(PATHS.home)
    } catch (err) {
      setError(getMessage(err))
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <p className="page-eyebrow">Account</p>
          <h1 className="page-title">My Profile</h1>
          <p className="muted">Manage your account and learning preferences.</p>
        </div>
        <button className="btn btn-outline" type="button">
          Edit Profile
        </button>
      </div>

      <div className="card profile-card">
        <div className="profile-head">
          <div className="profile-avatar">{getInitials(name)}</div>
          <div>
            <div className="profile-name">{name}</div>
            <div className="muted">{email}</div>
          </div>
        </div>

        <div className="profile-rows">
          <div>
            <div className="profile-label">Full Name</div>
            <div className="profile-value">{name}</div>
          </div>
          <div>
            <div className="profile-label">Email</div>
            <div className="profile-value">{email}</div>
          </div>
          <div className="profile-row">
            <div>
              <div className="profile-label">Current Goal</div>
              <div className="profile-value">{goal?.name ?? 'No goal selected'}</div>
            </div>
            <Link className="profile-link" to={PATHS.selectGoal}>
              Change
            </Link>
          </div>
          <div>
            <div className="profile-label">Weekly available learning hours</div>
            <div className="profile-value">10 hours / week</div>
          </div>
        </div>
      </div>

      <div className="card profile-card">
        <h3>Account</h3>
        {success && <p className="profile-success">{success}</p>}

        <div className="profile-rows">
          <div>
            <button className="profile-link" type="button" onClick={() => openPanel('password')}>
              Change password →
            </button>

            {panel === 'password' && (
              <form className="profile-form" onSubmit={handleChangePassword}>
                <input
                  className="profile-input"
                  type="password"
                  placeholder="Current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
                <input
                  className="profile-input"
                  type="password"
                  placeholder="New password (at least 6 characters)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <input
                  className="profile-input"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                {error && <p className="form-error">{error}</p>}
                <div className="profile-actions">
                  <button className="btn btn-primary" type="submit" disabled={saving}>
                    {saving ? 'Saving...' : 'Save password'}
                  </button>
                  <button className="btn btn-outline" type="button" onClick={() => openPanel('none')}>
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

          <div>
            <button
              className="profile-link profile-link-danger"
              type="button"
              onClick={() => openPanel('delete')}
            >
              Delete account →
            </button>

            {panel === 'delete' && (
              <form className="profile-form" onSubmit={handleDeleteAccount}>
                <p className="muted">
                  This permanently deletes your account, your goal, your skills and your
                  assessment history. Enter your password to confirm.
                </p>
                <input
                  className="profile-input"
                  type="password"
                  placeholder="Your password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  required
                />
                {error && <p className="form-error">{error}</p>}
                <div className="profile-actions">
                  <button className="btn profile-btn-danger" type="submit" disabled={saving}>
                    {saving ? 'Deleting...' : 'Delete my account'}
                  </button>
                  <button className="btn btn-outline" type="button" onClick={() => openPanel('none')}>
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MyProfilePage