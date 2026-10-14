import { ShieldCheck } from 'lucide-react'
import Logo from './Logo'
import type { Recommendation } from '../services/projectService'
import { formatDate } from '../utils/formatDate'
import '../styles/projects.css'
import '../styles/recommendation-print.css'

export type RecommendationViewProps = {
  recommendation: Recommendation
  projectTitle: string
  learnerName: string
  goalName: string
  verifyUrl?: string // where anybody can check the code, printed under the seal
}

// A recommendation laid out like the paper it will become:
// the SkillGraph name on top, the mentor's own words in the middle,
// the fixed SkillGraph seal at the bottom left and the mentor's signature at the bottom right.
// dir="auto" lets texts written in Arabic (or any right-to-left language) read the right way.
function RecommendationView(props: RecommendationViewProps) {
  const { recommendation, projectTitle, learnerName, goalName, verifyUrl } = props

  return (
    <article className="recommendation">
      <header className="recommendation-top">
        <Logo />
      </header>

      <p className="recommendation-eyebrow">Personal recommendation</p>
      <h3 className="recommendation-title" dir="auto">
        {projectTitle}
      </h3>
      <p className="muted" dir="auto">
        For <strong>{learnerName}</strong> · {goalName}
      </p>

      <p className="recommendation-body" dir="auto">
        {recommendation.body}
      </p>

      <footer className="recommendation-footer">
        <div className="recommendation-seal">
          <ShieldCheck size={28} />
          <div>
            <strong>Issued via SkillGraph</strong>
            <span>Code {recommendation.code}</span>
            {verifyUrl && (
              <a className="recommendation-verify" href={verifyUrl}>
                Verify: {verifyUrl.replace(/^https?:\/\//, '')}
              </a>
            )}
          </div>
        </div>

        <div className="recommendation-signature">
          <img src={recommendation.signature} alt={`Signature of ${recommendation.mentorName}`} />
          <strong dir="auto">{recommendation.mentorName}</strong>
          <span dir="auto">{recommendation.mentorTitle}</span>
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