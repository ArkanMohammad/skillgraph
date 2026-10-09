import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { User } from '../../types/api'

// Defines the authentication state stored in Redux
type AuthState = {
  user: User | null
  token: string | null
  isAuthenticated: boolean
}

// Key used to store the session in the browser
const STORAGE_KEY = 'skillgraph_auth'

// Reads a saved session from localStorage (if any) when the app starts
function loadAuth(): AuthState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const { user, token } = JSON.parse(saved)
      if (user && token) return { user, token, isAuthenticated: true }
    }
  } catch {
    // Ignore corrupted or blocked storage
  }
  return { user: null, token: null, isAuthenticated: false }
}

// Initial state: restored session if it exists, otherwise logged out
const initialState: AuthState = loadAuth()

const authSlice = createSlice({
  name: 'auth',
  initialState,

  reducers: {
    // Stores the user and JWT token after a successful login
    loginSuccess: (
      state,
      action: PayloadAction<{ user: User; token: string }>
    ) => {
      state.user = action.payload.user
      state.token = action.payload.token
      state.isAuthenticated = true

      // Persist the session so a page refresh keeps the user logged in
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ user: action.payload.user, token: action.payload.token })
        )
      } catch {
        // Storage may be unavailable (private mode); the session just won't persist
      }
    },

    // Clears authentication data when the user logs out
    logout: (state) => {
      state.user = null
      state.token = null
      state.isAuthenticated = false

      // Remove the saved session
      try {
        localStorage.removeItem(STORAGE_KEY)
      } catch {
        // Ignore storage errors
      }
    },
  },
})

// Export actions so they can be dispatched from components
export const { loginSuccess, logout } = authSlice.actions

// Export the reducer to register it in the Redux store
export default authSlice.reducer