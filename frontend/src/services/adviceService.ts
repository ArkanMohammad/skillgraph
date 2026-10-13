import { apiRequest } from './apiClient'

// One advice written by an admin for the logged-in user
export type AdviceItem = {
  id: number
  message: string
  createdAt: string
  readAt: string | null // null = the user has not read it yet
  adminName: string | null // null when that admin account no longer exists
}

// Response of GET /advice
export type AdviceList = {
  advice: AdviceItem[]
  unread: number // how many messages are not read yet
}

// The newest advice for the current user
export function getMyAdvice() {
  return apiRequest<AdviceList>('/advice')
}

export function markAdviceRead(adviceId: number) {
  return apiRequest<{ message: string }>(`/advice/${adviceId}/read`, { method: 'PATCH' })
}

// Marks every unread advice of the current user as read
export function markAllAdviceRead() {
  return apiRequest<{ marked: number }>('/advice/read-all', { method: 'PATCH' })
}