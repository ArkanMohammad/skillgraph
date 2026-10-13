import { useEffect, useState } from 'react'
import { Check, Link2, Pencil, Plus, Trash2, X } from 'lucide-react'
import { getGoals } from '../../services/goalService'
import {
  addAdminGoalSkill,
  getAdminGoalSkills,
  removeAdminGoalSkill,
  setAdminPrerequisites,
  updateAdminGoalSkill,
  type GoalSkillInput,
  type GoalSkillRow,
  type GoalSkillsView,
} from '../../services/adminService'
import type { Goal } from '../../types/api'
import ErrorState from '../ErrorState'
import { getMessage } from './adminHelpers'

type Notice = { type: 'ok' | 'error'; text: string }
type Numbers = { mastery: string; importance: string; hours: string }

// Reads the three number fields (shown as percentages) and checks their ranges
function readNumbers(values: Numbers): { input: GoalSkillInput } | { error: string } {
  if (!values.mastery.trim() || !values.importance.trim() || !values.hours.trim()) {
    return { error: 'Fill in mastery, importance and hours' }
  }
  const mastery = Number(values.mastery)
  const importance = Number(values.importance)
  const hours = Number(values.hours)

  if (!Number.isFinite(mastery) || mastery < 50 || mastery > 100) {
    return { error: 'Required mastery must be between 50 and 100' }
  }
  if (!Number.isFinite(importance) || importance < 1 || importance > 100) {
    return { error: 'Importance must be between 1 and 100' }
  }
  if (!Number.isInteger(hours) || hours < 1 || hours > 1000) {
    return { error: 'Hours must be a whole number between 1 and 1000' }
  }
  return {
    input: {
      requiredMastery: Math.round(mastery) / 100,
      importance: Math.round(importance) / 100,
      estimatedHours: hours,
    },
  }
}

// Skills of this goal that already need `skillId` (directly or through other skills).
// They cannot become its prerequisite, because that would create a cycle.
function findDependents(skills: GoalSkillRow[], skillId: number): Set<number> {
  const found = new Set<number>()
  const queue = [skillId]
  while (queue.length > 0) {
    const current = queue.pop() as number
    for (const row of skills) {
      if (row.prerequisiteIds.includes(current) && !found.has(row.skillId)) {
        found.add(row.skillId)
        queue.push(row.skillId)
      }
    }
  }
  return found
}

// Short text that tells what a prerequisite change did
function describeChange(added: string[], removed: string[], goals: string[]) {
  if (added.length === 0 && removed.length === 0) return 'No change'
  const parts: string[] = []
  if (added.length > 0) parts.push(`Added: ${added.join(', ')}`)
  if (removed.length > 0) parts.push(`Removed: ${removed.join(', ')}`)
  let text = parts.join('. ')
  if (goals.length > 0) text += `. The same link is used by: ${goals.join(', ')}`
  return text
}

// Tab to change which skills belong to a goal, how much each one counts and what it needs first
function AdminGoalSkills() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [goalId, setGoalId] = useState<number | null>(null)
  const [view, setView] = useState<GoalSkillsView | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<Notice | null>(null)
  const [attempt, setAttempt] = useState(0) // bumped to fetch again
  const [busy, setBusy] = useState(false)

  const [editingId, setEditingId] = useState<number | null>(null)
  const [draft, setDraft] = useState<Numbers>({ mastery: '', importance: '', hours: '' })
  const [removing, setRemoving] = useState<GoalSkillRow | null>(null)
  const [prereqFor, setPrereqFor] = useState<GoalSkillRow | null>(null)
  const [prereqDraft, setPrereqDraft] = useState<number[]>([])
  const [adding, setAdding] = useState({ skillId: '', mastery: '70', importance: '50', hours: '10' })

  // Goals for the selector
  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const data = await getGoals()
        if (cancelled) return
        setGoals(data.goals)
        setGoalId((current) => current ?? data.goals[0]?.id ?? null)
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

  // Skills of the selected goal
  useEffect(() => {
    if (goalId === null) return
    let cancelled = false

    async function load(id: number) {
      try {
        const data = await getAdminGoalSkills(id)
        if (!cancelled) setView(data)
      } catch (err) {
        if (!cancelled) setError(getMessage(err))
      }
    }

    load(goalId)
    return () => {
      cancelled = true
    }
  }, [goalId, attempt])

  function retry() {
    setLoading(true)
    setError(null)
    setAttempt((n) => n + 1)
  }

  function handleGoalChange(id: number) {
    setGoalId(id)
    setView(null)
    setEditingId(null)
    setRemoving(null)
    setPrereqFor(null)
    setNotice(null)
  }

  // Runs one change, shows its result and reloads the table. Returns true on success.
  async function run(action: () => Promise<string>): Promise<boolean> {
    setBusy(true)
    setNotice(null)
    try {
      const text = await action()
      setNotice({ type: 'ok', text })
      setAttempt((n) => n + 1)
      return true
    } catch (err) {
      setNotice({ type: 'error', text: getMessage(err) })
      return false
    } finally {
      setBusy(false)
    }
  }

  function startEdit(row: GoalSkillRow) {
    setRemoving(null)
    setPrereqFor(null)
    setEditingId(row.skillId)
    setDraft({
      mastery: String(Math.round(row.requiredMastery * 100)),
      importance: String(Math.round(row.importance * 100)),
      hours: String(row.estimatedHours),
    })
  }

  function startPrerequisites(row: GoalSkillRow) {
    setRemoving(null)
    setEditingId(null)
    setNotice(null)
    setPrereqFor(row)
    setPrereqDraft(row.prerequisiteIds)
  }

  function togglePrerequisite(id: number) {
    setPrereqDraft((list) => (list.includes(id) ? list.filter((item) => item !== id) : [...list, id]))
  }

  async function savePrerequisites() {
    if (goalId === null || !prereqFor) return
    const target = prereqFor
    const ok = await run(async () => {
      const result = await setAdminPrerequisites(goalId, target.skillId, prereqDraft)
      return describeChange(result.added, result.removed, result.alsoAffectedGoals)
    })
    if (ok) setPrereqFor(null)
  }

  async function saveEdit(row: GoalSkillRow) {
    if (goalId === null) return
    const parsed = readNumbers(draft)
    if ('error' in parsed) {
      setNotice({ type: 'error', text: parsed.error })
      return
    }
    const ok = await run(async () => {
      await updateAdminGoalSkill(goalId, row.skillId, parsed.input)
      return `${row.name} updated`
    })
    if (ok) setEditingId(null)
  }

  async function confirmRemove() {
    if (goalId === null || !removing) return
    const target = removing
    await run(async () => {
      const result = await removeAdminGoalSkill(goalId, target.skillId)
      return result.affectedSkills.length > 0
        ? `${target.name} removed. ${result.affectedSkills.join(', ')} no longer need it inside this goal.`
        : `${target.name} removed from the goal`
    })
    setRemoving(null)
  }

  async function addSkill() {
    if (goalId === null || !view) return
    const skill = view.available.find((item) => String(item.skillId) === adding.skillId)
    if (!skill) {
      setNotice({ type: 'error', text: 'Choose a skill to add' })
      return
    }
    const parsed = readNumbers(adding)
    if ('error' in parsed) {
      setNotice({ type: 'error', text: parsed.error })
      return
    }
    const ok = await run(async () => {
      await addAdminGoalSkill(goalId, skill.skillId, parsed.input)
      return `${skill.name} added to the goal`
    })
    if (ok) setAdding((current) => ({ ...current, skillId: '' }))
  }

  if (loading) return <p className="muted">Loading goals...</p>
  if (error) {
    return <ErrorState title="Could not load goal skills" message={error} onRetry={retry} />
  }

  const nameOf = new Map((view?.skills ?? []).map((row) => [row.skillId, row.name]))

  // Skills of this goal that list the skill being removed as a prerequisite
  const dependents = removing && view
    ? view.skills.filter((row) => row.prerequisiteIds.includes(removing.skillId))
    : []

  // Skills that cannot be chosen as a prerequisite of the skill being edited (cycle)
  const blocked = prereqFor && view ? findDependents(view.skills, prereqFor.skillId) : new Set<number>()

  return (
    <div>
      <div className="card admin-panel">
        <label className="field admin-field-flat">
          <span>Goal</span>
          <select
            className="input"
            value={goalId ?? ''}
            onChange={(e) => handleGoalChange(Number(e.target.value))}
          >
            {goals.map((goal) => (
              <option key={goal.id} value={goal.id}>
                {goal.name}
              </option>
            ))}
          </select>
        </label>
        <p className="muted">
          Removing a skill from a goal does not delete the skill, and users keep their progress on
          it.
        </p>
      </div>

      {notice && (
        <p className={notice.type === 'ok' ? 'admin-notice admin-notice-ok' : 'form-error'}>
          {notice.text}
        </p>
      )}

      {removing && (
        <div className="card admin-panel admin-warning">
          <h3>Remove {removing.name}?</h3>
          <p>
            It will no longer be part of this goal. Users keep their progress on the skill, but it
            stops counting toward this goal.
          </p>
          {dependents.length > 0 && (
            <p>
              These skills need it first and will no longer have it as a prerequisite in this goal:{' '}
              <strong>{dependents.map((row) => row.name).join(', ')}</strong>.
            </p>
          )}
          <div className="admin-actions">
            <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={confirmRemove}>
              <Trash2 size={14} /> Yes, remove
            </button>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setRemoving(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {prereqFor && view && (
        <div className="card admin-panel">
          <h3>Prerequisites of {prereqFor.name}</h3>
          <p className="muted">
            Choose the skills a user must master first. The link is shared: every goal that contains
            both skills uses it. A skill that already needs {prereqFor.name} cannot be chosen.
          </p>
          {view.skills.length <= 1 ? (
            <p className="muted">This goal has no other skills.</p>
          ) : (
            <div className="admin-check-grid">
              {view.skills
                .filter((row) => row.skillId !== prereqFor.skillId)
                .map((row) => {
                  const isBlocked = blocked.has(row.skillId)
                  return (
                    <label
                      key={row.skillId}
                      className={`admin-check ${isBlocked ? 'admin-check-disabled' : ''}`}
                      title={isBlocked ? `${row.name} already needs ${prereqFor.name}` : undefined}
                    >
                      <input
                        type="checkbox"
                        checked={prereqDraft.includes(row.skillId)}
                        disabled={isBlocked}
                        onChange={() => togglePrerequisite(row.skillId)}
                      />
                      {row.name}
                    </label>
                  )
                })}
            </div>
          )}
          <div className="admin-actions">
            <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={savePrerequisites}>
              <Check size={14} /> Save prerequisites
            </button>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setPrereqFor(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {view && (
        <>
          <div className="card card-flush">
            <h3>Skills of {view.goal.name}</h3>
            <table className="table">
              <thead>
                <tr>
                  <th>Skill</th>
                  <th>Needs first</th>
                  <th>Required mastery</th>
                  <th>Importance</th>
                  <th>Hours</th>
                  <th>Questions</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {view.skills.map((row) => {
                  const isEditing = editingId === row.skillId
                  return (
                    <tr key={row.skillId}>
                      <td>
                        {row.name}
                        {row.category && <div className="muted">{row.category}</div>}
                      </td>
                      <td className="muted">
                        {row.prerequisiteIds.length > 0
                          ? row.prerequisiteIds.map((id) => nameOf.get(id) ?? id).join(', ')
                          : '—'}
                      </td>
                      {isEditing ? (
                        <>
                          <td>
                            <input
                              className="input input-sm admin-num"
                              type="number"
                              min={50}
                              max={100}
                              value={draft.mastery}
                              onChange={(e) => setDraft({ ...draft, mastery: e.target.value })}
                              aria-label="Required mastery in percent"
                            />
                          </td>
                          <td>
                            <input
                              className="input input-sm admin-num"
                              type="number"
                              min={1}
                              max={100}
                              value={draft.importance}
                              onChange={(e) => setDraft({ ...draft, importance: e.target.value })}
                              aria-label="Importance in percent"
                            />
                          </td>
                          <td>
                            <input
                              className="input input-sm admin-num"
                              type="number"
                              min={1}
                              max={1000}
                              value={draft.hours}
                              onChange={(e) => setDraft({ ...draft, hours: e.target.value })}
                              aria-label="Estimated hours"
                            />
                          </td>
                        </>
                      ) : (
                        <>
                          <td>{Math.round(row.requiredMastery * 100)}%</td>
                          <td>{Math.round(row.importance * 100)}%</td>
                          <td>{row.estimatedHours} h</td>
                        </>
                      )}
                      <td className="muted">{row.activeQuestions} active</td>
                      <td>
                        <div className="admin-actions">
                          {isEditing ? (
                            <>
                              <button
                                type="button"
                                className="btn btn-primary btn-sm"
                                disabled={busy}
                                onClick={() => saveEdit(row)}
                              >
                                <Check size={14} /> Save
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline btn-sm"
                                onClick={() => setEditingId(null)}
                              >
                                <X size={14} /> Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                className="btn btn-outline btn-sm"
                                onClick={() => startEdit(row)}
                              >
                                <Pencil size={14} /> Edit
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline btn-sm"
                                onClick={() => startPrerequisites(row)}
                              >
                                <Link2 size={14} /> Prerequisites
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline btn-sm"
                                disabled={view.skills.length <= 1}
                                title={
                                  view.skills.length <= 1
                                    ? 'A goal needs at least one skill'
                                    : undefined
                                }
                                onClick={() => {
                                  setEditingId(null)
                                  setPrereqFor(null)
                                  setRemoving(row)
                                }}
                              >
                                <Trash2 size={14} /> Remove
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="card admin-panel">
            <h3>Add a skill to this goal</h3>
            {view.available.length === 0 ? (
              <p className="muted">Every skill is already part of this goal.</p>
            ) : (
              <>
                <div className="admin-form-grid admin-form-four">
                  <label className="field">
                    <span>Skill</span>
                    <select
                      className="input"
                      value={adding.skillId}
                      onChange={(e) => setAdding({ ...adding, skillId: e.target.value })}
                    >
                      <option value="">Choose a skill...</option>
                      {view.available.map((item) => (
                        <option key={item.skillId} value={item.skillId} disabled={!item.canAdd}>
                          {item.name}
                          {item.canAdd ? '' : ` (only ${item.activeQuestions} active questions)`}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>Required mastery (%)</span>
                    <input
                      className="input"
                      type="number"
                      min={50}
                      max={100}
                      value={adding.mastery}
                      onChange={(e) => setAdding({ ...adding, mastery: e.target.value })}
                    />
                  </label>
                  <label className="field">
                    <span>Importance (%)</span>
                    <input
                      className="input"
                      type="number"
                      min={1}
                      max={100}
                      value={adding.importance}
                      onChange={(e) => setAdding({ ...adding, importance: e.target.value })}
                    />
                  </label>
                  <label className="field">
                    <span>Hours</span>
                    <input
                      className="input"
                      type="number"
                      min={1}
                      max={1000}
                      value={adding.hours}
                      onChange={(e) => setAdding({ ...adding, hours: e.target.value })}
                    />
                  </label>
                </div>
                <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={addSkill}>
                  <Plus size={14} /> Add to goal
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default AdminGoalSkills