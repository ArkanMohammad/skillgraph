import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { Goal } from '../../types/api'

// Defines the goal-related state stored in Redux
type GoalState = {
  selectedGoal: Goal | null
}

// Initial state before the user selects a goal
const initialState: GoalState = {
  selectedGoal: null,
}

const goalSlice = createSlice({
  name: 'goal',
  initialState,

  reducers: {
    // Stores the goal selected by the user
    selectGoal: (state, action: PayloadAction<Goal>) => {
      state.selectedGoal = action.payload
    },

    // Removes the currently selected goal
    clearGoal: (state) => {
      state.selectedGoal = null
    },
  },
})

// Export actions so they can be dispatched from components
export const { selectGoal, clearGoal } = goalSlice.actions

// Export the reducer to register it in the Redux store
export default goalSlice.reducer