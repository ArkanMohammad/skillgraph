import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { Goal } from '../../types/api'
import { getCurrentGoal } from '../../services/goalService'
import { ApiError } from '../../services/apiClient'

// idle = not asked the server yet, loading = request running,
// ready = we know the answer (goal or null), error = request failed
type GoalStatus = 'idle' | 'loading' | 'ready' | 'error'

type GoalState = {
  selectedGoal: Goal | null
  status: GoalStatus
  error: string | null
}

const initialState: GoalState = {
  selectedGoal: null,
  status: 'idle',
  error: null,
}

// Asks the backend (PostgreSQL) which goal the logged-in user selected
export const fetchCurrentGoal = createAsyncThunk<Goal | null, void, { rejectValue: string }>(
  'goal/fetchCurrent',
  async (_, { rejectWithValue }) => {
    try {
      const data = await getCurrentGoal()
      return data.goal
    } catch (err) {
      return rejectWithValue(err instanceof ApiError ? err.message : 'Cannot reach the server')
    }
  }
)

const goalSlice = createSlice({
  name: 'goal',
  initialState,

  reducers: {
    // Called after the goal was saved on the server
    selectGoal: (state, action: PayloadAction<Goal>) => {
      state.selectedGoal = action.payload
      state.status = 'ready'
      state.error = null
    },

    // Resets everything (used on logout) so the next user starts clean
    clearGoal: (state) => {
      state.selectedGoal = null
      state.status = 'idle'
      state.error = null
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchCurrentGoal.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchCurrentGoal.fulfilled, (state, action) => {
        state.selectedGoal = action.payload
        state.status = 'ready'
      })
      .addCase(fetchCurrentGoal.rejected, (state, action) => {
        state.status = 'error'
        state.error = action.payload ?? 'Something went wrong'
      })
  },
})

export const { selectGoal, clearGoal } = goalSlice.actions

export default goalSlice.reducer