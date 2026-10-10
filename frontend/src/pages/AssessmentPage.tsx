import { Link, Navigate } from 'react-router-dom'
import { useGoalGraph } from '../hooks/useGoalGraph'
import StatusBadge from '../components/StatusBadge'
import ProgressBar from '../components/ProgressBar'
import '../styles/pages.css'

function AssessmentPage() {
  const { goal, graph, loading, error } = useGoalGraph()

  if (!goal) return <Navigate to="/select-goal" replace />
  if (loading) return <p className="muted">Loading skills...</p>
  if (error) return <p className="form-error">{error}</p>

  // Locked skills cannot be tested until their prerequisites are mastered
  const skills = (graph?.nodes ?? []).filter((s) => s.userState !== 'LOCKED')

  return (
    <div>
      <p className="page-eyebrow">Assessments</p>
      <h1 className="page-title">Test your skills</h1>
      <p className="muted">Pick a skill to measure your mastery. Locked skills open after their prerequisites.</p>

      {skills.length === 0 && <p className="muted">No skills are available to test yet.</p>}

      <div className="goal-grid">
        {skills.map((skill) => (
          <div className="card" key={skill.id}>
            <div className="skill-row-top">
              <h3>{skill.name}</h3>
              <StatusBadge status={skill.userState} />
            </div>
            <ProgressBar value={skill.mastery} tone={skill.userState === 'MASTERED' ? 'mastered' : undefined} />
            <p className="muted">
              {skill.mastery}% of required {skill.requiredMastery}%
            </p>
            <Link className="btn btn-primary" to={`/assessment/skill/${skill.id}`}>
              {skill.userState === 'MASTERED' ? 'Retake test' : 'Start test'}
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AssessmentPage