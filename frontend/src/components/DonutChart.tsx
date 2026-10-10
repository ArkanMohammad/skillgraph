// Circular progress indicator. percent is 0-100.
function DonutChart({ percent }: { percent: number }) {
  const radius = 60
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - percent / 100)

  return (
    <div className="donut">
      <svg width="170" height="170" viewBox="0 0 170 170">
        <circle cx="85" cy="85" r={radius} fill="none" stroke="var(--border)" strokeWidth="14" />
        <circle
          cx="85"
          cy="85"
          r={radius}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 85 85)"
        />
      </svg>
      <div className="donut-label">
        <strong>{percent}%</strong>
        <span>complete</span>
      </div>
    </div>
  )
}

export default DonutChart