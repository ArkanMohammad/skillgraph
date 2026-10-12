import { AlertTriangle, RotateCw } from 'lucide-react'
import '../styles/error-state.css'

// Friendly error box with an optional Retry button.
// Pages use it instead of a bare red line when their data cannot be loaded.
function ErrorState(props: {
  title?: string
  message: string
  onRetry?: () => void
}) {
  return (
    <div className="error-state" role="alert">
      <div className="error-state-icon">
        <AlertTriangle size={24} />
      </div>
      <h2>{props.title ?? 'Something went wrong'}</h2>
      <p>{props.message}</p>
      {props.onRetry && (
        <div className="error-state-actions">
          <button type="button" className="btn btn-primary" onClick={props.onRetry}>
            <RotateCw size={16} /> Try again
          </button>
        </div>
      )}
    </div>
  )
}

export default ErrorState