import { useNavigate } from 'react-router-dom'
import { useAppDispatch } from './reduxHooks'
import { logout } from '../features/auth/authSlice'
import { clearGoal } from '../features/goal/goalSlice'

// Returns a function that clears the session and goes back to the login page
export function useSignOut() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  return function signOut() {
    dispatch(logout())
    dispatch(clearGoal())
    navigate('/login')
  }
}