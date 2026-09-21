import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

// Represents a single assessment question
type Question = {
  id: number
  skillId: number
  conceptId: number
  question: string
  difficulty: number
  options: string[]
}

// Represents an answer submitted by the user
type UserAnswer = {
  questionId: number
  selectedAnswer: string
}

// Represents the assessment state stored in Redux
type AssessmentState = {
  questions: Question[]
  answers: UserAnswer[]
  currentQuestionIndex: number
  isCompleted: boolean
}

// Initial state before an assessment starts
const initialState: AssessmentState = {
  questions: [],
  answers: [],
  currentQuestionIndex: 0,
  isCompleted: false,
}

const assessmentSlice = createSlice({
  name: 'assessment',
  initialState,

  reducers: {
    // Stores the assessment questions
    setQuestions: (state, action: PayloadAction<Question[]>) => {
      state.questions = action.payload
    },

    // Stores an answer submitted by the user
    submitAnswer: (state, action: PayloadAction<UserAnswer>) => {
      state.answers.push(action.payload)
    },

    // Moves the user to the next assessment question
    nextQuestion: (state) => {
      if (state.currentQuestionIndex < state.questions.length - 1) {
        state.currentQuestionIndex += 1
      }
    },

    // Marks the current assessment as completed
    completeAssessment: (state) => {
      state.isCompleted = true
    },

    // Resets the assessment state
    resetAssessment: () => initialState,
  },
})

// Export actions so they can be dispatched from components
export const {
  setQuestions,
  submitAnswer,
  nextQuestion,
  completeAssessment,
  resetAssessment,
} = assessmentSlice.actions

// Export the reducer to register it in the Redux store
export default assessmentSlice.reducer