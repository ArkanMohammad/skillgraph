import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

// Represents the authenticated user's basic information
type User = {
  id: number
  name: string
  email: string
  role: 'user' | 'admin'
}

// Defines the authentication state stored in Redux
type AuthState = {
  user: User | null
  token: string | null
  isAuthenticated: boolean
}

// Initial authentication state before the user logs in
const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
}

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
    },

    // Clears authentication data when the user logs out
    logout: (state) => {
      state.user = null
      state.token = null
      state.isAuthenticated = false
    },
  },
})

// Export actions so they can be dispatched from components
export const { loginSuccess, logout } = authSlice.actions

// Export the reducer to register it in the Redux store
export default authSlice.reducer