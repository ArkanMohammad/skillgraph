import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { User } from '../../types/api'
import { getMe } from '../../services/authService'

// Defines the authentication state stored in Redux (memory only).
// The real login proof is the httpOnly cookie managed by the browser.
type AuthState = {
  user: User | null
  isAuthenticated: boolean
  // false until we asked the backend "who is logged in?" once after page load
  sessionChecked: boolean
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  sessionChecked: false,
}

// After a page refresh: ask the backend if the cookie is still valid
export const restoreSession = createAsyncThunk('auth/restoreSession', async () => {
  const data = await getMe()
  return data.user
})

const authSlice = createSlice({
  name: 'auth',
  initialState,

  reducers: {
    // Stores the user after a successful login (a token in the payload is ignored)
    loginSuccess: (state, action: PayloadAction<{ user: User; token?: string }>) => {
      state.user = action.payload.user
      state.isAuthenticated = true
      state.sessionChecked = true
    },

    // Clears the user when logging out (sessionChecked stays true: we know the answer)
    logout: (state) => {
      state.user = null
      state.isAuthenticated = false
      state.sessionChecked = true
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(restoreSession.fulfilled, (state, action) => {
        state.user = action.payload
        state.isAuthenticated = true
        state.sessionChecked = true
      })
      // 401 or network error: simply not logged in
      .addCase(restoreSession.rejected, (state) => {
        state.user = null
        state.isAuthenticated = false
        state.sessionChecked = true
      })
  },
})

// Export actions so they can be dispatched from components
export const { loginSuccess, logout } = authSlice.actions

// Export the reducer to register it in the Redux store
export default authSlice.reducer