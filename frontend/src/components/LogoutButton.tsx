import { useNavigate } from 'react-router-dom'
import { useAppDispatch } from '../hooks/reduxHooks'
import { logout } from '../features/auth/authSlice'
import { clearGoal } from '../features/goal/goalSlice'

function LogoutButton() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  function handleLogout() {
    dispatch(logout()) // clears user, token and the saved session
    dispatch(clearGoal()) // clears the selected goal from the previous user
    navigate('/login')
  }

  return <button onClick={handleLogout}>Logout</button>
}

export default LogoutButton