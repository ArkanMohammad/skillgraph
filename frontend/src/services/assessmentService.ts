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
  return apiRequest<CompleteAssessmentResponse>(`/assessments/${assessmentId}/complete`, {
    method: 'POST',
  })
}