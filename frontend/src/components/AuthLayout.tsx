import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import Logo from './Logo'
import ThemeToggle from './ThemeToggle'

import './AuthLayout.css'

// Shared layout for Login and Register: image on the left half + centered content
function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="auth-page">
      <aside className="auth-aside">
        <Logo />

        <div>
          <p className="auth-quote">
            "SkillGraph told me exactly what to learn next. In 4 months I went
            from junior to mid-level frontend."
          </p>
          <div className="auth-author">
            <span className="auth-avatar">MA</span>
            <div>
              <strong>Marcus Alves</strong>
              <div className="auth-role">Frontend Developer</div>
            </div>
          </div>
        </div>

        <small className="auth-copy">© 2026 SkillGraph</small>
      </aside>

      <main className="auth-main">
        {/* Top left corner of the right half: goes back to the landing page */}
        <Link to="/" className="auth-back">
          <ArrowLeft size={18} />
          Back
        </Link>

        {/* Top right corner of the right half */}
        <div className="auth-theme">
          <ThemeToggle showLabel={false} />
        </div>

        {children}
      </main>
    </div>
  )
}

export default AuthLayout