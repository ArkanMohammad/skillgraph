import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { Goal } from '../../types/api'

// Defines the goal-related state stored in Redux
type GoalState = {
  selectedGoal: Goal | null
}

// Key used to store the selected goal in the browser
const STORAGE_KEY = 'skillgraph_goal'

// Reads the saved goal (if any) when the app starts
function loadGoal(): Goal | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? (JSON.parse(saved) as Goal) : null
  } catch {
    return null // Ignore corrupted or blocked storage
  }
}

// Initial state: restored goal if it exists, otherwise none
const initialState: GoalState = {
  selectedGoal: loadGoal(),
}

const goalSlice = createSlice({
  name: 'goal',
  initialState,

  reducers: {
    // Stores the goal selected by the user and persists it
    selectGoal: (state, action: PayloadAction<Goal>) => {
      state.selectedGoal = action.payload
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(action.payload))
      } catch {
        // Storage may be unavailable; the goal just won't persist
      }
    },

    // Removes the currently selected goal (also used on logout)
    clearGoal: (state) => {
      state.selectedGoal = null
      try {
        localStorage.removeItem(STORAGE_KEY)
      } catch {
        // Ignore storage errors
      }
    },
  },
})

// Export actions so they can be dispatched from components
export const { selectGoal, clearGoal } = goalSlice.actions

// Export the reducer to register it in the Redux store
export default goalSlice.reducer