import { Component, type ErrorInfo, type ReactNode } from 'react'
import ErrorState from './ErrorState'

// Catches a crash while rendering any screen, so the user never sees a blank page.
// Network errors are handled by each page; this is the last safety net.
class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Screen crashed:', error, info.componentStack)
  }

  // Go back to the start page with a fresh load, which also resets the broken state
  handleReload = () => {
    window.location.assign('/')
  }

  render() {
    if (!this.state.failed) return this.props.children

    return (
      <div className="error-boundary">
        <ErrorState
          title="This page crashed"
          message="An unexpected error happened. Reload to continue; your progress is saved."
          onRetry={this.handleReload}
        />
      </div>
    )
  }
}

export default ErrorBoundary