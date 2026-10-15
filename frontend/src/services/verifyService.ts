import { apiRequest } from './apiClient'

// What anybody with the code may see (no email)
export type VerifiedRecommendation = {
  code: string
  projectTitle: string
  projectDescription: string
  learnerName: string
  goalName: string
  mentorName: string
  mentorTitle: string
  body: string
  signature: string // PNG data URL of the drawn signature
  issuedAt: string
}

// Public check: works without logging in
export function verifyRecommendation(code: string) {
  return apiRequest<{ valid: boolean; recommendation: VerifiedRecommendation }>(
    `/verify/${encodeURIComponent(code)}`
  )
}