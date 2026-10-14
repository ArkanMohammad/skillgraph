import { apiRequest } from './apiClient'
import type { SkillStatus, UserRole } from '../types/api'
import type { AdviceItem } from './adviceService'
import type { ProgressSummary, RecentAssessment } from './progressService'

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

// ---------- Users: progress, delete and advice ----------

// One skill of the user's current goal
export type AdminUserSkill = {
  id: number
  name: string
  category: string | null
  state: SkillStatus
  mastery: number // percent 0-100
  requiredMastery: number // percent 0-100
}

// Everything the admin sees about one user
export type AdminUserDetail = {
  id: string
  name: string
  email: string
  role: UserRole
  createdAt: string
  weeklyHours: number | null
  currentGoal: { id: number; name: string } | null
  summary: ProgressSummary | null // null when the user has no goal yet
  assessmentsCompleted: number
  recentAssessments: RecentAssessment[]
  skills: AdminUserSkill[]
  advice: AdviceItem[]
}

export function getAdminUserDetail(userId: string) {
  return apiRequest<AdminUserDetail>(`/admin/users/${userId}`)
}

// Deletes the user and all their data (cannot be undone)
export function deleteAdminUser(userId: string) {
  return apiRequest<{ message: string }>(`/admin/users/${userId}`, { method: 'DELETE' })
}

// Writes an advice that the user sees on their dashboard
export function sendAdminAdvice(userId: string, message: string) {
  return apiRequest<AdviceItem>(`/admin/users/${userId}/advice`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  })
}

// ---------- Content management: skills and questions ----------

export type AdminConcept = { id: number; name: string; weight: number }

// One skill with its question counts
export type AdminSkill = {
  id: number
  name: string
  category: string | null
  description: string | null
  activeQuestions: number
  totalQuestions: number
  goals: number
  concepts: AdminConcept[]
}

export type SkillInput = {
  name: string
  category: string
  description: string
}

export type AdminQuestionOption = { id: number; text: string; isCorrect: boolean }

export type AdminQuestion = {
  id: number
  conceptId: number | null
  conceptName: string | null
  difficulty: number
  prompt: string
  isActive: boolean
  timesAnswered: number
  options: AdminQuestionOption[]
}

export type QuestionInput = {
  conceptId: number
  difficulty: number
  prompt: string
  options: { text: string; isCorrect: boolean }[]
}

export function getAdminSkills() {
  return apiRequest<{ skills: AdminSkill[] }>('/admin/skills')
}

export function createAdminSkill(input: SkillInput) {
  return apiRequest<{ id: number }>('/admin/skills', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function updateAdminSkill(skillId: number, input: SkillInput) {
  return apiRequest<null>(`/admin/skills/${skillId}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export function getAdminQuestions(skillId: number) {
  return apiRequest<{ questions: AdminQuestion[] }>(`/admin/skills/${skillId}/questions`)
}

export function createAdminQuestion(skillId: number, input: QuestionInput) {
  return apiRequest<{ id: number }>(`/admin/skills/${skillId}/questions`, {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function updateAdminQuestion(questionId: number, input: QuestionInput) {
  return apiRequest<null>(`/admin/questions/${questionId}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

// Hides or shows a question (hidden questions are never asked, nothing is deleted)
export function setAdminQuestionActive(questionId: number, isActive: boolean) {
  return apiRequest<null>(`/admin/questions/${questionId}/active`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive }),
  })
}

// ---------- Content management: skills of a goal ----------

export type GoalSkillInput = {
  requiredMastery: number
  importance: number
  estimatedHours: number
}

export type GoalSkillRow = {
  skillId: number
  name: string
  category: string | null
  requiredMastery: number
  importance: number
  estimatedHours: number
  activeQuestions: number
  prerequisiteIds: number[] // prerequisites that are also part of this goal
}

export type AvailableSkillRow = {
  skillId: number
  name: string
  category: string | null
  activeQuestions: number
  canAdd: boolean // false when the skill has too few active questions to be tested
}

export type GoalSkillsView = {
  goal: { id: number; name: string }
  skills: GoalSkillRow[]
  available: AvailableSkillRow[]
}

export function getAdminGoalSkills(goalId: number) {
  return apiRequest<GoalSkillsView>(`/admin/goals/${goalId}/skills`)
}

export function addAdminGoalSkill(goalId: number, skillId: number, input: GoalSkillInput) {
  return apiRequest<{ message: string }>(`/admin/goals/${goalId}/skills`, {
    method: 'POST',
    body: JSON.stringify({ skillId, ...input }),
  })
}

export function updateAdminGoalSkill(goalId: number, skillId: number, input: GoalSkillInput) {
  return apiRequest<null>(`/admin/goals/${goalId}/skills/${skillId}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

// Removes a skill from one goal only: the skill and user progress stay
export function removeAdminGoalSkill(goalId: number, skillId: number) {
  return apiRequest<{ affectedSkills: string[] }>(`/admin/goals/${goalId}/skills/${skillId}`, {
    method: 'DELETE',
  })
}

// What changed after the prerequisites of a skill were saved
export type PrerequisiteChange = {
  added: string[]
  removed: string[]
  alsoAffectedGoals: string[] // other goals that contain both skills of a changed link
}

// Replaces the prerequisites of a skill inside one goal (only skills of that goal)
export function setAdminPrerequisites(goalId: number, skillId: number, prerequisiteIds: number[]) {
  return apiRequest<PrerequisiteChange>(`/admin/goals/${goalId}/skills/${skillId}/prerequisites`, {
    method: 'PUT',
    body: JSON.stringify({ prerequisiteIds }),
  })
}

// ---------- Mentors ----------

// A mentor with the goals they look after (admin view, includes the email)
export type AdminMentor = {
  id: string
  name: string
  email: string
  goals: { id: number; name: string }[]
}

export function getAdminMentors() {
  return apiRequest<{ mentors: AdminMentor[] }>('/admin/mentors')
}

// Assigns a mentor to a goal (created is false when they already looked after it)
export function assignAdminMentor(goalId: number, mentorId: string) {
  return apiRequest<{ created: boolean }>(`/admin/goals/${goalId}/mentors/${mentorId}`, {
    method: 'PUT',
  })
}

// Removes a mentor from a goal (the account stays)
export function removeAdminMentor(goalId: number, mentorId: string) {
  return apiRequest<null>(`/admin/goals/${goalId}/mentors/${mentorId}`, {
    method: 'DELETE',
  })
}