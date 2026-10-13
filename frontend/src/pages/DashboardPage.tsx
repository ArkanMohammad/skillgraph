import { Link, Navigate } from 'react-router-dom'
import { Activity, Check, Star, Target, type LucideIcon } from 'lucide-react'
import { useAppSelector } from '../hooks/reduxHooks'
import { useGoalGraph } from '../hooks/useGoalGraph'
import { useRecommendation } from '../hooks/useRecommendation'
import StatusBadge from '../components/StatusBadge'
import ProgressBar from '../components/ProgressBar'
import DonutChart from '../components/DonutChart'
import ErrorState from '../components/ErrorState'
import ReviewCard from '../components/ReviewCard'
import '../styles/pages.css'
import '../styles/skill-panel.css'
import { PATHS } from '../routes/paths'

// Small card: icon tile, big value, label and a hint line
function StatCard(props: {
  icon: LucideIcon
  tone: 'primary' | 'mastered' | 'ready' | 'danger'
  value: string
  label: string
  hint: string
}) {
  const Icon = props.icon
  return (
    <div className="card">
      <div className={`stat-icon tone-${props.tone}`}>
        <Icon size={22} />
      </div>
      <div className="stat-value">{props.value}</div>
      <div>{props.label}</div>
      <span className="muted">{props.hint}</span>
    </div>
  )
}

function DashboardPage() {
  const user = useAppSelector((state) => state.auth.user)
  const { goal, graph, loading, error, reload: reloadGraph } = useGoalGraph()
  const {
    recommendation,
    loading: recommendationLoading,
    error: recommendationError,
    reload: reloadRecommendation,
  } = useRecommendation()

  // No goal selected yet: send the user to choose one
  if (!goal) return <Navigate to={PATHS.selectGoal} replace />
  if (loading || recommendationLoading) return <p className="muted">Loading dashboard...</p>
  if (error || recommendationError) {
    return (
      <ErrorState
        title="Could not load your dashboard"
        message={error ?? recommendationError ?? 'Something went wrong'}
        onRetry={() => {
          reloadGraph()
          reloadRecommendation()
        }}
      />
    )
  }

  const skills = graph?.nodes ?? []

  // Simple display numbers (the recommendation logic stays in the backend)
  const total = skills.length
  const mastered = skills.filter((s) => s.userState === 'MASTERED').length
  const percent = total ? Math.round((mastered / total) * 100) : 0

  const inProgress = ['LEARNING', 'PRACTICING', 'ASSESSING']
  const current = skills.find((s) => inProgress.includes(s.userState))
  const inProgressCount = skills.filter((s) => inProgress.includes(s.userState)).length
  // The Next Best Skill comes from the backend (ranked by the utility formula)
  const next = recommendation?.next ?? null
  const goalComplete = recommendation?.goalComplete ?? false
  // The next three best ready skills after the recommended one
  const otherReady = (recommendation?.candidates ?? []).filter((item) => item.skillId !== next?.skillId).slice(0, 3)

  const recent = skills.filter((s) => s.userState !== 'LOCKED').slice(0, 5)
  const needsAttention = skills
    .filter((s) => s.userState !== 'MASTERED' && s.mastery > 0 && s.mastery < s.requiredMastery)
    .slice(0, 3)

  return (
    <div>
      <div className="page-header">
        <div>
          <p className="muted">Welcome back{user ? `, ${user.name}` : ''}</p>
          <p>
            Career goal: <span className="chip">{goal.name}</span>
          </p>
        </div>
        <Link className="btn btn-light" to={PATHS.skillGraph}>
          View Skill Graph →
        </Link>
      </div>

      <div className="stats-grid">
        <StatCard icon={Target} tone="primary" value={`${percent}%`} label="Goal Progress" hint={goal.name} />
        <StatCard
          icon={Check}
          tone="mastered"
          value={`${mastered} / ${total}`}
          label="Skills Mastered"
          hint="Core skills completed"
        />
        <StatCard
          icon={Star}
          tone="ready"
          value={current?.name ?? '—'}
          label="Current Skill"
          hint={current ? `${current.mastery}% mastery` : 'Nothing in progress'}
        />
        <StatCard
          icon={Activity}
          tone="danger"
          value={String(inProgressCount)}
          label="In Progress"
          hint="Skills you are learning"
        />
      </div>

      <div className="dash-grid">
        <div className="hero-card">
          <p className="hero-eyebrow">Next best skill</p>
          {next ? (
            <>
              <h2 className="hero-title">{next.skillName}</h2>
              <span className="badge badge-ready">Ready</span>
              <p className="hero-text">{next.explanation.summary}</p>
              <div className="hero-facts">
                <span className="hero-fact">about {next.estimatedHours} h of study</span>
                <span className="hero-fact">
                  opens {next.explanation.unlocksCount} more {next.explanation.unlocksCount === 1 ? 'skill' : 'skills'}
                </span>
                {next.explanation.margin !== null && (
                  <span className="hero-fact">{next.explanation.margin} points ahead of the next option</span>
                )}
              </div>
              <div className="hero-actions">
                <Link className="btn btn-white" to={PATHS.assessmentQuiz(next.skillId)}>
                  Start assessment
                </Link>
                <Link className="hero-link" to={PATHS.skillGraph}>
                  View in Graph
                </Link>
              </div>
              {otherReady.length > 0 && (
                <div className="hero-others">
                  <p className="hero-others-title">Also ready for you</p>
                  <div className="hero-others-list">
                    {otherReady.map((item) => (
                      <Link className="hero-other" key={item.skillId} to={PATHS.assessmentQuiz(item.skillId)}>
                        {item.skillName}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : goalComplete ? (
            <p className="hero-text">
              Congratulations! You mastered every skill of your {goal.name} goal.
            </p>
          ) : (
            <p className="hero-text">
              No skill is ready right now. Master your current skills to unlock the next ones.
            </p>
          )}
        </div>

        <div className="card">
          <h3>Goal Completion</h3>
          <DonutChart percent={percent} />
          <p className="muted" style={{ textAlign: 'center' }}>
            {goal.name}
          </p>
        </div>
      </div>

      <ReviewCard />

      <div className="two-col">
        <div className="card">
          <h3>Recent Skills</h3>
          {recent.length === 0 && <p className="muted">No skills started yet.</p>}
          {recent.map((skill) => (
            <div className="skill-row" key={skill.id}>
              <div className="skill-row-top">
                <span>{skill.name}</span>
                <StatusBadge status={skill.userState} />
              </div>
              <ProgressBar
                value={skill.mastery}
                tone={skill.userState === 'MASTERED' ? 'mastered' : undefined}
              />
            </div>
          ))}
        </div>

        {needsAttention.length > 0 && (
          <div className="card attention">
            <h3>Needs Attention</h3>
            {needsAttention.map((skill) => (
              <div className="skill-row" key={skill.id}>
                <div className="skill-row-top">
                  <span>{skill.name}</span>
                  <span>{skill.mastery}%</span>
                </div>
                <ProgressBar value={skill.mastery} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default DashboardPage