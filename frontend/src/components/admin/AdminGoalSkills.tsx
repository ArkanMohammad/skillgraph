import { useEffect, useState } from 'react'
import { Link2, Pencil, Plus, Trash2 } from 'lucide-react'
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
import Modal from '../Modal'
import { getMessage } from './adminHelpers'

type Numbers = { mastery: string; importance: string; hours: string }
// Which window is open (only one at a time)
type Dialog =
  | { type: 'edit'; row: GoalSkillRow }
  | { type: 'prerequisites'; row: GoalSkillRow }
  | { type: 'remove'; row: GoalSkillRow }
  | { type: 'add' }

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

// Tab to change which skills belong to a goal, how much each one counts and what it needs first.
// Every change happens in a window on top of the table.
function AdminGoalSkills() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [goalId, setGoalId] = useState<number | null>(null)
  const [view, setView] = useState<GoalSkillsView | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null) // last change that worked
  const [attempt, setAttempt] = useState(0) // bumped to fetch again
  const [busy, setBusy] = useState(false)

  const [dialog, setDialog] = useState<Dialog | null>(null)
  const [dialogError, setDialogError] = useState<string | null>(null)
  const [draft, setDraft] = useState<Numbers>({ mastery: '', importance: '', hours: '' })
  const [prereqDraft, setPrereqDraft] = useState<number[]>([])
  const [addSkillId, setAddSkillId] = useState('')

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
    setDialog(null)
    setNotice(null)
  }

  function closeDialog() {
    setDialog(null)
    setDialogError(null)
  }

  // Runs one change. On success the window closes and the table reloads; on failure the
  // message appears inside the window so the admin can fix the input and try again.
  async function run(action: () => Promise<string>) {
    setBusy(true)
    setDialogError(null)
    try {
      setNotice(await action())
      setDialog(null)
      setAttempt((n) => n + 1)
    } catch (err) {
      setDialogError(getMessage(err))
    } finally {
      setBusy(false)
    }
  }

  function openEdit(row: GoalSkillRow) {
    setDialogError(null)
    setDraft({
      mastery: String(Math.round(row.requiredMastery * 100)),
      importance: String(Math.round(row.importance * 100)),
      hours: String(row.estimatedHours),
    })
    setDialog({ type: 'edit', row })
  }

  function openPrerequisites(row: GoalSkillRow) {
    setDialogError(null)
    setPrereqDraft(row.prerequisiteIds)
    setDialog({ type: 'prerequisites', row })
  }

  function openRemove(row: GoalSkillRow) {
    setDialogError(null)
    setDialog({ type: 'remove', row })
  }

  function openAdd() {
    setDialogError(null)
    setAddSkillId('')
    setDraft({ mastery: '70', importance: '50', hours: '10' })
    setDialog({ type: 'add' })
  }

  function togglePrerequisite(id: number) {
    setPrereqDraft((list) => (list.includes(id) ? list.filter((item) => item !== id) : [...list, id]))
  }

  // Validates the three numbers, then runs the change (shared by "edit" and "add")
  function saveNumbers(work: (input: GoalSkillInput) => Promise<string>) {
    const parsed = readNumbers(draft)
    if ('error' in parsed) {
      setDialogError(parsed.error)
      return
    }
    run(() => work(parsed.input))
  }

  if (loading) return <p className="muted">Loading goals...</p>
  if (error) {
    return <ErrorState title="Could not load goal skills" message={error} onRetry={retry} />
  }

  const nameOf = new Map((view?.skills ?? []).map((row) => [row.skillId, row.name]))
  const numberFields = (
    <div className="admin-form-grid admin-form-three">
      <label className="field">
        <span>Required mastery (%)</span>
        <input
          className="input"
          type="number"
          min={50}
          max={100}
          value={draft.mastery}
          onChange={(e) => setDraft({ ...draft, mastery: e.target.value })}
        />
      </label>
      <label className="field">
        <span>Importance (%)</span>
        <input
          className="input"
          type="number"
          min={1}
          max={100}
          value={draft.importance}
          onChange={(e) => setDraft({ ...draft, importance: e.target.value })}
        />
      </label>
      <label className="field">
        <span>Hours</span>
        <input
          className="input"
          type="number"
          min={1}
          max={1000}
          value={draft.hours}
          onChange={(e) => setDraft({ ...draft, hours: e.target.value })}
        />
      </label>
    </div>
  )

  return (
    <div>
      <div className="card admin-panel">
        <div className="admin-toolbar">
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
          {view && (
            <div className="admin-actions">
              <button type="button" className="btn btn-primary btn-sm" onClick={openAdd}>
                <Plus size={14} /> Add skill
              </button>
            </div>
          )}
        </div>
        <p className="muted">
          Removing a skill from a goal does not delete the skill, and users keep their progress on
          it.
        </p>
      </div>

      {notice && <p className="admin-notice admin-notice-ok">{notice}</p>}

      {view && (
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
              {view.skills.map((row) => (
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
                  <td>{Math.round(row.requiredMastery * 100)}%</td>
                  <td>{Math.round(row.importance * 100)}%</td>
                  <td>{row.estimatedHours} h</td>
                  <td className="muted">{row.activeQuestions} active</td>
                  <td>
                    <div className="admin-actions">
                      <button type="button" className="btn btn-outline btn-sm" onClick={() => openEdit(row)}>
                        <Pencil size={14} /> Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => openPrerequisites(row)}
                      >
                        <Link2 size={14} /> Prerequisites
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        disabled={view.skills.length <= 1}
                        title={view.skills.length <= 1 ? 'A goal needs at least one skill' : undefined}
                        onClick={() => openRemove(row)}
                      >
                        <Trash2 size={14} /> Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {dialog?.type === 'edit' && goalId !== null && (
        <Modal
          title={`Edit ${dialog.row.name}`}
          subtitle="How much this skill counts inside the goal"
          onClose={closeDialog}
          footer={
            <>
              <button type="button" className="btn btn-outline btn-sm" onClick={closeDialog}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                disabled={busy}
                onClick={() =>
                  saveNumbers(async (input) => {
                    await updateAdminGoalSkill(goalId, dialog.row.skillId, input)
                    return `${dialog.row.name} updated`
                  })
                }
              >
                {busy ? 'Saving...' : 'Save'}
              </button>
            </>
          }
        >
          {dialogError && <p className="form-error">{dialogError}</p>}
          {numberFields}
        </Modal>
      )}

      {dialog?.type === 'add' && goalId !== null && view && (
        <Modal
          title="Add a skill to this goal"
          subtitle={view.goal.name}
          onClose={closeDialog}
          footer={
            view.available.length > 0 && (
              <>
                <button type="button" className="btn btn-outline btn-sm" onClick={closeDialog}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  disabled={busy}
                  onClick={() => {
                    const skill = view.available.find((item) => String(item.skillId) === addSkillId)
                    if (!skill) {
                      setDialogError('Choose a skill to add')
                      return
                    }
                    saveNumbers(async (input) => {
                      await addAdminGoalSkill(goalId, skill.skillId, input)
                      return `${skill.name} added to the goal`
                    })
                  }}
                >
                  {busy ? 'Adding...' : 'Add to goal'}
                </button>
              </>
            )
          }
        >
          {view.available.length === 0 ? (
            <p className="muted">Every skill is already part of this goal.</p>
          ) : (
            <>
              {dialogError && <p className="form-error">{dialogError}</p>}
              <label className="field">
                <span>Skill</span>
                <select className="input" value={addSkillId} onChange={(e) => setAddSkillId(e.target.value)}>
                  <option value="">Choose a skill...</option>
                  {view.available.map((item) => (
                    <option key={item.skillId} value={item.skillId} disabled={!item.canAdd}>
                      {item.name}
                      {item.canAdd ? '' : ` (only ${item.activeQuestions} active questions)`}
                    </option>
                  ))}
                </select>
              </label>
              {numberFields}
            </>
          )}
        </Modal>
      )}

      {dialog?.type === 'remove' && goalId !== null && view && (
        <Modal
          title={`Remove ${dialog.row.name}?`}
          onClose={closeDialog}
          footer={
            <>
              <button type="button" className="btn btn-outline btn-sm" onClick={closeDialog}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                disabled={busy}
                onClick={() =>
                  run(async () => {
                    const result = await removeAdminGoalSkill(goalId, dialog.row.skillId)
                    return result.affectedSkills.length > 0
                      ? `${dialog.row.name} removed. ${result.affectedSkills.join(', ')} no longer need it inside this goal.`
                      : `${dialog.row.name} removed from the goal`
                  })
                }
              >
                <Trash2 size={14} /> {busy ? 'Removing...' : 'Yes, remove'}
              </button>
            </>
          }
        >
          {dialogError && <p className="form-error">{dialogError}</p>}
          <p>
            It will no longer be part of this goal. Users keep their progress on the skill, but it
            stops counting toward this goal.
          </p>
          {view.skills.some((row) => row.prerequisiteIds.includes(dialog.row.skillId)) && (
            <p>
              These skills need it first and will no longer have it as a prerequisite in this goal:{' '}
              <strong>
                {view.skills
                  .filter((row) => row.prerequisiteIds.includes(dialog.row.skillId))
                  .map((row) => row.name)
                  .join(', ')}
              </strong>
              .
            </p>
          )}
        </Modal>
      )}

      {dialog?.type === 'prerequisites' && goalId !== null && view && (
        <Modal
          title={`Prerequisites of ${dialog.row.name}`}
          onClose={closeDialog}
          size="lg"
          footer={
            <>
              <button type="button" className="btn btn-outline btn-sm" onClick={closeDialog}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                disabled={busy}
                onClick={() =>
                  run(async () => {
                    const result = await setAdminPrerequisites(goalId, dialog.row.skillId, prereqDraft)
                    return describeChange(result.added, result.removed, result.alsoAffectedGoals)
                  })
                }
              >
                {busy ? 'Saving...' : 'Save prerequisites'}
              </button>
            </>
          }
        >
          {dialogError && <p className="form-error">{dialogError}</p>}
          <p className="muted">
            Choose the skills a user must master first. The link is shared: every goal that contains
            both skills uses it. A skill that already needs {dialog.row.name} cannot be chosen.
          </p>
          {view.skills.length <= 1 ? (
            <p className="muted">This goal has no other skills.</p>
          ) : (
            <div className="admin-check-grid">
              {view.skills
                .filter((row) => row.skillId !== dialog.row.skillId)
                .map((row) => {
                  const blocked = findDependents(view.skills, dialog.row.skillId).has(row.skillId)
                  return (
                    <label
                      key={row.skillId}
                      className={`admin-check ${blocked ? 'admin-check-disabled' : ''}`}
                      title={blocked ? `${row.name} already needs ${dialog.row.name}` : undefined}
                    >
                      <input
                        type="checkbox"
                        checked={prereqDraft.includes(row.skillId)}
                        disabled={blocked}
                        onChange={() => togglePrerequisite(row.skillId)}
                      />
                      {row.name}
                    </label>
                  )
                })}
            </div>
          )}
        </Modal>
      )}
    </div>
  )
}

export default AdminGoalSkills