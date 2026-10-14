import { ShieldCheck } from 'lucide-react'
import Logo from './Logo'
import type { Recommendation } from '../services/projectService'
import { formatDate } from '../utils/formatDate'
import '../styles/projects.css'

// A recommendation laid out like the paper it will become:
// the SkillGraph name on top, the mentor's own words in the middle,
// the fixed SkillGraph seal at the bottom left and the mentor's signature at the bottom right.
function RecommendationView(props: {
  recommendation: Recommendation
  projectTitle: string
  learnerName: string
  goalName: string
}) {
  const { recommendation, projectTitle, learnerName, goalName } = props

  return (
    <article className="recommendation">
      <header className="recommendation-top">
        <Logo />
      </header>

      <p className="recommendation-eyebrow">Personal recommendation</p>
      <h3 className="recommendation-title">{projectTitle}</h3>
      <p className="muted">
        For <strong>{learnerName}</strong> · {goalName}
      </p>

      <p className="recommendation-body">{recommendation.body}</p>

      <footer className="recommendation-footer">
        <div className="recommendation-seal">
          <ShieldCheck size={28} />
          <div>
            <strong>Issued via SkillGraph</strong>
            <span>Code {recommendation.code}</span>
          </div>
        </div>

        <div className="recommendation-signature">
          <img src={recommendation.signature} alt={`Signature of ${recommendation.mentorName}`} />
          <strong>{recommendation.mentorName}</strong>
          <span>{recommendation.mentorTitle}</span>
          <span>{formatDate(recommendation.issuedAt)}</span>
        </div>
      </footer>

      <p className="recommendation-note">
        This is the personal opinion of one mentor about one project. It is not an official certificate.
      </p>
    </article>
  )
}

export default RecommendationView