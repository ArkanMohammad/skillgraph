export type Theme = 'light' | 'dark'

const listeners = new Set<() => void>()

// Follows the device preference (nothing is saved in the browser)
function readInitial(): Theme {
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
  listeners.forEach((listener) => listener())
}

export function subscribeTheme(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}