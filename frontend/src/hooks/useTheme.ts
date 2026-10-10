import { useSyncExternalStore } from 'react'
import { getTheme, setTheme, subscribeTheme } from '../utils/theme'

// Lets any component read the current theme and toggle it
export function useTheme() {
  const theme = useSyncExternalStore(subscribeTheme, getTheme)
  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark')
  return { theme, toggleTheme }
}