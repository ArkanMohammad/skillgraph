import { useEffect } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../hooks/reduxHooks'
import { restoreSession } from '../features/auth/authSlice'

// Protects routes that require the user to be authenticated
function ProtectedRoute() {
  const dispatch = useAppDispatch()
  const { isAuthenticated, sessionChecked } = useAppSelector((state) => state.auth)

  // After a refresh, ask the backend once if the cookie is still valid
  useEffect(() => {
    if (!sessionChecked) dispatch(restoreSession())
  }, [sessionChecked, dispatch])

  // Wait for the answer before deciding (avoids a flash of the login page)
  if (!sessionChecked) {
    return <p className="muted" style={{ padding: 32 }}>Loading...</p>
  }

  // Redirects unauthenticated users to the login page
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Renders the matched protected child route
  return <Outlet />
}

export default ProtectedRoute