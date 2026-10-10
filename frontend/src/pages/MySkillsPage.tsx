import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useGoalGraph } from '../hooks/useGoalGraph'
import StatusBadge from '../components/StatusBadge'
import ProgressBar from '../components/ProgressBar'
import type { SkillStatus } from '../types/api'
import '../styles/pages.css'

type Filter = 'ALL' | 'MASTERED' | 'LEARNING' | 'READY' | 'LOCKED'

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'MASTERED', label: 'Mastered' },
  { key: 'LEARNING', label: 'Learning' },
  { key: 'READY', label: 'Ready' },
  { key: 'LOCKED', label: 'Locked' },
]

const IN_PROGRESS: SkillStatus[] = ['LEARNING', 'PRACTICING', 'ASSESSING']

// "Learning" groups every in-progress state
function matches(filter: Filter, state: SkillStatus) {
  if (filter === 'ALL') return true
  if (filter === 'LEARNING') return IN_PROGRESS.includes(state)
  return state === filter
}

function MySkillsPage() {
  const { goal, graph, loading, error } = useGoalGraph()
  const [filter, setFilter] = useState<Filter>('ALL')

  if (!goal) return <Navigate to="/select-goal" replace />
  if (loading) return <p className="muted">Loading skills...</p>
  if (error) return <p className="form-error">{error}</p>

  const skills = graph?.nodes ?? []
  const mastered = skills.filter((s) => s.userState === 'MASTERED').length
  const visible = skills.filter((s) => matches(filter, s.userState))

  return (
    <div>
      <h1 className="page-title">My Skills</h1>
      <p className="muted">
        {mastered} mastered · {skills.length} total
      </p>

      <div className="pills">
        {FILTERS.map((item) => (
          <button
            key={item.key}
            className={`pill ${filter === item.key ? 'active' : ''}`}
            onClick={() => setFilter(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="card card-flush">
        <table className="table">
          <thead>
            <tr>
              <th>Skill</th>
              <th>Mastery</th>
              <th>Confidence</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {visible.map((skill) => (
              <tr key={skill.id}>
                <td>{skill.name}</td>
                <td>
                  <div className="mastery-cell">
                    <ProgressBar value={skill.mastery} />
                    <span className="muted">{skill.mastery}%</span>
                  </div>
                </td>
                <td>{skill.confidence > 0 ? `${skill.confidence}%` : '—'}</td>
                <td>
                  <StatusBadge status={skill.userState} />
                </td>
                <td>
                  {skill.userState !== 'LOCKED' && (
                    <Link to={`/assessment/skill/${skill.id}`}>Take test →</Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {visible.length === 0 && <p className="muted" style={{ padding: 24 }}>No skills in this filter.</p>}
      </div>
    </div>
  )
}

export default MySkillsPage