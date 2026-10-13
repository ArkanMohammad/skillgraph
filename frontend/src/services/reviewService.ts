import { apiRequest } from './apiClient'

// How fresh a mastered skill is in the user's memory
export type MemoryStatus = 'FRESH' | 'FADING' | 'DUE'

// One mastered skill with its memory health (percentages are 0-100)
export type ReviewItem = {
  skillId: number
  skillName: string
  category: string | null
  mastery: number // stored mastery
  requiredMastery: number
  lastAssessedAt: string
  retention: number // how much is still remembered
  effectiveMastery: number // mastery after forgetting
  daysSinceTest: number
  halfLifeDays: number
  status: MemoryStatus
  nextReviewAt: string // when the review becomes due
  daysUntilReview: number // 0 when it is due already
}

// Response of GET /review
export type ReviewQueue = {
  goal: { id: number; name: string }
  items: ReviewItem[] // most forgotten first
  dueCount: number
  fadingCount: number
  freshCount: number
  nextReviewAt: string | null // earliest upcoming review among skills that are not due yet
}

// Asks the backend which mastered skills of the current goal are fading from memory
export function getReviewQueue() {
  return apiRequest<ReviewQueue>('/review')
}