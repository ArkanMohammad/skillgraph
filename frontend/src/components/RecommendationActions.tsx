import { useState } from 'react'
import { FileDown } from 'lucide-react'
import PrintRecommendation from './PrintRecommendation'
import type { RecommendationViewProps } from './RecommendationView'

// The button under a recommendation: download it as a PDF
function RecommendationActions(props: RecommendationViewProps & { verifyUrl: string }) {
  const [printing, setPrinting] = useState(false)

  return (
    <>
      <button type="button" className="btn btn-primary btn-sm" onClick={() => setPrinting(true)}>
        <FileDown size={14} /> Download PDF
      </button>
      {printing && <PrintRecommendation {...props} onDone={() => setPrinting(false)} />}
    </>
  )
}

export default RecommendationActions