import { Navigate, Outlet } from 'react-router-dom'
import { useAppSelector } from '../hooks/reduxHooks'
import { PATHS } from './paths'

// Lets only admins through. This only hides the page: the real protection is the
// server, which answers 403 on every /admin request from a non-admin.
function RequireAdmin() {
  const role = useAppSelector((state) => state.auth.user?.role)

  if (role !== 'ADMIN') {
    return <Navigate to={PATHS.dashboard} replace />
  }

  return <Outlet />
}

export default RequireAdmin