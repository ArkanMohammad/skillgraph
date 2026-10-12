import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../hooks/reduxHooks'
import { loginSuccess, logout } from '../features/auth/authSlice'
import { clearGoal } from '../features/goal/goalSlice'
import { changePassword, deleteAccount, getProfile, updateProfile } from '../services/authService'
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

  // Weekly learning hours live on the server (the store only keeps the basic user)
  const [weeklyHours, setWeeklyHours] = useState<number | null>(null)
  const [editing, setEditing] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [emailInput, setEmailInput] = useState('')
  const [hoursInput, setHoursInput] = useState('')
  const [profileError, setProfileError] = useState<string | null>(null)
  const [profileSaving, setProfileSaving] = useState(false)

  const [panel, setPanel] = useState<Panel>('none')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [deletePassword, setDeletePassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false // ignore the result if the page was left meanwhile
    getProfile()
      .then((profile) => {
        if (!cancelled) setWeeklyHours(profile.weeklyHours)
      })
      .catch(() => {
        // The page still works without the hours; the value just stays hidden
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Turns the name, email and hours into inputs, filled with the current values
  function startEditing() {
    setNameInput(name)
    setEmailInput(email)
    setHoursInput(String(weeklyHours ?? 10))
    setProfileError(null)
    setSuccess(null)
    setEditing(true)
  }

  async function handleSaveProfile(event: FormEvent) {
    event.preventDefault()
    setProfileError(null)
    setProfileSaving(true)
    try {
      const saved = await updateProfile(nameInput, emailInput, Number(hoursInput))
      setWeeklyHours(saved.weeklyHours)
      // Update the name and email shown on the screen
      if (user) dispatch(loginSuccess({ user: { ...user, name: saved.name, email: saved.email } }))
      setEditing(false)
      setSuccess('Profile updated')
    } catch (err) {
      setProfileError(getMessage(err))
    } finally {
      setProfileSaving(false)
    }
  }

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
        {!editing && (
          <button className="btn btn-outline" type="button" onClick={startEditing}>
            Edit Profile
          </button>
        )}
      </div>

      {success && <p className="profile-success">{success}</p>}

      <form className="card profile-card" onSubmit={handleSaveProfile}>
        <div className="profile-head">
          <div className="profile-avatar">{getInitials(name)}</div>
          <div>
            <div className="profile-name">{name}</div>
            <div className="muted">{email}</div>
          </div>
        </div>

        <div className="profile-rows">
          <div>
            <label className="profile-label" htmlFor="profile-name">
              Full Name
            </label>
            {editing ? (
              <input
                id="profile-name"
                className="profile-input profile-input-wide"
                type="text"
                maxLength={100}
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                required
              />
            ) : (
              <div className="profile-value">{name}</div>
            )}
          </div>
          <div>
            <label className="profile-label" htmlFor="profile-email">
              Email
            </label>
            {editing ? (
              <input
                id="profile-email"
                className="profile-input profile-input-wide"
                type="email"
                maxLength={255}
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                required
              />
            ) : (
              <div className="profile-value">{email}</div>
            )}
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
            <label className="profile-label" htmlFor="profile-hours">
              Weekly available learning hours
            </label>
            {editing ? (
              <input
                id="profile-hours"
                className="profile-input profile-input-wide"
                type="number"
                min={1}
                max={80}
                step={1}
                value={hoursInput}
                onChange={(e) => setHoursInput(e.target.value)}
                required
              />
            ) : (
              <div className="profile-value">
                {weeklyHours === null ? '—' : `${weeklyHours} hours / week`}
              </div>
            )}
          </div>
        </div>

        {editing && (
          <>
            {profileError && <p className="form-error">{profileError}</p>}
            <div className="profile-actions profile-actions-top">
              <button className="btn btn-primary" type="submit" disabled={profileSaving}>
                {profileSaving ? 'Saving...' : 'Save changes'}
              </button>
              <button className="btn btn-outline" type="button" onClick={() => setEditing(false)}>
                Cancel
              </button>
            </div>
          </>
        )}
      </form>

      <div className="card profile-card">
        <h3>Account</h3>

        <div className="profile-rows">
          <div>
            <button className="profile-link" type="button" onClick={() => openPanel('password')}>
              Change password →
            </button>

            {panel === 'password' && (
              <form className="profile-form" onSubmit={handleChangePassword}>
                <label className="profile-label" htmlFor="pw-old">
                  Old password
                </label>
                <input
                  id="pw-old"
                  className="profile-input"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
                <label className="profile-label" htmlFor="pw-new">
                  New password (at least 6 characters)
                </label>
                <input
                  id="pw-new"
                  className="profile-input"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <label className="profile-label" htmlFor="pw-confirm">
                  Confirm new password
                </label>
                <input
                  id="pw-confirm"
                  className="profile-input"
                  type="password"
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
                <label className="profile-label" htmlFor="pw-delete">
                  Your password
                </label>
                <input
                  id="pw-delete"
                  className="profile-input"
                  type="password"
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