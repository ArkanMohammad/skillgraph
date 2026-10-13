import { useState, type FormEvent } from 'react'
import type { AdminQuestion, AdminSkill, QuestionInput } from '../../services/adminService'
import { DIFFICULTY_LABELS, getMessage } from './adminHelpers'

// Form to add a question or edit an existing one (4 answers, exactly one correct).
// The parent gives it a key, so it starts fresh for every question.
function QuestionForm(props: {
  skill: AdminSkill
  question: AdminQuestion | null // null = add a new question
  onSave: (input: QuestionInput) => Promise<void>
  onCancel: () => void
}) {
  const { skill, question } = props

  const [conceptId, setConceptId] = useState<number>(question?.conceptId ?? skill.concepts[0]?.id ?? 0)
  const [difficulty, setDifficulty] = useState<number>(question?.difficulty ?? 2)
  const [prompt, setPrompt] = useState(question?.prompt ?? '')
  const [texts, setTexts] = useState<string[]>(
    question ? question.options.map((option) => option.text) : ['', '', '', '']
  )
  const [correct, setCorrect] = useState<number>(
    question ? Math.max(0, question.options.findIndex((option) => option.isCorrect)) : 0
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function setText(index: number, value: string) {
    setTexts((list) => list.map((item, i) => (i === index ? value : item)))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      await props.onSave({
        conceptId,
        difficulty,
        prompt,
        options: texts.map((text, index) => ({ text, isCorrect: index === correct })),
      })
    } catch (err) {
      setError(getMessage(err))
      setSaving(false)
    }
  }

  return (
    <form className="card admin-panel" onSubmit={handleSubmit}>
      <h3>{question ? 'Edit question' : `New question for ${skill.name}`}</h3>
      {question && question.timesAnswered > 0 && (
        <p className="muted">
          Users answered this question {question.timesAnswered} times. Their saved scores do not
          change.
        </p>
      )}
      {error && <p className="form-error">{error}</p>}

      <div className="admin-form-grid">
        <label className="field">
          <span>Concept</span>
          <select
            className="input"
            value={conceptId}
            onChange={(e) => setConceptId(Number(e.target.value))}
          >
            {skill.concepts.map((concept) => (
              <option key={concept.id} value={concept.id}>
                {concept.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Difficulty</span>
          <select
            className="input"
            value={difficulty}
            onChange={(e) => setDifficulty(Number(e.target.value))}
          >
            {[1, 2, 3].map((level) => (
              <option key={level} value={level}>
                {DIFFICULTY_LABELS[level]}
              </option>
            ))}
          </select>
        </label>
        <label className="field admin-form-wide">
          <span>Question</span>
          <textarea
            className="input"
            value={prompt}
            maxLength={500}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </label>
      </div>

      <div className="field">
        <span>Answers (select the correct one)</span>
        {texts.map((text, index) => (
          <div className="admin-option-row" key={index}>
            <input
              type="radio"
              name="correct-option"
              checked={correct === index}
              onChange={() => setCorrect(index)}
              aria-label={`Answer ${index + 1} is correct`}
            />
            <input
              className="input"
              value={text}
              maxLength={300}
              placeholder={`Answer ${index + 1}`}
              onChange={(e) => setText(index, e.target.value)}
            />
          </div>
        ))}
      </div>

      <div className="admin-actions">
        <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
          {saving ? 'Saving...' : 'Save question'}
        </button>
        <button type="button" className="btn btn-outline btn-sm" onClick={props.onCancel}>
          Cancel
        </button>
      </div>
    </form>
  )
}

export default QuestionForm