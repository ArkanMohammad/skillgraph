import { useState } from 'react'
import AdminGoalSkills from '../components/admin/AdminGoalSkills'
import AdminMentors from '../components/admin/AdminMentors'
import AdminOverview from '../components/admin/AdminOverview'
import AdminQuestions from '../components/admin/AdminQuestions'
import AdminUsers from '../components/admin/AdminUsers'
import '../styles/pages.css'
import '../styles/progress.css'
import '../styles/admin.css'

type Tab = 'overview' | 'users' | 'mentors' | 'questions' | 'goals'

const TABS: { id: Tab; label: string; title: string }[] = [
  { id: 'overview', label: 'Overview', title: 'Overview' },
  { id: 'users', label: 'Users', title: 'Users' },
  { id: 'mentors', label: 'Mentors', title: 'Mentors' },
  { id: 'questions', label: 'Questions', title: 'Questions and skills' },
  { id: 'goals', label: 'Goal skills', title: 'Skills of a goal' },
]

// Admin area: overview, users, mentors, and tabs to manage questions and goal skills
function AdminPage() {
  const [tab, setTab] = useState<Tab>('overview')
  const current = TABS.find((item) => item.id === tab) ?? TABS[0]

  return (
    <div>
      <p className="page-eyebrow">Admin</p>
      <h1 className="page-title">{current.title}</h1>

      <div className="pills" role="tablist">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            className={`pill ${tab === item.id ? 'active' : ''}`}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <AdminOverview />}
      {tab === 'users' && <AdminUsers />}
      {tab === 'mentors' && <AdminMentors />}
      {tab === 'questions' && <AdminQuestions />}
      {tab === 'goals' && <AdminGoalSkills />}
    </div>
  )
}

export default AdminPage