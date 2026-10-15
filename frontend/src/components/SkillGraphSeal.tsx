import { useId } from 'react'

// The stamp of SkillGraph: two rings, the name around the edge, the graph mark in the middle
// and a flowing signature line under it. It is a picture (SVG), so it prints sharp at any size.
function SkillGraphSeal(props: { size?: number }) {
  const size = props.size ?? 96
  // Every seal needs its own id for the text on the circle (a page can show two of them)
  const arcId = `seal-arc-${useId().replace(/:/g, '')}`
  const ink = '#4f46e5'

  return (
    <svg className="recommendation-seal-svg" width={size} height={size} viewBox="0 0 120 120" aria-hidden="true">
      <defs>
        <path id={arcId} d="M 60 60 m -42.5 0 a 42.5 42.5 0 1 1 85 0 a 42.5 42.5 0 1 1 -85 0" />
      </defs>

      <g fill="none" stroke={ink}>
        <circle cx="60" cy="60" r="57" strokeWidth="2" />
        <circle cx="60" cy="60" r="53.5" strokeWidth="0.7" />
        <circle cx="60" cy="60" r="32" strokeWidth="0.9" />
        <circle cx="60" cy="60" r="30" strokeWidth="0.4" strokeDasharray="1.2 1.6" />
      </g>

      <text fontFamily="Arial, Helvetica, sans-serif" fontSize="7.6" fontWeight="700" fill={ink}>
        <textPath href={`#${arcId}`} textLength="262" lengthAdjust="spacing">
          SKILLGRAPH • SIGNED RECOMMENDATION •{' '}
        </textPath>
      </text>

      <g stroke={ink} strokeWidth="1.5" strokeLinecap="round">
        <line x1="53" y1="47" x2="67" y2="41" />
        <line x1="53" y1="47" x2="67" y2="53" />
        <line x1="67" y1="41" x2="67" y2="53" />
      </g>
      <g fill={ink}>
        <circle cx="53" cy="47" r="3.8" />
        <circle cx="67" cy="41" r="3" />
        <circle cx="67" cy="53" r="3" />
      </g>

      <path
        d="M 36 79 C 42 62, 53 61, 53.5 69 C 54 78, 43 84, 43 76 C 43 68, 66 66, 85 69"
        fill="none"
        stroke={ink}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M 50 83 C 62 80, 74 80, 86 82" fill="none" stroke={ink} strokeWidth="0.8" strokeLinecap="round" />
    </svg>
  )
}

export default SkillGraphSeal