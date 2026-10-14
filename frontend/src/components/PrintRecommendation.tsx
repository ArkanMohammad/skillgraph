import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import RecommendationView, { type RecommendationViewProps } from './RecommendationView'

// Opens the print window of the browser with the recommendation alone on an A4 page.
// The user chooses "Save as PDF" there. The page is drawn by the browser, so names and texts in any
// language (Arabic included) come out right, and no extra library is needed.
// It is drawn outside of the app (in a portal), and the print styles hide the app while printing.
function PrintRecommendation(props: RecommendationViewProps & { onDone: () => void }) {
  const { onDone, ...view } = props
  const sheetRef = useRef<HTMLDivElement>(null)
  // The parent passes a new onDone function on every render, so the effect below keeps it in a ref
  const onDoneRef = useRef(onDone)
  useEffect(() => {
    onDoneRef.current = onDone
  })

  const code = view.recommendation.code

  useEffect(() => {
    // Chrome and Firefox use the page title as the first file name of "Save as PDF"
    const previousTitle = document.title
    document.title = `SkillGraph recommendation ${code}`
    let cancelled = false

    function finish() {
      document.title = previousTitle
      onDoneRef.current()
    }

    async function run() {
      // Wait for the signature picture, so it is not missing from the PDF
      const picture = sheetRef.current?.querySelector('img')
      try {
        await picture?.decode()
      } catch {
        // Print anyway: a broken picture must not block the button
      }
      if (cancelled) return
      window.addEventListener('afterprint', finish, { once: true })
      window.print()
    }

    run()
    return () => {
      cancelled = true
      window.removeEventListener('afterprint', finish)
      document.title = previousTitle
    }
  }, [code])

  return createPortal(
    <div className="print-sheet" ref={sheetRef}>
      <RecommendationView {...view} />
    </div>,
    document.body
  )
}

export default PrintRecommendation