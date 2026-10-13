import { useEffect, useState } from 'react'
import { Eye, Trash2 } from 'lucide-react'
import { useAppSelector } from '../../hooks/reduxHooks'
import {
  deleteAdminUser,
  getAdminUsers,
  setUserRole,
  type AdminUser,
} from '../../services/adminService'
import ErrorState from '../ErrorState'
import Modal from '../Modal'
import AdminUserModal from './AdminUserModal'
import { getMessage } from './adminHelpers'
import type { UserRole } from '../../types/api'

// Users tab: search, look at one user's progress, change a role, write advice or delete a user
function AdminUsers() {
  const me = useAppSelector((state) => state.auth.user)

  const [users, setUsers] = useState<AdminUser[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null) // the list could not load
  const [notice, setNotice] = useState<{ type: 'ok' | 'error'; text: string } | null>(null)
  const [attempt, setAttempt] = useState(0) // bumped to fetch again
  const [search, setSearch] = useState('')

  const [viewing, setViewing] = useState<AdminUser | null>(null)
  const [deleting, setDeleting] = useState<AdminUser | null>(null)
  const [confirmText, setConfirmText] = useState('')
  const [busy, setBusy] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const data = await getAdminUsers()
        if (cancelled) return
        setUsers(data.users)
        setTotal(data.total)
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

  function reload() {
    setLoading(true)
    setError(null)
    setAttempt((n) => n + 1)
  }

  async function handleRoleChange(user: AdminUser, role: UserRole) {
    setNotice(null)
    try {
      await setUserRole(user.id, role)
      setUsers((list) => list.map((item) => (item.id === user.id ? { ...item, role } : item)))
    } catch (err) {
      setNotice({ type: 'error', text: getMessage(err) })
    }
  }

  function startDelete(user: AdminUser) {
    setViewing(null)
    setConfirmText('')
    setDeleteError(null)
    setDeleting(user)
  }

  async function confirmDelete() {
    if (!deleting) return
    setBusy(true)
    setDeleteError(null)
    try {
      await deleteAdminUser(deleting.id)
      setUsers((list) => list.filter((item) => item.id !== deleting.id))
      setTotal((count) => count - 1)
      setNotice({ type: 'ok', text: `${deleting.name} was deleted with all their data` })
      setDeleting(null)
    } catch (err) {
      setDeleteError(getMessage(err))
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <p className="muted">Loading users...</p>
  if (error) return <ErrorState title="Could not load users" message={error} onRetry={reload} />

  const term = search.trim().toLowerCase()
  const shown = term
    ? users.filter((user) => user.name.toLowerCase().includes(term) || user.email.toLowerCase().includes(term))
    : users

  return (
    <div>
      <div className="card admin-panel">
        <label className="field admin-field-flat">
          <span>Search by name or email</span>
          <input className="input" value={search} onChange={(e) => setSearch(e.target.value)} />
        </label>
        <p className="muted">
          {total} {total === 1 ? 'user' : 'users'} in total
          {total > users.length ? `. Showing the newest ${users.length}.` : '.'}
        </p>
      </div>

      {notice && (
        <p className={notice.type === 'ok' ? 'admin-notice admin-notice-ok' : 'form-error'}>{notice.text}</p>
      )}

      <div className="card card-flush">
        <h3>Users</h3>
        {shown.length === 0 ? (
          <p className="muted admin-flush-message">No user matches your search.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Goal</th>
                <th>Tests</th>
                <th>Role</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {shown.map((user) => {
                const isSelf = user.id === me?.id
                const canDelete = !isSelf && user.role !== 'ADMIN'
                return (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td className="muted">{user.email}</td>
                    <td>{user.currentGoal ?? '—'}</td>
                    <td>{user.assessmentsCompleted}</td>
                    <td>
                      <select
                        className="admin-role-select"
                        value={user.role}
                        disabled={isSelf} // an admin cannot change their own role
                        onChange={(e) => handleRoleChange(user, e.target.value as UserRole)}
                      >
                        <option value="USER">USER</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </td>
                    <td>
                      <div className="admin-actions">
                        <button type="button" className="btn btn-outline btn-sm" onClick={() => setViewing(user)}>
                          <Eye size={14} /> View
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm admin-danger"
                          disabled={!canDelete}
                          title={
                            isSelf
                              ? 'You cannot delete your own account'
                              : user.role === 'ADMIN'
                                ? 'Change the role to USER first'
                                : undefined
                          }
                          onClick={() => startDelete(user)}
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {viewing && (
        <AdminUserModal
          user={viewing}
          isSelf={viewing.id === me?.id}
          onClose={() => setViewing(null)}
          onDelete={() => startDelete(viewing)}
        />
      )}

      {deleting && (
        <Modal
          title={`Delete ${deleting.name}?`}
          onClose={() => setDeleting(null)}
          footer={
            <>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setDeleting(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm admin-danger-solid"
                disabled={busy || confirmText.trim().toLowerCase() !== deleting.email.toLowerCase()}
                onClick={confirmDelete}
              >
                <Trash2 size={14} /> {busy ? 'Deleting...' : 'Delete permanently'}
              </button>
            </>
          }
        >
          {deleteError && <p className="form-error">{deleteError}</p>}
          <p>
            This removes the account, the chosen goals, all skill progress, test results and advice of{' '}
            <strong>{deleting.email}</strong>. It cannot be undone.
          </p>
          <label className="field">
            <span>Type the email to confirm</span>
            <input
              className="input"
              value={confirmText}
              placeholder={deleting.email}
              onChange={(e) => setConfirmText(e.target.value)}
            />
          </label>
        </Modal>
      )}
    </div>
  )
}

export default AdminUsers