import { apiRequest } from './apiClient'

export type ShareStatus = 'PENDING' | 'RECOMMENDED' | 'DECLINED'

// A signed recommendation written by a mentor for one project
export type Recommendation = {
  code: string // verification code, for example SG-7KQ2-M9XD-4TPA
  mentorName: string
  mentorTitle: string
  body: string
  signature: string // PNG data URL of the drawn signature
  issuedAt: string
}

// One project the user shared with a mentor
export type MyProject = {
  id: number
  title: string
  description: string
  projectUrl: string | null
  goalName: string
  mentorName: string | null // null when the mentor account no longer exists
  status: ShareStatus
  declineNote: string | null
  createdAt: string
  decidedAt: string | null
  recommendation: Recommendation | null
}

// What the user types in the share form
export type ProjectInput = {
  mentorId: string
  title: string
  description: string
  projectUrl: string
}

// Rules of the form (the server checks them again)
export const LIMITS = {
  titleMin: 3,
  titleMax: 120,
  descriptionMin: 20,
  descriptionMax: 2000,
  urlMax: 500,
}

export function getMyProjects() {
  return apiRequest<{ projects: MyProject[] }>('/projects/mine')
}

export function shareProject(input: ProjectInput) {
  return apiRequest<{ id: number }>('/projects', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

// Takes back a project that is waiting or was declined
export function removeProject(projectId: number) {
  return apiRequest<null>(`/projects/${projectId}`, { method: 'DELETE' })
}