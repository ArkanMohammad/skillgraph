import { apiRequest } from './apiClient'
import type { LoginResponse, User } from '../types/api'

// Sends the user's credentials to the backend and returns token + user
export function login(email: string, password: string) {
  return apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

// Creates a new account. The backend does not return a token here,
// so the user must log in afterwards.
export function register(name: string, email: string, password: string) {
  return apiRequest<{ message: string; user: User }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  })
}