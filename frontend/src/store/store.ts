import { configureStore } from '@reduxjs/toolkit'
import authReducer from '../features/auth/authSlice'
import goalReducer from '../features/goal/goalSlice'
import skillsReducer from '../features/skills/skillsSlice'
import assessmentReducer from '../features/assessment/assessmentSlice'
import recommendationReducer from '../features/recommendation/recommendationSlice'

// Creates the global Redux store
export const store = configureStore({
  reducer: {
    auth: authReducer,
    goal: goalReducer,
    skills: skillsReducer,
    assessment: assessmentReducer,
    recommendation: recommendationReducer,
  },
})

// Type representing the entire Redux state
export type RootState = ReturnType<typeof store.getState>

// Type representing the Redux dispatch function
export type AppDispatch = typeof store.dispatch