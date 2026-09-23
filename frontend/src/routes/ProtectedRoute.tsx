import { Navigate, Outlet } from 'react-router-dom'
import { useAppSelector } from '../hooks/reduxHooks'

// Protects routes that require the user to be authenticated
function ProtectedRoute() {
  const isAuthenticated = useAppSelector(
    (state) => state.auth.isAuthenticated
  )

  // Redirects unauthenticated users to the login page
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Renders the matched protected child route
  return <Outlet />
}

export default ProtectedRoute