import { useEffect, useState } from 'react'
import { Activity, ClipboardList, ShieldCheck, Users, type LucideIcon } from 'lucide-react'
import { useAppSelector } from '../hooks/reduxHooks'
import {
  getAdminStats,
  getAdminUsers,
  setUserRole,
  type AdminStats,
  type AdminUser,
} from '../services/adminService'
import { ApiError } from '../services/apiClient'
import type { UserRole } from '../types/api'
import '../styles/pages.css'
import '../styles/progress.css'

// Small card: icon tile, big value and a label
function StatCard(props: {
  icon: LucideIcon
  tone: 'primary' | 'mastered' | 'ready' | 'danger'
  value: string
  label: string
}) {
  const Icon = props.icon
  return (
    <div className="card">
      <div className={`stat-icon tone-${props.tone}`}>
        <Icon size={22} />
      </div>
      <div className="stat-value">{props.value}</div>
      <div>{props.label}</div>
    </div>
  )
}

// Turns any thrown error into a message for the screen
function getMessage(err: unknown) {
  return err instanceof ApiError ? err.message : 'Cannot reach the server'
}

// Minimal admin overview: totals, users per goal and a users table with role control
function AdminPage() {
  const me = useAppSelector((state) => state.auth.user)

  const [stats, setStats] = useState<AdminStats | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false // ignore the result if the page was left meanwhile

    async function load() {
      try {
        const [statsData, usersData] = await Promise.all([getAdminStats(), getAdminUsers()])
        if (cancelled) return
        setStats(statsData)
        setUsers(usersData.users)
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
  }, [])

  async function handleRoleChange(user: AdminUser, role: UserRole) {
    setError(null)
    try {
      await setUserRole(user.id, role)
      setUsers((list) => list.map((item) => (item.id === user.id ? { ...item, role } : item)))
      // Keep the admin counter in sync without another request
      setStats((current) =>
        current
          ? { ...current, admins: current.admins + (role === 'ADMIN' ? 1 : -1) }
          : current
      )
    } catch (err) {
      setError(getMessage(err))
    }
  }

  if (loading) return <p className="muted">Loading admin data...</p>
  if (!stats) return <p className="form-error">{error ?? 'Could not load admin data'}</p>

  return (
    <div>
      <p className="page-eyebrow">Admin</p>
      <h1 className="page-title">Overview</h1>

      <div className="stats-grid">
        <StatCard icon={Users} tone="primary" value={String(stats.users)} label="Users" />
        <StatCard icon={ShieldCheck} tone="danger" value={String(stats.admins)} label="Admins" />
        <StatCard
          icon={ClipboardList}
          tone="ready"
          value={String(stats.assessmentsCompleted)}
          label="Assessments completed"
        />
        <StatCard
          icon={Activity}
          tone="mastered"
          value={stats.averageScore === null ? '—' : `${stats.averageScore}%`}
          label="Average score"
        />
      </div>

      <div className="card">
        <h3>Users per goal</h3>
        {stats.usersPerGoal.map((goal) => (
          <div className="skill-row-top" key={goal.goalId}>
            <span>{goal.name}</span>
            <span className="muted">{goal.users}</span>
          </div>
        ))}
      </div>

      <div className="card card-flush progress-recent">
        <h3>Users</h3>
        {error && <p className="form-error progress-empty">{error}</p>}
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Goal</th>
              <th>Tests</th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td className="muted">{user.email}</td>
                <td>{user.currentGoal ?? '—'}</td>
                <td>{user.assessmentsCompleted}</td>
                <td>
                  <select
                    className="admin-role-select"
                    value={user.role}
                    disabled={user.id === me?.id} // an admin cannot change their own role
                    onChange={(e) => handleRoleChange(user, e.target.value as UserRole)}
                  >
                    <option value="USER">USER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AdminPage