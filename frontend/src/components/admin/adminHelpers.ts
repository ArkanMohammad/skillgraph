import { ApiError } from '../../services/apiClient'

// Turns any thrown error into a message for the screen
export function getMessage(err: unknown) {
  return err instanceof ApiError ? err.message : 'Cannot reach the server'
}

export const DIFFICULTY_LABELS: Record<number, string> = {
  1: 'Easy',
  2: 'Medium',
  3: 'Hard',
}

export const DIFFICULTY_BADGES: Record<number, string> = {
  1: 'badge-mastered',
  2: 'badge-ready',
  3: 'badge-hard',
}