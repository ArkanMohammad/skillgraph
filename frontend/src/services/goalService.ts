import { apiRequest } from './apiClient'
import type { GoalsResponse } from '../types/api'

// Fetches the list of available career goals
export function getGoals() {
  return apiRequest<GoalsResponse>('/goals')
}

// Saves the user's chosen goal on the server
export function saveSelectedGoal(goalId: number) {
  return apiRequest<{ message: string }>('/goals/select', {
    method: 'PUT',
    body: JSON.stringify({ goalId }),
  })
}