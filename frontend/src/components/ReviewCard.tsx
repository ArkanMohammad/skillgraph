import { Link } from 'react-router-dom'
import { Brain } from 'lucide-react'
import { useReview } from '../hooks/useReview'
import type { ReviewItem } from '../services/reviewService'
import { PATHS } from '../routes/paths'
import '../styles/review.css'

const MAX_SHOWN = 4

const STATUS_LABEL: Record<ReviewItem['status'], string> = {
  FRESH: 'Fresh',
  FADING: 'Fading',
  DUE: 'Review now',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function daysText(days: number) {
  if (days === 0) return 'today'
  return days === 1 ? '1 day ago' : `${days} days ago`
}

// Dashboard card: which mastered skills start to fade from memory (knowledge decay).
// The numbers come from the backend; here they are only displayed.
function ReviewCard() {
  const { queue, loading } = useReview()

  // Nothing mastered yet (or the request failed): there is nothing to review
  if (loading || !queue || queue.items.length === 0) return null

  const needReview = queue.items.filter((item) => item.status !== 'FRESH')
  const shown = needReview.slice(0, MAX_SHOWN)
  const hidden = needReview.length - shown.length
  const upcoming = queue.items.find((item) => item.nextReviewAt === queue.nextReviewAt)

  return (
    <div className="card review-card">
      <div className="review-head">
        <div>
          <h3>
            <Brain size={20} /> Memory check
          </h3>
          <p className="muted">Knowledge fades without practice. Review a skill to keep it strong.</p>
        </div>
        <div className="review-counts">
          {queue.dueCount > 0 && <span className="review-count review-due">{queue.dueCount} to review</span>}
          {queue.fadingCount > 0 && <span className="review-count review-fading">{queue.fadingCount} fading</span>}
          {queue.freshCount > 0 && <span className="review-count review-fresh">{queue.freshCount} fresh</span>}
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="review-ok">
          All {queue.items.length} mastered {queue.items.length === 1 ? 'skill is' : 'skills are'} fresh in your memory.
          {upcoming && ` The next review is around ${formatDate(upcoming.nextReviewAt)}.`}
        </p>
      ) : (
        <div className="review-list">
          {shown.map((item) => (
            <div className="review-row" key={item.skillId}>
              <div className="review-info">
                <div className="review-name">
                  <span>{item.skillName}</span>
                  <span className={`review-tag review-${item.status.toLowerCase()}`}>{STATUS_LABEL[item.status]}</span>
                </div>
                <div className="review-bar" aria-label={`${item.retention}% remembered`}>
                  <span className={`review-fill review-${item.status.toLowerCase()}`} style={{ width: `${item.retention}%` }} />
                </div>
                <span className="muted">
                  {item.retention}% remembered · mastery {item.mastery}% → {item.effectiveMastery}% · tested{' '}
                  {daysText(item.daysSinceTest)}
                </span>
              </div>
              <Link className="btn btn-outline btn-sm" to={PATHS.assessmentQuiz(item.skillId)}>
                Review
              </Link>
            </div>
          ))}
          {hidden > 0 && <p className="muted">and {hidden} more {hidden === 1 ? 'skill' : 'skills'} to review</p>}
        </div>
      )}
    </div>
  )
}

export default ReviewCard