import { useEffect } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../hooks/reduxHooks'
import { fetchCurrentGoal } from '../features/goal/goalSlice'
import { useSignOut } from '../hooks/useSignOut'

// Loads the user's goal from the server, then decides where to go:
// goal found -> show the page, no goal -> /select-goal
function RequireGoal() {
  const dispatch = useAppDispatch()
  const signOut = useSignOut()
  const { selectedGoal, status, error } = useAppSelector((state) => state.goal)

  // Ask the server once per session (the status resets on logout)
  useEffect(() => {
    if (status === 'idle') dispatch(fetchCurrentGoal())
  }, [status, dispatch])

  if (status === 'idle' || status === 'loading') {
    return <p className="muted" style={{ padding: 32 }}>Loading...</p>
  }

  if (status === 'error') {
    return (
      <div style={{ padding: 32 }}>
        <p className="form-error">{error}</p>
        <button className="btn btn-primary" onClick={() => dispatch(fetchCurrentGoal())}>
          Try again
        </button>{' '}
        <button className="btn btn-outline" onClick={signOut}>
          Sign out
        </button>
      </div>
    )
  }

  if (!selectedGoal) {
    return <Navigate to="/select-goal" replace />
  }

  return <Outlet />
}

export default RequireGoal