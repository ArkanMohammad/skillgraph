import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import {
  Activity,
  ClipboardList,
  LayoutGrid,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Share2,
  Target,
  User,
  type LucideIcon,
} from 'lucide-react'
import Logo from './Logo'
import ThemeToggle from './ThemeToggle'
import { useSignOut } from '../hooks/useSignOut'
import './AppLayout.css'

const NAV_ITEMS: { to: string; label: string; icon: LucideIcon }[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
  { to: '/my-goal', label: 'My Goal', icon: Target },
  { to: '/skill-graph', label: 'Skill Graph', icon: Share2 },
  { to: '/assessment', label: 'Assessments', icon: ClipboardList },
  { to: '/progress', label: 'Progress', icon: Activity },
  { to: '/profile', label: 'Profile', icon: User },
]

// Layout for the logged-in app: sidebar on the left, current page on the right
function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const signOut = useSignOut()

  return (
    <div className={`app ${collapsed ? 'app-collapsed' : ''}`}>
      <aside className="sidebar">
        <div>
          <div className="sidebar-top">
            <Logo />
          </div>

          <nav className="sidebar-nav">
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={20} />
                <span className="nav-label">{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="sidebar-bottom">
          <ThemeToggle />
          <button className="nav-item" onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
            <span className="nav-label">Collapse</span>
          </button>
          <button className="nav-item" onClick={signOut}>
            <LogOut size={20} />
            <span className="nav-label">Sign out</span>
          </button>
        </div>
      </aside>

      {/* The active page renders here */}
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}

export default AppLayout