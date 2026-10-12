import { apiRequest } from './apiClient'

// Why a skill was recommended (built by the backend from the factor scores)
export type Explanation = {
  summary: string // one sentence for the user
  reasons: string[] // the strongest reasons, best first
  unlocksCount: number // how many not-mastered skills come after this one
  margin: number | null // utility points ahead of the runner-up
}

// Score of each factor, 0-100
export type FactorScores = {
  goalImpact: number
  readiness: number
  unlockPotential: number
  gapPriority: number
  timeEfficiency: number
}

// One ranked skill (mastery values are percentages 0-100)
export type RankedSkill = {
  skillId: number
  skillName: string
  category: string | null
  utilityScore: number
  currentMastery: number
  requiredMastery: number
  gap: number
  estimatedHours: number
  factors: FactorScores
  contributions: FactorScores
  explanation: Explanation
}

// Response of GET /recommendations/next
export type Recommendation = {
  goal: { id: number; name: string }
  goalComplete: boolean // true when every skill of the goal is mastered
  next: RankedSkill | null // the Next Best Skill
  candidates: RankedSkill[] // all ready skills, best first
}

// Asks the backend for the Next Best Skill (always calculated from the latest progress)
export function getNextRecommendation() {
  return apiRequest<Recommendation>('/recommendations/next')
}