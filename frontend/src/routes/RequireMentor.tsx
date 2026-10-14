import { Navigate, Outlet } from 'react-router-dom'
import { useAppSelector } from '../hooks/reduxHooks'
import { PATHS } from './paths'

// Lets only mentors through. This only hides the page: the real protection is the
// server, which answers 403 on every /mentor request from someone who is not a mentor.
function RequireMentor() {
  const role = useAppSelector((state) => state.auth.user?.role)

  if (role !== 'MENTOR') {
    return <Navigate to={PATHS.dashboard} replace />
  }

  return <Outlet />
}

export default RequireMentor