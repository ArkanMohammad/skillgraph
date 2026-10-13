import { useState } from 'react'
import AdminGoalSkills from '../components/admin/AdminGoalSkills'
import AdminOverview from '../components/admin/AdminOverview'
import AdminQuestions from '../components/admin/AdminQuestions'
import '../styles/pages.css'
import '../styles/progress.css'
import '../styles/admin.css'

type Tab = 'overview' | 'questions' | 'goals'

const TABS: { id: Tab; label: string; title: string }[] = [
  { id: 'overview', label: 'Overview', title: 'Overview' },
  { id: 'questions', label: 'Questions', title: 'Questions and skills' },
  { id: 'goals', label: 'Goal skills', title: 'Skills of a goal' },
]

// Admin area: overview of users, plus tabs to manage questions and goal skills
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
      {tab === 'questions' && <AdminQuestions />}
      {tab === 'goals' && <AdminGoalSkills />}
    </div>
  )
}

export default AdminPage