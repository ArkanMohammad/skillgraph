import { Link, Navigate } from 'react-router-dom'
import { CheckCircle2, ClipboardList, Clock, Target, type LucideIcon } from 'lucide-react'
import { useAppSelector } from '../hooks/reduxHooks'
import { useProgress } from '../hooks/useProgress'
import DonutChart from '../components/DonutChart'
import ProgressBar from '../components/ProgressBar'
import ErrorState from '../components/ErrorState'
import '../styles/pages.css'
import '../styles/progress.css'
import { PATHS } from '../routes/paths'

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

// Formats the date of an assessment (e.g. "12 Oct, 18:05")
function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Shows the overall learning progress of the current goal
function ProgressPage() {
  const goal = useAppSelector((state) => state.goal.selectedGoal)
  const { progress, loading, error, reload } = useProgress()

  if (!goal) return <Navigate to={PATHS.selectGoal} replace />
  if (loading) return <p className="muted">Loading progress...</p>
  if (error || !progress) {
    return (
      <ErrorState
        title="Could not load your progress"
        message={error ?? 'No progress yet'}
        onRetry={reload}
      />
    )
  }

  const { summary, recentAssessments } = progress

  return (
    <div>
      <div className="page-header">
        <div>
          <p className="page-eyebrow">Progress</p>
          <h1 className="page-title">{progress.goal.name}</h1>
          <p className="muted">How far you are from your goal.</p>
        </div>
        <Link className="btn btn-outline" to={PATHS.selectGoal}>
          Change goal
        </Link>
      </div>

      <div className="stats-grid">
        <StatCard
          icon={CheckCircle2}
          tone="mastered"
          value={`${summary.masteredSkills} / ${summary.totalSkills}`}
          label="Skills mastered"
        />
        <StatCard
          icon={Clock}
          tone="ready"
          value={`${summary.hoursRemaining} h`}
          label="Estimated hours left"
        />
        <StatCard
          icon={ClipboardList}
          tone="primary"
          value={String(progress.assessmentsCompleted)}
          label="Assessments completed"
        />
      </div>

      <div className="two-col">
        <div className="card">
          <h3>Overall progress</h3>
          <DonutChart percent={summary.percent} />
        </div>

        <div className="card">
          <h3>By category</h3>
          {summary.categories.map((category) => (
            <div className="skill-row" key={category.category}>
              <div className="skill-row-top">
                <span>{category.category}</span>
                <span className="muted">
                  {category.masteredSkills} / {category.totalSkills} mastered · {category.percent}%
                </span>
              </div>
              <ProgressBar value={category.percent} tone={category.percent >= 100 ? 'mastered' : undefined} />
            </div>
          ))}
        </div>
      </div>

      <div className="card card-flush progress-recent">
        <h3>Recent assessments</h3>
        {recentAssessments.length === 0 ? (
          <p className="muted progress-empty">
            <Target size={18} /> No assessments yet. Take your first test from the Assessments page.
          </p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Skill</th>
                <th>Score</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentAssessments.map((item) => (
                <tr key={item.assessmentId}>
                  <td>{item.skillName}</td>
                  <td>
                    <div className="mastery-cell">
                      <ProgressBar value={item.score} />
                      <span className="muted">{item.score}%</span>
                    </div>
                  </td>
                  <td className="muted">{formatDate(item.completedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default ProgressPage