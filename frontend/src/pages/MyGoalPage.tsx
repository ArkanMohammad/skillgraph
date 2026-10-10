import { Link, Navigate } from 'react-router-dom'
import { useGoalGraph } from '../hooks/useGoalGraph'
import StatusBadge from '../components/StatusBadge'
import ProgressBar from '../components/ProgressBar'
import type { GraphNode } from '../types/api'
import '../styles/pages.css'

function MyGoalPage() {
  const { goal, graph, loading, error } = useGoalGraph()

  if (!goal) return <Navigate to="/select-goal" replace />
  if (loading) return <p className="muted">Loading goal...</p>
  if (error) return <p className="form-error">{error}</p>

  const skills = graph?.nodes ?? []
  const mastered = skills.filter((s) => s.userState === 'MASTERED').length
  const percent = skills.length ? Math.round((mastered / skills.length) * 100) : 0

  // Group the skills by category (e.g. Frontend, Backend)
  const groups = new Map<string, GraphNode[]>()
  for (const skill of skills) {
    const key = skill.category ?? 'General'
    groups.set(key, [...(groups.get(key) ?? []), skill])
  }

  return (
    <div>
      <p className="page-eyebrow">My Goal</p>
      <h1 className="page-title">{goal.name}</h1>

      <div className="overall">
        <ProgressBar value={percent} />
        <strong>{percent}%</strong>
        <span className="muted">
          {mastered} of {skills.length} skills complete
        </span>
      </div>

      {[...groups.entries()].map(([category, items]) => (
        <div className="card card-flush" key={category}>
          <h3>{category}</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Skill</th>
                <th>Required</th>
                <th>Your mastery</th>
                <th>Gap</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((skill) => {
                const gap = skill.requiredMastery - skill.mastery
                return (
                  <tr key={skill.id}>
                    <td>{skill.name}</td>
                    <td className="muted">{skill.requiredMastery}%</td>
                    <td>
                      <div className="mastery-cell">
                        <ProgressBar
                          value={skill.mastery}
                          tone={skill.userState === 'MASTERED' ? 'mastered' : undefined}
                        />
                        <span className="muted">{skill.mastery}%</span>
                      </div>
                    </td>
                    <td>
                      {gap <= 0 ? (
                        <span className="gap-met">Met ✓</span>
                      ) : (
                        <span className="gap-miss">-{gap}%</span>
                      )}
                    </td>
                    <td>
                      <StatusBadge status={skill.userState} />
                    </td>
                    <td>
                      {/* Locked skills cannot be tested yet */}
                      {skill.userState !== 'LOCKED' && (
                        <Link
                          className="btn btn-outline btn-sm"
                          to={`/assessment/skill/${skill.id}`}
                        >
                          {skill.userState === 'MASTERED' ? 'Retake' : 'Take test'}
                        </Link>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  )
}

export default MyGoalPage