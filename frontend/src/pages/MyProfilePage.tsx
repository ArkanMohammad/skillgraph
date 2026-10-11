import { Link } from 'react-router-dom'
import { useAppSelector } from '../hooks/reduxHooks'
import { PATHS } from '../routes/paths'
import '../styles/pages.css'
import '../styles/my-profile.css'

// Builds the avatar letters from the user's name (e.g. "Jordan Lee" -> "JL")
function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')
}

// Shows the account information and learning details of the logged-in user
function MyProfilePage() {
  const user = useAppSelector((state) => state.auth.user)
  const goal = useAppSelector((state) => state.goal.selectedGoal)

  const name = user?.name ?? ''
  const email = user?.email ?? ''

  return (
    <div>
      <div className="page-header">
        <div>
          <p className="page-eyebrow">Account</p>
          <h1 className="page-title">My Profile</h1>
          <p className="muted">Manage your account and learning preferences.</p>
        </div>
        <button className="btn btn-outline" type="button">
          Edit Profile
        </button>
      </div>

      <div className="card profile-card">
        <div className="profile-head">
          <div className="profile-avatar">{getInitials(name)}</div>
          <div>
            <div className="profile-name">{name}</div>
            <div className="muted">{email}</div>
          </div>
        </div>

        <div className="profile-rows">
          <div>
            <div className="profile-label">Full Name</div>
            <div className="profile-value">{name}</div>
          </div>
          <div>
            <div className="profile-label">Email</div>
            <div className="profile-value">{email}</div>
          </div>
          <div className="profile-row">
            <div>
              <div className="profile-label">Current Goal</div>
              <div className="profile-value">{goal?.name ?? 'No goal selected'}</div>
            </div>
            <Link className="profile-link" to={PATHS.selectGoal}>
              Change
            </Link>
          </div>
          <div>
            <div className="profile-label">Weekly available learning hours</div>
            <div className="profile-value">10 hours / week</div>
          </div>
        </div>
      </div>

      <div className="card profile-card">
        <h3>Account</h3>
        <div className="profile-rows">
          <button className="profile-link" type="button">
            Change password →
          </button>
          <button className="profile-link profile-link-danger" type="button">
            Delete account →
          </button>
        </div>
      </div>
    </div>
  )
}

export default MyProfilePage