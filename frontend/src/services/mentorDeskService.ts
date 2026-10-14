import { apiRequest } from './apiClient'
import type { ShareStatus } from './projectService'

// One project that a learner shared with the logged-in mentor
export type MentorRequest = {
  id: number
  learnerName: string
  goalName: string
  title: string
  description: string
  projectUrl: string | null
  status: ShareStatus
  declineNote: string | null
  createdAt: string
  decidedAt: string | null
  code: string | null // the code of the recommendation, once it is written
}

export type RecommendationInput = {
  body: string
  mentorTitle: string
  signature: string // PNG data URL
}

// Rules of the form (the server checks them again)
export const RECOMMENDATION_LIMITS = {
  bodyMin: 50,
  bodyMax: 2000,
  titleMin: 2,
  titleMax: 80,
  noteMax: 300,
  signatureMax: 80000, // characters of the data URL (the request must stay small)
}

export function getMentorRequests() {
  return apiRequest<{ requests: MentorRequest[] }>('/mentor/requests')
}

// Writes and signs the recommendation. Returns its verification code.
export function sendRecommendation(requestId: number, input: RecommendationInput) {
  return apiRequest<{ code: string }>(`/mentor/requests/${requestId}/recommendation`, {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function declineMentorRequest(requestId: number, note: string) {
  return apiRequest<{ message: string }>(`/mentor/requests/${requestId}/decline`, {
    method: 'POST',
    body: JSON.stringify({ note }),
  })
}