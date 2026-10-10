// Thin progress bar. value is a percentage (0-100).
function ProgressBar({ value, tone }: { value: number; tone?: 'mastered' }) {
  const width = Math.max(0, Math.min(100, value))
  return (
    <div className={`bar ${tone ? `bar-${tone}` : ''}`}>
      <span style={{ width: `${width}%` }} />
    </div>
  )
}

export default ProgressBar