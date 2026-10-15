import Logo from './Logo'
import SkillGraphSeal from './SkillGraphSeal'
import type { Recommendation } from '../services/projectService'
import { formatDate } from '../utils/formatDate'
import '../styles/projects.css'
import '../styles/recommendation-print.css'

export type RecommendationViewProps = {
  recommendation: Recommendation
  projectTitle: string
  projectDescription: string
  learnerName: string
  goalName: string
  verifyUrl?: string // the seal becomes a link to the page that checks the recommendation
}

// A recommendation laid out like the paper it will become:
// the title and who wrote it for whom, the project, the mentor's own words,
// the SkillGraph seal at the bottom left and the mentor's signature at the bottom right.
// dir="auto" lets texts written in Arabic (or any right-to-left language) read the right way.
function RecommendationView(props: RecommendationViewProps) {
  const { recommendation, projectTitle, projectDescription, learnerName, goalName, verifyUrl } = props

  return (
    <article className="recommendation">
      <header className="recommendation-top">
        <Logo />
      </header>

      <h3 className="recommendation-title">Feedback Project and Personal Recommendation</h3>
      <p className="recommendation-from" dir="auto">
        From the mentor <strong>{recommendation.mentorName}</strong>
      </p>
      <p className="recommendation-for" dir="auto">
        For <strong>{learnerName}</strong> · {goalName}
      </p>

      <section className="recommendation-section">
        <p className="recommendation-label">Project description</p>
        <p className="recommendation-project-title" dir="auto">
          {projectTitle}
        </p>
        <p className="recommendation-text" dir="auto">
          {projectDescription}
        </p>
      </section>

      <section className="recommendation-section recommendation-section-grow">
        <p className="recommendation-label">Recommendation</p>
        <p className="recommendation-body" dir="auto">
          {recommendation.body}
        </p>
      </section>

      <footer className="recommendation-footer">
        <div className="recommendation-issued">
          <strong>Issued via SkillGraph</strong>
          {verifyUrl ? (
            <a
              className="recommendation-seal-link"
              href={verifyUrl}
              title="Verify this recommendation"
              aria-label="Verify this recommendation on SkillGraph"
            >
              <SkillGraphSeal />
            </a>
          ) : (
            <SkillGraphSeal />
          )}
        </div>

        <div className="recommendation-signature">
          <img src={recommendation.signature} alt={`Signature of ${recommendation.mentorName}`} />
          <strong dir="auto">{recommendation.mentorName}</strong>
          <span dir="auto">{recommendation.mentorTitle}</span>
          <span>{formatDate(recommendation.issuedAt)}</span>
        </div>
      </footer>
    </article>
  )
}

export default RecommendationView