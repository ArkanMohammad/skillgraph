import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppDispatch } from '../hooks/reduxHooks'
import { loginSuccess } from '../features/auth/authSlice'
import { login } from '../services/authService'
import { ApiError } from '../services/apiClient'
import AuthLayout from '../components/AuthLayout'

function LoginPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  // Local form state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault() // stop the browser from reloading the page
    setError(null)
    setLoading(true)

    try {
      const data = await login(email, password)
      // Save user + token in Redux (this also makes ProtectedRoute pass)
      dispatch(loginSuccess({ user: data.user, token: data.token }))
      // Always go to the dashboard. RequireGoal sends the user to
      // /select-goal automatically if no goal is selected yet.
      navigate('/dashboard')
    } catch (err) {
      // Show the backend message (e.g. wrong password) or a network error
      setError(err instanceof ApiError ? err.message : 'Cannot reach the server')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Welcome back</h1>
        <p className="auth-sub">Sign in to continue your learning journey.</p>

        <label className="field">
          <span>Email</span>
          <input
            className="input"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label className="field">
          <span>Password</span>
          <input
            className="input"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        {error && <p className="form-error">{error}</p>}

        <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>

        <p className="auth-footer">
          Don't have an account? <Link to="/register">Create one</Link>
        </p>
      </form>
    </AuthLayout>
  )
}

export default LoginPage