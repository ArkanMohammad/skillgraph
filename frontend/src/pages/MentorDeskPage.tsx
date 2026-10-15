import { useEffect, useState } from 'react'
import { Ban, ExternalLink, PenLine } from 'lucide-react'
import {
  RECOMMENDATION_LIMITS as LIMITS,
  declineMentorRequest,
  getMentorRequests,
  sendRecommendation,
  type MentorRequest,
} from '../services/mentorDeskService'
import { ApiError } from '../services/apiClient'
import ErrorState from '../components/ErrorState'
import Modal from '../components/Modal'
import SignaturePad from '../components/SignaturePad'
import { formatDate } from '../utils/formatDate'
import '../styles/pages.css'
import '../styles/admin.css'
import '../styles/projects.css'

type Notice = { type: 'ok' | 'error'; text: string }

function getMessage(err: unknown) {
  return err instanceof ApiError || err instanceof Error ? err.message : 'Something went wrong'
}

// What the mentor sees about one project, shown at the top of both windows
function ProjectSummary(props: { request: MentorRequest }) {
  const { request } = props
  return (
    <div className="project-summary">
      <h3>{request.title}</h3>
      <p className="muted">
        From {request.learnerName} · {request.goalName} · {formatDate(request.createdAt)}
      </p>
      <p className="project-description">{request.description}</p>
      {request.projectUrl && (
        <a className="project-link" href={request.projectUrl} target="_blank" rel="noopener noreferrer">
          <ExternalLink size={14} /> {request.projectUrl}
        </a>
      )}
    </div>
  )
}

// Mentor desk: the projects learners shared with you. Write a signed recommendation or decline.
function MentorDeskPage() {
  const [requests, setRequests] = useState<MentorRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null) // the list could not load
  const [attempt, setAttempt] = useState(0) // bumped to fetch again
  const [notice, setNotice] = useState<Notice | null>(null)

  const [writing, setWriting] = useState<MentorRequest | null>(null)
  const [mentorTitle, setMentorTitle] = useState('')
  const [body, setBody] = useState('')
  const [signature, setSignature] = useState<string | null>(null)

  const [declining, setDeclining] = useState<MentorRequest | null>(null)
  const [note, setNote] = useState('')

  const [busy, setBusy] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false // ignore the result if the page was left meanwhile

    async function load() {
      try {
        const data = await getMentorRequests()
        if (!cancelled) setRequests(data.requests)
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

  function reload() {
    setLoading(true)
    setError(null)
    setAttempt((n) => n + 1)
  }

  function startWriting(request: MentorRequest) {
    setNotice(null)
    setModalError(null)
    setBody('')
    setSignature(null)
    setWriting(request)
  }

  function startDeclining(request: MentorRequest) {
    setNotice(null)
    setModalError(null)
    setNote('')
    setDeclining(request)
  }

  async function handleSign() {
    if (!writing) return
    const cleanBody = body.trim()
    const cleanTitle = mentorTitle.trim()
    if (cleanTitle.length < LIMITS.titleMin) return setModalError('Write your profession, for example "Software Engineer"')
    if (cleanBody.length < LIMITS.bodyMin) return setModalError(`The recommendation needs at least ${LIMITS.bodyMin} characters`)
    if (!signature) return setModalError('Draw your signature first')
    if (signature.length > LIMITS.signatureMax) {
      return setModalError('The signature is too detailed. Clear it and draw it again with fewer strokes')
    }

    setBusy(true)
    setModalError(null)
    try {
      const result = await sendRecommendation(writing.id, { body: cleanBody, mentorTitle: cleanTitle, signature })
      setNotice({ type: 'ok', text: `The recommendation for ${writing.learnerName} was signed. Its code is ${result.code}.` })
      setWriting(null)
      reload()
    } catch (err) {
      setModalError(getMessage(err))
    } finally {
      setBusy(false)
    }
  }

  async function handleDecline() {
    if (!declining) return
    setBusy(true)
    setModalError(null)
    try {
      await declineMentorRequest(declining.id, note.trim())
      setNotice({ type: 'ok', text: `The project of ${declining.learnerName} was declined.` })
      setDeclining(null)
      reload()
    } catch (err) {
      setModalError(getMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const waiting = requests.filter((item) => item.status === 'PENDING')
  const answered = requests.filter((item) => item.status !== 'PENDING')

  return (
    <div>
      <p className="page-eyebrow">Mentor</p>
      <h1 className="page-title">Mentor desk</h1>
      <p className="muted">
        Learners of your goals share their projects here. Write a short personal recommendation and sign it by
        drawing your signature, or decline politely.
      </p>

      {notice && (
        <p className={notice.type === 'ok' ? 'admin-notice admin-notice-ok' : 'form-error'}>{notice.text}</p>
      )}

      {loading ? (
        <p className="muted">Loading requests...</p>
      ) : error ? (
        <ErrorState title="Could not load your requests" message={error} onRetry={reload} />
      ) : (
        <>
          <h2 className="projects-heading">Waiting for you ({waiting.length})</h2>
          {waiting.length === 0 ? (
            <div className="card">
              <p className="muted">No project is waiting for you.</p>
            </div>
          ) : (
            <div className="projects-list">
              {waiting.map((request) => (
                <div className="card project-item" key={request.id}>
                  <ProjectSummary request={request} />
                  <div className="project-actions">
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => startWriting(request)}>
                      <PenLine size={14} /> Write a recommendation
                    </button>
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => startDeclining(request)}>
                      <Ban size={14} /> Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {answered.length > 0 && (
            <>
              <h2 className="projects-heading">Answered</h2>
              <div className="card card-flush">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Project</th>
                      <th>Learner</th>
                      <th>Answer</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {answered.map((request) => (
                      <tr key={request.id}>
                        <td>{request.title}</td>
                        <td>{request.learnerName}</td>
                        <td>
                          {request.status === 'RECOMMENDED' ? (
                            <span className="badge badge-mastered">Signed {request.code}</span>
                          ) : (
                            <span className="badge badge-locked">Declined</span>
                          )}
                        </td>
                        <td className="muted">{request.decidedAt ? formatDate(request.decidedAt) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}

      {writing && (
        <Modal
          title="Write a recommendation"
          subtitle="This is your personal opinion about this project. It is not an official certificate."
          size="lg"
          onClose={() => setWriting(null)}
          footer={
            <>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setWriting(null)}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={handleSign}>
                <PenLine size={14} /> {busy ? 'Signing...' : 'Sign and send'}
              </button>
            </>
          }
        >
          {modalError && <p className="form-error">{modalError}</p>}
          <ProjectSummary request={writing} />

          <label className="field">
            <span>Your profession</span>
            <input
              className="input"
              value={mentorTitle}
              maxLength={LIMITS.titleMax}
              placeholder="For example: Software Engineer"
              dir="auto"
              onChange={(e) => setMentorTitle(e.target.value)}
            />
          </label>

          <label className="field">
            <span>Your recommendation</span>
            <textarea
              className="input projects-body-input"
              value={body}
              maxLength={LIMITS.bodyMax}
              placeholder="Write in your own words what you saw in this project: what is strong, and what the learner can do well."
              onChange={(e) => setBody(e.target.value)}
            />
            <span className="muted projects-counter">
              {body.length} / {LIMITS.bodyMax} (at least {LIMITS.bodyMin})
            </span>
          </label>

          <div className="field">
            <span>Your signature</span>
            <SignaturePad onChange={setSignature} />
          </div>
        </Modal>
      )}

      {declining && (
        <Modal
          title="Decline this project?"
          size="md"
          onClose={() => setDeclining(null)}
          footer={
            <>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setDeclining(null)}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary btn-sm admin-danger-solid" disabled={busy} onClick={handleDecline}>
                <Ban size={14} /> {busy ? 'Declining...' : 'Decline'}
              </button>
            </>
          }
        >
          {modalError && <p className="form-error">{modalError}</p>}
          <p>
            <strong>{declining.title}</strong> from {declining.learnerName} will be marked as declined.
          </p>
          <label className="field">
            <span>A short note for the learner (optional)</span>
            <textarea
              className="input"
              value={note}
              maxLength={LIMITS.noteMax}
              placeholder="For example: Please add tests and send it again."
              onChange={(e) => setNote(e.target.value)}
            />
          </label>
        </Modal>
      )}
    </div>
  )
}

export default MentorDeskPage