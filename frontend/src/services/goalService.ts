import { apiRequest } from './apiClient'
import type { Goal, GoalsResponse } from '../types/api'

// Fetches the list of available career goals
export function getGoals() {
  return apiRequest<GoalsResponse>('/goals')
}

// Fetches the goal the logged-in user selected (null if none yet), stored in PostgreSQL
export function getCurrentGoal() {
  return apiRequest<{ goal: Goal | null }>('/goals/current')
}

// Saves the user's chosen goal on the server
export function saveSelectedGoal(goalId: number) {
  return apiRequest<{ message: string }>('/goals/select', {
    method: 'PUT',
    body: JSON.stringify({ goalId }),
  })
}