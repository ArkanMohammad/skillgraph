import { apiRequest } from './apiClient'
import type { UserRole } from '../types/api'

// Totals shown on the admin page
export type AdminStats = {
  users: number
  admins: number
  assessmentsCompleted: number
  averageScore: number | null
  usersPerGoal: { goalId: number; name: string; users: number }[]
}

// One row of the users table
export type AdminUser = {
  id: string
  name: string
  email: string
  role: UserRole
  createdAt: string
  currentGoal: string | null
  assessmentsCompleted: number
}

export function getAdminStats() {
  return apiRequest<AdminStats>('/admin/stats')
}

export function getAdminUsers() {
  return apiRequest<{ total: number; users: AdminUser[] }>('/admin/users')
}

// Promotes or demotes one user
export function setUserRole(userId: string, role: UserRole) {
  return apiRequest<{ id: string; name: string; email: string; role: UserRole }>(
    `/admin/users/${userId}/role`,
    { method: 'PUT', body: JSON.stringify({ role }) }
  )
}