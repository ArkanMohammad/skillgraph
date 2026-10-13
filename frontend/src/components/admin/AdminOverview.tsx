import { useEffect, useState } from 'react'
import { Activity, ClipboardList, ShieldCheck, Users, type LucideIcon } from 'lucide-react'
import { getAdminStats, type AdminStats } from '../../services/adminService'
import ErrorState from '../ErrorState'
import { getMessage } from './adminHelpers'

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

// Totals and the number of users per goal (the users themselves are in the Users tab)
function AdminOverview() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0) // bumped by reload() to fetch again

  useEffect(() => {
    let cancelled = false // ignore the result if the tab was left meanwhile

    async function load() {
      try {
        const data = await getAdminStats()
        if (!cancelled) setStats(data)
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

  // Try again after a failed load
  function reload() {
    setLoading(true)
    setError(null)
    setAttempt((n) => n + 1)
  }

  if (loading) return <p className="muted">Loading admin data...</p>
  if (!stats) {
    return (
      <ErrorState
        title="Could not load admin data"
        message={error ?? 'Could not load admin data'}
        onRetry={reload}
      />
    )
  }

  return (
    <div>
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
    </div>
  )
}

export default AdminOverview