import { useState, type FormEvent } from 'react'
import type { AdminSkill, SkillInput } from '../../services/adminService'
import { getMessage } from './adminHelpers'

// Form to create a skill or edit its name, category and description
function SkillForm(props: {
  skill: AdminSkill | null // null = create a new skill
  categories: string[] // existing categories, offered as suggestions
  onSave: (input: SkillInput) => Promise<void>
  onCancel: () => void
}) {
  const [name, setName] = useState(props.skill?.name ?? '')
  const [category, setCategory] = useState(props.skill?.category ?? '')
  const [description, setDescription] = useState(props.skill?.description ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      await props.onSave({ name, category, description })
    } catch (err) {
      setError(getMessage(err))
      setSaving(false)
    }
  }

  return (
    <form className="card admin-panel" onSubmit={handleSubmit}>
      <h3>{props.skill ? 'Edit skill' : 'New skill'}</h3>
      {error && <p className="form-error">{error}</p>}

      <div className="admin-form-grid">
        <label className="field">
          <span>Name</span>
          <input
            className="input"
            value={name}
            maxLength={150}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label className="field">
          <span>Category</span>
          <input
            className="input"
            list="admin-categories"
            value={category}
            maxLength={100}
            onChange={(e) => setCategory(e.target.value)}
          />
          <datalist id="admin-categories">
            {props.categories.map((item) => (
              <option key={item} value={item} />
            ))}
          </datalist>
        </label>
        <label className="field admin-form-wide">
          <span>Description (optional)</span>
          <textarea
            className="input"
            value={description}
            maxLength={1000}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
      </div>

      {!props.skill && (
        <p className="muted">
          A new skill needs at least 10 active questions before it can be added to a goal.
        </p>
      )}

      <div className="admin-actions">
        <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
          {saving ? 'Saving...' : 'Save skill'}
        </button>
        <button type="button" className="btn btn-outline btn-sm" onClick={props.onCancel}>
          Cancel
        </button>
      </div>
    </form>
  )
}

export default SkillForm