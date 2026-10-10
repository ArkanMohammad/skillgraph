export type Theme = 'light' | 'dark'

const KEY = 'skillgraph_theme'
const listeners = new Set<() => void>()

// Saved choice first, otherwise follow the device preference
function readInitial(): Theme {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    // Storage may be unavailable; fall through to the device preference
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

let current: Theme = readInitial()
// The CSS reads this attribute: :root[data-theme='dark'] { ... }
document.documentElement.dataset.theme = current

export function getTheme(): Theme {
  return current
}

export function setTheme(theme: Theme) {
  current = theme
  document.documentElement.dataset.theme = theme
  try {
    localStorage.setItem(KEY, theme)
  } catch {
    // Ignore storage errors; the theme still changes for this session
  }
  listeners.forEach((listener) => listener())
}

export function subscribeTheme(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}