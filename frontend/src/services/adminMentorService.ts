import { apiRequest } from './apiClient'
import type { AdminMentor } from './adminService'

// What the admin types to create a new mentor account
export type NewMentorInput = {
  name: string
  email: string
  password: string
  goalIds: number[]
}

// Rules of the form (the server checks them again)
export const MENTOR_LIMITS = {
  nameMax: 100,
  passwordMin: 8,
  passwordMax: 72,
}

// Creates a brand new account with the role MENTOR (and the goals it starts with)
export function createAdminMentor(input: NewMentorInput) {
  return apiRequest<{ mentor: AdminMentor }>('/admin/mentors', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}