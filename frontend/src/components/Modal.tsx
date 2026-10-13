import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import '../styles/modal.css'

// Window that opens on top of the page. Used by the admin screens for every form and confirmation.
// Escape and the X button always close it. Clicking outside closes it only for read-only windows,
// so a form never loses what the admin typed by accident.
function Modal(props: {
  title: string
  subtitle?: string
  size?: 'md' | 'lg'
  dismissOnOverlay?: boolean
  onClose: () => void
  footer?: ReactNode
  children: ReactNode
}) {
  const { onClose } = props
  const dialogRef = useRef<HTMLDivElement>(null)
  // The parent passes a new onClose function on every render. Keeping it in a ref lets the
  // effect below run only once, so the focus is not pulled back while the admin is typing.
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })

  // Close with Escape, lock the page scroll while open, and move the focus into the window
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onCloseRef.current()
    }
    document.addEventListener('keydown', onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialogRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [])

  return (
    <div className="modal-overlay" onClick={props.dismissOnOverlay ? onClose : undefined}>
      <div
        ref={dialogRef}
        className={`modal modal-${props.size ?? 'md'}`}
        role="dialog"
        aria-modal="true"
        aria-label={props.title}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="modal-header">
          <div>
            <h2>{props.title}</h2>
            {props.subtitle && <p className="muted">{props.subtitle}</p>}
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </header>

        <div className="modal-body">{props.children}</div>

        {props.footer && <footer className="modal-footer">{props.footer}</footer>}
      </div>
    </div>
  )
}

export default Modal