import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch } from '../hooks/reduxHooks'
import { loginSuccess } from '../features/auth/authSlice'
import { login } from '../services/authService'
import { ApiError } from '../services/apiClient'

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
      navigate('/select-goal')
    } catch (err) {
      // Show the backend message (e.g. wrong password) or a network error
      setError(err instanceof ApiError ? err.message : 'Cannot reach the server')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>Login</h1>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      {error && <p>{error}</p>}

      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  )
}

export default LoginPage