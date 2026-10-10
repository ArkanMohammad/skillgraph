import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../hooks/useTheme'

// Button that switches between dark and light mode
function ThemeToggle({ showLabel = true }: { showLabel?: boolean }) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button className="theme-toggle" type="button" onClick={toggleTheme} aria-label="Toggle theme">
      {isDark ? <Sun size={20} /> : <Moon size={20} />}
      {showLabel && <span className="nav-label">{isDark ? 'Light mode' : 'Dark mode'}</span>}
    </button>
  )
}

export default ThemeToggle