import { useNavigate } from 'react-router-dom'
import { useAppDispatch } from './reduxHooks'
import { logout } from '../features/auth/authSlice'
import { clearGoal } from '../features/goal/goalSlice'
import { logoutRequest } from '../services/authService'

// Returns a function that clears the session and goes back to the login page
export function useSignOut() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  return async function signOut() {
    try {
      await logoutRequest() // backend removes the login cookie
    } catch {
      // Even if the request fails we still log out on the screen
    }
    dispatch(logout())
    dispatch(clearGoal())
    navigate('/login')
  }
}