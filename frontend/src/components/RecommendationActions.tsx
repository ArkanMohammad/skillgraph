import { useState } from 'react'
import { Check, FileDown, Link2 } from 'lucide-react'
import PrintRecommendation from './PrintRecommendation'
import type { RecommendationViewProps } from './RecommendationView'

// Two buttons under a recommendation: download it as a PDF, or copy the link that verifies it
function RecommendationActions(props: RecommendationViewProps & { verifyUrl: string }) {
  const [printing, setPrinting] = useState(false)
  const [copied, setCopied] = useState<'yes' | 'failed' | null>(null)

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(props.verifyUrl)
      setCopied('yes')
    } catch {
      setCopied('failed') // the browser refused to use the clipboard
    }
    window.setTimeout(() => setCopied(null), 2500)
  }

  return (
    <>
      <button type="button" className="btn btn-outline btn-sm" onClick={copyLink}>
        {copied === 'yes' ? <Check size={14} /> : <Link2 size={14} />}
        {copied === 'yes' ? 'Link copied' : copied === 'failed' ? 'Copy failed' : 'Copy verification link'}
      </button>
      <button type="button" className="btn btn-primary btn-sm" onClick={() => setPrinting(true)}>
        <FileDown size={14} /> Download PDF
      </button>
      {printing && <PrintRecommendation {...props} onDone={() => setPrinting(false)} />}
    </>
  )
}

export default RecommendationActions