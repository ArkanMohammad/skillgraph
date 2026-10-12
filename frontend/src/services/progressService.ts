import { apiRequest } from './apiClient'

// Progress of one skill category (e.g. Frontend), percent is 0-100
export type CategoryProgress = {
  category: string
  totalSkills: number
  masteredSkills: number
  percent: number
}

// Numbers for the current goal
export type ProgressSummary = {
  totalSkills: number
  masteredSkills: number
  percent: number
  hoursRemaining: number
  categories: CategoryProgress[]
}

// One finished assessment
export type RecentAssessment = {
  assessmentId: number
  skillId: number
  skillName: string
  score: number
  completedAt: string
}

// Response of GET /progress
export type ProgressOverview = {
  goal: { id: number; name: string }
  summary: ProgressSummary
  assessmentsCompleted: number
  recentAssessments: RecentAssessment[]
}

// Progress of the user in one goal (used when choosing or changing the goal)
export type GoalProgress = {
  goalId: number
  name: string
  totalSkills: number
  masteredSkills: number
  percent: number
}

// Progress of the current goal
export function getProgress() {
  return apiRequest<ProgressOverview>('/progress')
}

// Progress in every goal: shows how much a new goal is already covered by existing skills
export function getGoalsProgress() {
  return apiRequest<{ goals: GoalProgress[] }>('/progress/goals')
}