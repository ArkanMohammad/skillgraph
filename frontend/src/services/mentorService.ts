import { apiRequest } from './apiClient'

// A mentor as a learner sees them (no email)
export type PublicMentor = { id: string; name: string }

// Response of GET /mentors/mine
export type MyMentors = {
  goal: { id: number; name: string }
  mentors: PublicMentor[]
}

// Asks the backend for the mentors of the goal the user follows
export function getMyMentors() {
  return apiRequest<MyMentors>('/mentors/mine')
}