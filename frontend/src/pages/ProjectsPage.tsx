import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink, FileText, Send, Trash2 } from 'lucide-react'
import { useAppSelector } from '../hooks/reduxHooks'
import { useMyMentors } from '../hooks/useMyMentors'
import {
  LIMITS,
  getMyProjects,
  removeProject,
  shareProject,
  type MyProject,
  type ShareStatus,
} from '../services/projectService'
import { ApiError } from '../services/apiClient'
import ErrorState from '../components/ErrorState'
import Modal from '../components/Modal'
import RecommendationActions from '../components/RecommendationActions'
import RecommendationView from '../components/RecommendationView'
import { PATHS } from '../routes/paths'
import { formatDate } from '../utils/formatDate'
import { buildVerifyUrl } from '../utils/verifyUrl'
import '../styles/pages.css'
import '../styles/admin.css'
import '../styles/projects.css'

type Notice = { type: 'ok' | 'error'; text: string }

const STATUS_LABEL: Record<ShareStatus, { text: string; badge: string }> = {
  PENDING: { text: 'Waiting for the mentor', badge: 'badge-ready' },
  RECOMMENDED: { text: 'Recommended', badge: 'badge-mastered' },
  DECLINED: { text: 'Declined', badge: 'badge-locked' },
}

function getMessage(err: unknown) {
  return err instanceof ApiError || err instanceof Error ? err.message : 'Something went wrong'
}

// Projects: share a project with a mentor of your goal and keep the signed recommendations you receive
function ProjectsPage() {
  const user = useAppSelector((state) => state.auth.user)
  const { data: mentorData, loading: mentorsLoading } = useMyMentors()

  const [projects, setProjects] = useState<MyProject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null) // the list could not load
  const [attempt, setAttempt] = useState(0) // bumped to fetch again
  const [notice, setNotice] = useState<Notice | null>(null)

  const [mentorId, setMentorId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [projectUrl, setProjectUrl] = useState('')
  const [sending, setSending] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [viewing, setViewing] = useState<MyProject | null>(null)

  useEffect(() => {
    let cancelled = false // ignore the result if the page was left meanwhile

    async function load() {
      try {
        const data = await getMyProjects()
        if (!cancelled) setProjects(data.projects)
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

  const mentors = mentorData?.mentors ?? []
  // With a single mentor there is nothing to choose
  const chosenMentor = mentorId || (mentors.length === 1 ? mentors[0].id : '')

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setFormError(null)
    setNotice(null)

    const cleanTitle = title.trim()
    const cleanDescription = description.trim()
    if (!chosenMentor) return setFormError('Choose a mentor')
    if (cleanTitle.length < LIMITS.titleMin) return setFormError(`The title needs at least ${LIMITS.titleMin} characters`)
    if (cleanDescription.length < LIMITS.descriptionMin) {
      return setFormError(`Describe the project in at least ${LIMITS.descriptionMin} characters`)
    }

    setSending(true)
    try {
      await shareProject({
        mentorId: chosenMentor,
        title: cleanTitle,
        description: cleanDescription,
        projectUrl: projectUrl.trim(),
      })
      setTitle('')
      setDescription('')
      setProjectUrl('')
      setNotice({ type: 'ok', text: 'Your project was sent. You will see the answer of the mentor here.' })
      reload()
    } catch (err) {
      setFormError(getMessage(err))
    } finally {
      setSending(false)
    }
  }

  async function handleRemove(project: MyProject) {
    setNotice(null)
    try {
      await removeProject(project.id)
      setProjects((list) => list.filter((item) => item.id !== project.id))
    } catch (err) {
      setNotice({ type: 'error', text: getMessage(err) })
    }
  }

  return (
    <div>
      <p className="page-eyebrow">Mentors</p>
      <h1 className="page-title">My projects</h1>
      <p className="muted">
        Share a project with a mentor of your goal. If the mentor likes it, they write a personal recommendation and
        sign it. A recommendation is the opinion of one person, not an official certificate.
      </p>

      <div className="card projects-form-card">
        <h3>Share a project</h3>

        {mentorsLoading ? (
          <p className="muted">Loading mentors...</p>
        ) : mentors.length === 0 ? (
          <p className="muted">
            No mentor looks after your goal yet, so there is nobody to share a project with. An admin assigns mentors
            to goals. <Link to={PATHS.dashboard}>Back to the dashboard</Link>
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
            {formError && <p className="form-error">{formError}</p>}

            <label className="field">
              <span>Mentor</span>
              <select
                className="input"
                value={chosenMentor}
                onChange={(e) => setMentorId(e.target.value)}
                disabled={mentors.length === 1}
              >
                {mentors.length > 1 && <option value="">Choose a mentor</option>}
                {mentors.map((mentor) => (
                  <option key={mentor.id} value={mentor.id}>
                    {mentor.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Project title</span>
              <input
                className="input"
                value={title}
                maxLength={LIMITS.titleMax}
                placeholder="For example: Personal portfolio website"
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>

            <label className="field">
              <span>What did you build, and what did you use?</span>
              <textarea
                className="input"
                value={description}
                maxLength={LIMITS.descriptionMax}
                placeholder="Tell the mentor what the project does, which tools you used and what you are proud of."
                onChange={(e) => setDescription(e.target.value)}
              />
              <span className="muted projects-counter">
                {description.length} / {LIMITS.descriptionMax}
              </span>
            </label>

            <label className="field">
              <span>Link to the project (optional)</span>
              <input
                className="input"
                value={projectUrl}
                maxLength={LIMITS.urlMax}
                placeholder="https://github.com/you/your-project"
                onChange={(e) => setProjectUrl(e.target.value)}
              />
            </label>

            <button type="submit" className="btn btn-primary" disabled={sending}>
              <Send size={16} /> {sending ? 'Sending...' : 'Send to the mentor'}
            </button>
          </form>
        )}
      </div>

      {notice && (
        <p className={notice.type === 'ok' ? 'admin-notice admin-notice-ok' : 'form-error'}>{notice.text}</p>
      )}

      <h2 className="projects-heading">Shared projects</h2>

      {loading ? (
        <p className="muted">Loading your projects...</p>
      ) : error ? (
        <ErrorState title="Could not load your projects" message={error} onRetry={reload} />
      ) : projects.length === 0 ? (
        <div className="card">
          <p className="muted">You have not shared a project yet.</p>
        </div>
      ) : (
        <div className="projects-list">
          {projects.map((project) => {
            const status = STATUS_LABEL[project.status]
            return (
              <div className="card project-item" key={project.id}>
                <div className="project-head">
                  <h3>{project.title}</h3>
                  <span className={`badge ${status.badge}`}>{status.text}</span>
                </div>
                <p className="muted">
                  {project.mentorName ? `Shared with ${project.mentorName}` : 'The mentor is no longer available'} ·{' '}
                  {formatDate(project.createdAt)} · {project.goalName}
                </p>
                <p className="project-description">{project.description}</p>
                {project.projectUrl && (
                  <a className="project-link" href={project.projectUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink size={14} /> {project.projectUrl}
                  </a>
                )}
                {project.status === 'DECLINED' && project.declineNote && (
                  <p className="project-note">
                    <strong>Note from the mentor:</strong> {project.declineNote}
                  </p>
                )}

                <div className="project-actions">
                  {project.recommendation && (
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => setViewing(project)}>
                      <FileText size={14} /> View recommendation
                    </button>
                  )}
                  {project.status !== 'RECOMMENDED' && (
                    <button type="button" className="btn btn-outline btn-sm admin-danger" onClick={() => handleRemove(project)}>
                      <Trash2 size={14} /> {project.status === 'PENDING' ? 'Take back' : 'Remove'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {viewing && viewing.recommendation && (
        <Modal
          title="Recommendation"
          size="lg"
          dismissOnOverlay
          onClose={() => setViewing(null)}
          footer={
            <RecommendationActions
              recommendation={viewing.recommendation}
              projectTitle={viewing.title}
              learnerName={user?.name ?? ''}
              goalName={viewing.goalName}
              verifyUrl={buildVerifyUrl(viewing.recommendation.code)}
            />
          }
        >
          <RecommendationView
            recommendation={viewing.recommendation}
            projectTitle={viewing.title}
            learnerName={user?.name ?? ''}
            goalName={viewing.goalName}
            verifyUrl={buildVerifyUrl(viewing.recommendation.code)}
          />
        </Modal>
      )}
    </div>
  )
}

export default ProjectsPage