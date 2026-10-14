import { useEffect, useRef, type PointerEvent } from 'react'
import { Eraser } from 'lucide-react'
import '../styles/projects.css'

// Size of the drawing area. The canvas is drawn at double size so the signature stays sharp.
const WIDTH = 480
const HEIGHT = 160
const SCALE = 2
const INK = '#111827'

type Point = { x: number; y: number }

// Canvas where a person draws a signature with the mouse, a finger or a pen.
// onChange gets the signature as a PNG data URL (transparent background), or null when it is empty.
function SignaturePad(props: { onChange: (dataUrl: string | null) => void }) {
  const { onChange } = props
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const last = useRef<Point | null>(null)
  const hasInk = useRef(false)

  // Pen settings (set once)
  useEffect(() => {
    const context = canvasRef.current?.getContext('2d')
    if (!context) return
    context.setTransform(SCALE, 0, 0, SCALE, 0, 0)
    context.lineWidth = 2.5
    context.lineCap = 'round'
    context.lineJoin = 'round'
    context.strokeStyle = INK
    context.fillStyle = INK
  }, [])

  // Position of the pointer inside the drawing area (the canvas can be shown smaller than WIDTH)
  function pointOf(event: PointerEvent<HTMLCanvasElement>): Point {
    const rect = event.currentTarget.getBoundingClientRect()
    return {
      x: ((event.clientX - rect.left) * WIDTH) / rect.width,
      y: ((event.clientY - rect.top) * HEIGHT) / rect.height,
    }
  }

  function handleDown(event: PointerEvent<HTMLCanvasElement>) {
    const context = event.currentTarget.getContext('2d')
    if (!context) return
    event.currentTarget.setPointerCapture(event.pointerId)
    const point = pointOf(event)
    drawing.current = true
    last.current = point
    // A single tap leaves a dot
    context.beginPath()
    context.arc(point.x, point.y, 1.25, 0, Math.PI * 2)
    context.fill()
    hasInk.current = true
  }

  function handleMove(event: PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current || !last.current) return
    const context = event.currentTarget.getContext('2d')
    if (!context) return
    const point = pointOf(event)
    context.beginPath()
    context.moveTo(last.current.x, last.current.y)
    context.lineTo(point.x, point.y)
    context.stroke()
    last.current = point
  }

  // The stroke is finished: tell the parent what the signature looks like now
  function handleUp(event: PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return
    drawing.current = false
    last.current = null
    if (hasInk.current) onChange(event.currentTarget.toDataURL('image/png'))
  }

  function clear() {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return
    context.clearRect(0, 0, WIDTH, HEIGHT)
    hasInk.current = false
    onChange(null)
  }

  return (
    <div className="signature-pad">
      <canvas
        ref={canvasRef}
        className="signature-canvas"
        width={WIDTH * SCALE}
        height={HEIGHT * SCALE}
        aria-label="Signature drawing area"
        onPointerDown={handleDown}
        onPointerMove={handleMove}
        onPointerUp={handleUp}
        onPointerCancel={handleUp}
      />
      <div className="signature-bar">
        <span className="muted">Draw your signature with the mouse, your finger or a pen</span>
        <button type="button" className="btn btn-outline btn-sm" onClick={clear}>
          <Eraser size={14} /> Clear
        </button>
      </div>
    </div>
  )
}

export default SignaturePad