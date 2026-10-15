import { Link } from 'react-router-dom'
import { Check, X } from 'lucide-react'
import Logo from '../components/Logo'
import ThemeToggle from '../components/ThemeToggle'
import { PATHS } from '../routes/paths'
import '../styles/plans.css'

type Feature = { text: string; included: boolean }

type Plan = {
  id: string
  name: string
  price: string
  period: string
  note: string
  badge?: string
  button: string
  features: Feature[]
}

// The plans are information only for now: no payment is taken and no rule is enforced.
// Change the prices here and the page updates.
const PLANS: Plan[] = [
  {
    id: 'trial',
    name: 'Free trial',
    price: '$0',
    period: 'for 7 days',
    note: 'No payment needed',
    button: 'Start free trial',
    features: [
      { text: 'Choose a career goal and build your plan', included: true },
      { text: 'Interactive skill graph', included: true },
      { text: 'Adaptive skill assessments', included: true },
      { text: 'Next Best Skill with a clear explanation', included: true },
      { text: 'Progress page and memory check', included: true },
      { text: 'Recommendation from a mentor', included: false },
      { text: 'Recommendation as a PDF', included: false },
    ],
  },
  {
    id: 'monthly',
    name: 'Monthly',
    price: '$19.99',
    period: 'per month',
    note: 'Cancel any time',
    button: 'Choose monthly',
    features: [
      { text: 'Everything in the free trial', included: true },
      { text: 'Share your projects with a mentor of your goal', included: true },
      { text: 'A signed personal recommendation from the mentor', included: true },
      { text: 'Download the recommendation as a PDF', included: true },
      { text: 'Public verification link for employers', included: true },
    ],
  },
  {
    id: 'yearly',
    name: 'Yearly',
    price: '$159',
    period: 'per year',
    note: 'Only $13.25 per month, you save 34%',
    badge: 'Best value',
    button: 'Choose yearly',
    features: [
      { text: 'Everything in the monthly plan', included: true },
      { text: 'Share your projects with a mentor of your goal', included: true },
      { text: 'A signed personal recommendation from the mentor', included: true },
      { text: 'Download the recommendation as a PDF', included: true },
      { text: 'Public verification link for employers', included: true },
    ],
  },
]

// Shown before sign in: the visitor picks a plan, then goes to the register page
function PlansPage() {
  return (
    <div className="land plans-page">
      <header className="land-nav">
        <Link to={PATHS.home} aria-label="SkillGraph home">
          <Logo />
        </Link>
        <div className="land-nav-actions">
          <ThemeToggle showLabel={false} />
          <Link to={PATHS.login} className="land-signin">
            Sign in
          </Link>
        </div>
      </header>

      <main className="plans-main">
        <h1 className="plans-title">Choose how you want to start</h1>
        <p className="plans-lead">
          Try SkillGraph free for 7 days. Pick a plan, then create your account.
        </p>

        <div className="plans-grid">
          {PLANS.map((plan) => (
            <Link
              key={plan.id}
              to={PATHS.register}
              className={plan.badge ? 'card plan plan-featured' : 'card plan'}
              aria-label={`${plan.name}: ${plan.button}`}
            >
              {plan.badge && <span className="plan-badge">{plan.badge}</span>}
              <h2 className="plan-name">{plan.name}</h2>
              <p className="plan-price">
                <strong>{plan.price}</strong>
                <span>{plan.period}</span>
              </p>
              <p className="plan-note">{plan.note}</p>

              <ul className="plan-features">
                {plan.features.map((feature) => (
                  <li key={feature.text} className={feature.included ? '' : 'plan-feature-off'}>
                    {feature.included ? <Check size={18} /> : <X size={18} />}
                    <span>{feature.text}</span>
                  </li>
                ))}
              </ul>

              <span className="btn btn-primary plan-button">{plan.button}</span>
            </Link>
          ))}
        </div>

        <p className="plans-footnote">
          The plans are shown for information. No payment is taken at this stage.
        </p>
        <p className="plans-footnote">
          Already have an account? <Link to={PATHS.login}>Sign in</Link>
        </p>
      </main>
    </div>
  )
}

export default PlansPage