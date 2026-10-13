import { useEffect, useState } from 'react'
import { Eye, EyeOff, Pencil, Plus } from 'lucide-react'
import {
  createAdminQuestion,
  createAdminSkill,
  getAdminQuestions,
  getAdminSkills,
  setAdminQuestionActive,
  updateAdminQuestion,
  updateAdminSkill,
  type AdminQuestion,
  type AdminSkill,
  type QuestionInput,
  type SkillInput,
} from '../../services/adminService'
import ErrorState from '../ErrorState'
import QuestionForm from './QuestionForm'
import SkillForm from './SkillForm'
import { DIFFICULTY_BADGES, DIFFICULTY_LABELS, getMessage } from './adminHelpers'

// Tab to manage the questions of one skill (add, edit, hide/show) and to create skills
function AdminQuestions() {
  const [skills, setSkills] = useState<AdminSkill[]>([])
  const [skillId, setSkillId] = useState<number | null>(null)
  const [questions, setQuestions] = useState<AdminQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null) // the page could not load
  const [notice, setNotice] = useState<string | null>(null) // an action failed
  const [editing, setEditing] = useState<AdminQuestion | 'new' | null>(null)
  const [skillForm, setSkillForm] = useState<'new' | 'edit' | null>(null)
  const [attempt, setAttempt] = useState(0) // bumped to fetch again

  // Skills (with their question counts)
  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const data = await getAdminSkills()
        if (cancelled) return
        setSkills(data.skills)
        setSkillId((current) => current ?? data.skills[0]?.id ?? null)
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

  // Questions of the selected skill
  useEffect(() => {
    if (skillId === null) return
    let cancelled = false

    async function load(id: number) {
      try {
        const data = await getAdminQuestions(id)
        if (!cancelled) setQuestions(data.questions)
      } catch (err) {
        if (!cancelled) setNotice(getMessage(err))
      }
    }

    load(skillId)
    return () => {
      cancelled = true
    }
  }, [skillId, attempt])

  function refresh() {
    setAttempt((n) => n + 1)
  }

  function retry() {
    setLoading(true)
    setError(null)
    refresh()
  }

  function handleSkillChange(id: number) {
    setSkillId(id)
    setQuestions([])
    setEditing(null)
    setSkillForm(null)
    setNotice(null)
  }

  async function saveSkill(input: SkillInput) {
    if (skillForm === 'edit' && skillId !== null) {
      await updateAdminSkill(skillId, input)
    } else {
      const created = await createAdminSkill(input)
      setQuestions([])
      setSkillId(created.id)
    }
    setSkillForm(null)
    refresh()
  }

  async function saveQuestion(input: QuestionInput) {
    if (skillId === null || editing === null) return
    if (editing === 'new') {
      await createAdminQuestion(skillId, input)
    } else {
      await updateAdminQuestion(editing.id, input)
    }
    setEditing(null)
    refresh()
  }

  async function toggleActive(question: AdminQuestion) {
    setNotice(null)
    try {
      await setAdminQuestionActive(question.id, !question.isActive)
      refresh()
    } catch (err) {
      setNotice(getMessage(err))
    }
  }

  if (loading) return <p className="muted">Loading skills...</p>
  if (error) {
    return <ErrorState title="Could not load skills" message={error} onRetry={retry} />
  }

  const skill = skills.find((item) => item.id === skillId) ?? null
  const categories = Array.from(
    new Set(skills.map((item) => item.category).filter((item): item is string => !!item))
  )

  return (
    <div>
      <div className="card admin-panel">
        <div className="admin-toolbar">
          <label className="field">
            <span>Skill</span>
            <select
              className="input"
              value={skillId ?? ''}
              onChange={(e) => handleSkillChange(Number(e.target.value))}
            >
              {skills.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <div className="admin-actions">
            {skill && (
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setSkillForm('edit')}
              >
                <Pencil size={14} /> Edit skill
              </button>
            )}
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => setSkillForm('new')}
            >
              <Plus size={14} /> New skill
            </button>
          </div>
        </div>
        {skill && (
          <p className="muted">
            {skill.activeQuestions} active of {skill.totalQuestions} questions. Used in{' '}
            {skill.goals} {skill.goals === 1 ? 'goal' : 'goals'}. A skill needs at least 10 active
            questions.
          </p>
        )}
      </div>

      {skillForm && (
        <SkillForm
          key={skillForm}
          skill={skillForm === 'edit' ? skill : null}
          categories={categories}
          onSave={saveSkill}
          onCancel={() => setSkillForm(null)}
        />
      )}

      {skill && editing && (
        <QuestionForm
          key={editing === 'new' ? 'new' : editing.id}
          skill={skill}
          question={editing === 'new' ? null : editing}
          onSave={saveQuestion}
          onCancel={() => setEditing(null)}
        />
      )}

      {skill && (
        <div className="card card-flush">
          <h3>Questions</h3>
          {notice && <p className="form-error admin-flush-message">{notice}</p>}
          <div className="admin-flush-message">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setEditing('new')}
            >
              <Plus size={14} /> Add question
            </button>
          </div>
          {questions.length === 0 ? (
            <p className="muted admin-flush-message">This skill has no questions yet.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Question</th>
                  <th>Concept</th>
                  <th>Level</th>
                  <th>Answered</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {questions.map((question) => (
                  <tr key={question.id} className={question.isActive ? '' : 'admin-row-hidden'}>
                    <td className="admin-prompt">{question.prompt}</td>
                    <td className="muted">{question.conceptName ?? '—'}</td>
                    <td>
                      <span className={`badge ${DIFFICULTY_BADGES[question.difficulty]}`}>
                        {DIFFICULTY_LABELS[question.difficulty]}
                      </span>
                    </td>
                    <td>{question.timesAnswered}</td>
                    <td>
                      {question.isActive ? (
                        <span className="badge badge-mastered">Active</span>
                      ) : (
                        <span className="badge badge-locked">Hidden</span>
                      )}
                    </td>
                    <td>
                      <div className="admin-actions">
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={() => setEditing(question)}
                        >
                          <Pencil size={14} /> Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={() => toggleActive(question)}
                        >
                          {question.isActive ? (
                            <>
                              <EyeOff size={14} /> Hide
                            </>
                          ) : (
                            <>
                              <Eye size={14} /> Show
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}

export default AdminQuestions