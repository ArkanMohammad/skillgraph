import { apiRequest } from './apiClient'
import type { CompleteAssessmentResponse, StartAssessmentResponse } from '../types/api'

// Creates an assessment for a skill and returns its questions
export function startAssessment(skillId: number) {
  return apiRequest<StartAssessmentResponse>('/assessments/start', {
    method: 'POST',
    body: JSON.stringify({ skillId }),
  })
}

// Saves one answer (the server checks if it is correct)
export function submitAnswer(assessmentId: number, questionId: number, selectedOptionId: number) {
  return apiRequest<{ message: string }>(`/assessments/${assessmentId}/answer`, {
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