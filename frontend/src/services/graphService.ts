import { apiRequest } from './apiClient'
import type { GraphResponse } from '../types/api'

// Fetches the skill nodes and prerequisite edges for one career goal
export function getGraph(goalId: number) {
  return apiRequest<GraphResponse>(`/graph/${goalId}`)
}