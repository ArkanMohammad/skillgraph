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

// Sends a JSON request to the backend and returns the parsed response.
// The login token lives in an httpOnly cookie, so the browser sends it
// automatically as long as credentials: 'include' is set.
export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
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