import { apiRequest } from './apiClient'
import type { AssessmentQuestion, CompleteAssessmentResponse } from '../types/api'

// POST /assessments/start: the server picks the questions one by one (adaptive)
export type StartAssessmentResult = {
  assessmentId: number
  skillId: number
  totalQuestions: number // how many questions this assessment asks
  answeredCount: number // greater than 0 when an unfinished assessment is resumed
  finished: boolean // true when all questions were already answered
  question: AssessmentQuestion | null // the question to show now
}

// POST /assessments/:id/answer: the answer is saved and the next question comes back
export type SubmitAnswerResult = {
  finished: boolean
  answeredCount: number
  totalQuestions: number
  question: AssessmentQuestion | null // null when the assessment is finished
}

// Result of one concept (a sub-skill) inside the assessment
export type ConceptResult = {
  conceptId: number | null
  name: string
  weight: number // 0-100, share of the whole skill
  correct: number
  total: number
  score: number // 0-100, harder questions count more
}

// POST /assessments/:id/complete: the old fields plus the result per concept
export type AssessmentResult = CompleteAssessmentResponse & {
  concepts: ConceptResult[] // weakest concept first
}

// Creates (or resumes) an assessment for a skill and returns the first question
export function startAssessment(skillId: number) {
  return apiRequest<StartAssessmentResult>('/assessments/start', {
    method: 'POST',
    body: JSON.stringify({ skillId }),
  })
}

// Saves one answer (the server checks if it is correct) and returns the next question
export function submitAnswer(assessmentId: number, questionId: number, selectedOptionId: number) {
  return apiRequest<SubmitAnswerResult>(`/assessments/${assessmentId}/answer`, {
    method: 'POST',
    body: JSON.stringify({ questionId, selectedOptionId }),
  })
}

// Finishes the assessment: the server scores it and updates the mastery
export function completeAssessment(assessmentId: number) {
  return apiRequest<AssessmentResult>(`/assessments/${assessmentId}/complete`, {
    method: 'POST',
  })
}