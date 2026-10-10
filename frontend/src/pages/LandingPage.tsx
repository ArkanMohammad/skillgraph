import { Link } from 'react-router-dom'
import Logo from '../components/Logo'
import ThemeToggle from '../components/ThemeToggle'
import './LandingPage.css'

// Every call-to-action on this page leads to the register page
const REGISTER = '/register'

// Numbers shown under the hero buttons
const STATS = [
  { value: '2,400+', label: 'Active learners' },
  { value: '7', label: 'Career paths' },
  { value: '95%', label: 'Goal clarity' },
]

// "How SkillGraph works" cards
const STEPS = [
  {
    title: 'Choose your goal',
    text: 'Select from 7 career paths — Full Stack, Frontend, Data Analyst, and more.',
  },
  {
    title: 'Assess your skills',
    text: 'Our adaptive engine tests your current knowledge at the right depth.',
  },
  {
    title: 'Discover skill gaps',
    text: 'See exactly where you stand against what the role requires.',
  },
  {
    title: 'Get your Next Best Skill',
    text: 'The system recommends one focused skill to learn next, tailored to your graph.',
  },
  {
    title: 'Track your progress',
    text: 'Watch your skill graph grow as you master each concept.',
  },
]

// Career goal cards (the numbers are marketing text, not real data)
const GOALS = [
  { icon: '⚡', name: 'Full Stack Developer', skills: 14, tint: '#eef0ff' },
  { icon: '🎨', name: 'Frontend Developer', skills: 10, tint: '#e8f6f8' },
  { icon: '⚙️', name: 'Backend Developer', skills: 11, tint: '#e8f7ee' },
  { icon: '📊', name: 'Data Analyst', skills: 9, tint: '#fef3e8' },
  { icon: '🔒', name: 'Cybersecurity Specialist', skills: 12, tint: '#fdecec' },
  { icon: '✦', name: 'UI/UX Designer', skills: 8, tint: '#f1ecfd' },
  { icon: '🚀', name: 'DevOps Engineer', skills: 13, tint: '#eaf0fd' },
]

function LandingPage() {
  // Smooth scroll to the "How it works" section
  function scrollToHow() {
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="land">
      {/* ---------- Top bar ---------- */}
      <header className="land-nav">
        <Logo />
        <div className="land-nav-actions">
          <ThemeToggle showLabel={false} />
          <Link to="/login" className="land-signin">
            Sign in
          </Link>
          <Link to={REGISTER} className="btn btn-primary land-nav-btn">
            Get started
          </Link>
        </div>
      </header>

      {/* ---------- Hero ---------- */}
      <section className="land-hero">
        <div>
          <span className="land-pill">
            <i className="land-pill-dot" />
            Intelligent skill navigation
          </span>

          <h1 className="land-title">
            Know where you are.
            <span className="land-title-accent">Discover what to learn next.</span>
          </h1>

          <p className="land-lead">
            SkillGraph analyzes your current skills and builds a dynamic learning path
            toward your career goal.
          </p>

          <div className="land-cta">
            <Link to={REGISTER} className="btn btn-primary land-btn-lg">
              Start Your SkillGraph
            </Link>
            <button type="button" className="btn btn-outline land-btn-lg" onClick={scrollToHow}>
              Explore How It Works
            </button>
          </div>

          <div className="land-stats">
            {STATS.map((stat) => (
              <div key={stat.label}>
                <div className="land-stat-value">{stat.value}</div>
                <div className="land-stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Decorative skill graph (static SVG) */}
        <div className="land-graph" aria-hidden="true">
          <svg viewBox="0 0 440 440" width="100%">
            {/* prerequisite lines */}
            <g stroke="var(--border)" strokeWidth="2" fill="none">
              <line x1="120" y1="50" x2="220" y2="165" />
              <line x1="320" y1="50" x2="220" y2="165" />
              <line x1="220" y1="165" x2="110" y2="285" />
              <line x1="220" y1="165" x2="330" y2="285" />
              <line x1="110" y1="285" x2="220" y2="395" />
              <line x1="330" y1="285" x2="220" y2="395" />
            </g>

            {/* mastered */}
            <circle cx="120" cy="50" r="32" fill="var(--surface)" stroke="var(--mastered)" strokeWidth="3" />
            <text x="120" y="54" textAnchor="middle" className="land-node-text" fill="var(--mastered)">HTML</text>
            <circle cx="320" cy="50" r="32" fill="var(--surface)" stroke="var(--mastered)" strokeWidth="3" />
            <text x="320" y="54" textAnchor="middle" className="land-node-text" fill="var(--mastered)">CSS</text>

            {/* learning */}
            <circle cx="220" cy="165" r="32" fill="var(--surface)" stroke="var(--learning)" strokeWidth="3" />
            <text x="220" y="169" textAnchor="middle" className="land-node-text" fill="var(--learning)">JavaScript</text>

            {/* ready (with dashed outer ring) */}
            <circle cx="110" cy="285" r="41" fill="none" stroke="var(--learning)" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
            <circle cx="110" cy="285" r="34" fill="var(--surface)" stroke="var(--ready)" strokeWidth="4" />
            <text x="110" y="289" textAnchor="middle" className="land-node-text" fill="var(--ready)">React</text>

            {/* locked */}
            <circle cx="330" cy="285" r="32" fill="var(--surface)" stroke="var(--border)" strokeWidth="3" />
            <text x="330" y="289" textAnchor="middle" className="land-node-text" fill="var(--locked)" opacity="0.7">Node.js</text>
            <circle cx="220" cy="395" r="32" fill="var(--surface)" stroke="var(--border)" strokeWidth="3" />
            <text x="220" y="399" textAnchor="middle" className="land-node-text" fill="var(--locked)" opacity="0.7">TypeScript</text>
          </svg>

          <div className="land-legend">
            <span><i style={{ background: 'var(--mastered)' }} /> Mastered</span>
            <span><i style={{ background: 'var(--learning)' }} /> Learning</span>
            <span><i style={{ background: 'var(--ready)' }} /> Ready</span>
            <span><i style={{ background: 'var(--locked)' }} /> Locked</span>
          </div>
        </div>
      </section>

      {/* ---------- How it works ---------- */}
      <section id="how-it-works" className="land-section land-section-tint">
        <div className="land-container">
          <h2 className="land-h2">How SkillGraph works</h2>
          <p className="land-sub">A systematic approach to bridging skill gaps.</p>

          <div className="land-steps">
            {STEPS.map((step, index) => (
              <div key={step.title} className="card land-step">
                <span className="land-step-number">{String(index + 1).padStart(2, '0')}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
                {index < STEPS.length - 1 && <span className="land-arrow">→</span>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Career goals ---------- */}
      <section className="land-section">
        <div className="land-container">
          <h2 className="land-h2">Choose your career goal</h2>
          <p className="land-sub">SkillGraph maps exactly what you need to learn for each path.</p>

          <div className="land-goals">
            {GOALS.map((goal) => (
              <Link key={goal.name} to={REGISTER} className="card land-goal">
                <span className="land-goal-icon" style={{ background: goal.tint }}>
                  {goal.icon}
                </span>
                <h3>{goal.name}</h3>
                <p>{goal.skills} core skills</p>
              </Link>
            ))}

            <Link to={REGISTER} className="land-goal land-goal-cta">
              <small>Ready to start?</small>
              <strong>Begin your journey →</strong>
            </Link>
          </div>
        </div>
      </section>

      <footer className="land-footer">
        © 2026 SkillGraph. Intelligent skill navigation for modern careers.
      </footer>
    </div>
  )
}

export default LandingPage