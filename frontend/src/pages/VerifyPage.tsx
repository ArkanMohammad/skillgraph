import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Search, ShieldCheck, ShieldX } from 'lucide-react'
import Logo from '../components/Logo'
import ThemeToggle from '../components/ThemeToggle'
import RecommendationActions from '../components/RecommendationActions'
import RecommendationView from '../components/RecommendationView'
import { ApiError } from '../services/apiClient'
import { verifyRecommendation, type VerifiedRecommendation } from '../services/verifyService'
import { PATHS } from '../routes/paths'
import { buildVerifyUrl } from '../utils/verifyUrl'
import '../styles/pages.css'
import '../styles/verify.css'

// The answer for one code. The page gives it a key, so it starts fresh for every code.
function VerifyResult(props: { code: string }) {
  const [result, setResult] = useState<VerifiedRecommendation | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false // ignore the answer if the code changed meanwhile

    async function load() {
      try {
        const data = await verifyRecommendation(props.code)
        if (!cancelled) setResult(data.recommendation)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Cannot reach the server')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [props.code])

  if (loading) return <p className="muted">Checking the code...</p>

  if (!result) {
    return (
      <div className="verify-banner verify-banner-bad">
        <ShieldX size={22} />
        <div>
          <strong>This code could not be verified</strong>
          <span>{error}</span>
        </div>
      </div>
    )
  }

  const view = {
    recommendation: {
      code: result.code,
      mentorName: result.mentorName,
      mentorTitle: result.mentorTitle,
      body: result.body,
      signature: result.signature,
      issuedAt: result.issuedAt,
    },
    projectTitle: result.projectTitle,
    projectDescription: result.projectDescription,
    learnerName: result.learnerName,
    goalName: result.goalName,
    verifyUrl: buildVerifyUrl(result.code),
  }

  return (
    <div>
      <div className="verify-banner verify-banner-ok">
        <ShieldCheck size={22} />
        <div>
          <strong>This recommendation is real</strong>
          <span>It was written and signed on SkillGraph by {result.mentorName}.</span>
        </div>
      </div>

      <RecommendationView {...view} />

      <div className="verify-actions">
        <RecommendationActions {...view} />
      </div>
    </div>
  )
}

// Public page: anybody with a recommendation code can check that it is real. No login needed.
function VerifyPage() {
  const { code } = useParams()
  const navigate = useNavigate()
  const [input, setInput] = useState(code ?? '')

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const clean = input.trim()
    if (clean) navigate(PATHS.verifyCode(clean))
  }

  return (
    <div className="verify-page">
      <header className="verify-head">
        <Link to={PATHS.home} aria-label="SkillGraph home">
          <Logo />
        </Link>
        <ThemeToggle showLabel={false} />
      </header>

      <h1 className="page-title">Verify a recommendation</h1>
      <p className="muted">
        Every recommendation signed on SkillGraph has a code such as SG-7KQ2-M9XD-4TPA. Type it here to see the
        original text and signature.
      </p>

      <form className="verify-form" onSubmit={handleSubmit}>
        <input
          className="input"
          value={input}
          maxLength={30}
          placeholder="SG-XXXX-XXXX-XXXX"
          aria-label="Recommendation code"
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit" className="btn btn-primary" disabled={!input.trim()}>
          <Search size={16} /> Check
        </button>
      </form>

      {code && <VerifyResult key={code} code={code} />}
    </div>
  )
}

export default VerifyPage