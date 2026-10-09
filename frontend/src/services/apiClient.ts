import { store } from '../store/store'

// Base URL of the backend API, read from the Vite environment
const API_URL = import.meta.env.VITE_API_URL as string

// Error type that keeps the HTTP status, so callers can react to 401/404/etc.
export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

// Sends a JSON request to the backend and returns the parsed response
export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  // Read the JWT from the Redux store (null if the user is logged out)
  const token = store.getState().auth.token

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      // Attach the token only when it exists
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  // Body may be empty or invalid JSON, so parsing must not crash
  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new ApiError(response.status, data?.message ?? 'Request failed')
  }

  return data as T
}