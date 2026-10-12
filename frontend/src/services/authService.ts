import { apiRequest } from './apiClient'
import type { LoginResponse, User } from '../types/api'

// Sends the user's credentials to the backend (the backend also sets the cookie)
export function login(email: string, password: string) {
  return apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

// Creates a new account. The backend does not log the user in here,
// so the user must log in afterwards.
export function register(name: string, email: string, password: string) {
  return apiRequest<{ message: string; user: User }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  })
}

// Asks the backend who is logged in (uses the cookie). Fails with 401 if nobody is.
export function getMe() {
  return apiRequest<{ user: User }>('/auth/me')
}

// Asks the backend to remove the login cookie
export function logoutRequest() {
  return apiRequest<{ message: string }>('/auth/logout', { method: 'POST' })
}

// Changes the password of the logged-in user (the current password is checked on the server)
export function changePassword(currentPassword: string, newPassword: string) {
  return apiRequest<{ message: string }>('/account/password', {
    method: 'PUT',
    body: JSON.stringify({ currentPassword, newPassword }),
  })
}

// Deletes the account of the logged-in user (the password is checked on the server)
export function deleteAccount(password: string) {
  return apiRequest<{ message: string }>('/account', {
    method: 'DELETE',
    body: JSON.stringify({ password }),
  })
}

// Learning preferences stored on the account
export type Profile = {
  name: string
  email: string
  weeklyHours: number
}

// Loads the profile of the logged-in user (includes the weekly learning hours)
export function getProfile() {
  return apiRequest<Profile>('/account/profile')
}

// Saves the name, the email and the weekly learning hours of the logged-in user
export function updateProfile(name: string, email: string, weeklyHours: number) {
  return apiRequest<Profile>('/account/profile', {
    method: 'PUT',
    body: JSON.stringify({ name, email, weeklyHours }),
  })
}