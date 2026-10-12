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
  ShieldCheck,
  Star,
  Target,
  User,
  type LucideIcon,
} from 'lucide-react'
import Logo from './Logo'
import ThemeToggle from './ThemeToggle'
import { useSignOut } from '../hooks/useSignOut'
import { useAppSelector } from '../hooks/reduxHooks'
import { PATHS } from '../routes/paths'
import './AppLayout.css'

const NAV_ITEMS: { to: string; label: string; icon: LucideIcon }[] = [
  { to: PATHS.dashboard, label: 'Dashboard', icon: LayoutGrid },
  { to: PATHS.myGoal, label: 'My Goal', icon: Target },
  { to: PATHS.skillGraph, label: 'Skill Graph', icon: Share2 },
  { to: PATHS.assessments, label: 'Assessments', icon: ClipboardList },
  { to: PATHS.mySkills, label: 'My Skills', icon: Star },
  { to: PATHS.progress, label: 'Progress', icon: Activity },
  { to: PATHS.myProfile, label: 'My Profile', icon: User },
]

// Only admins see this item (the server checks the role again on every request)
const ADMIN_ITEM = { to: PATHS.admin, label: 'Admin', icon: ShieldCheck }

// Layout for the logged-in app: sidebar on the left, current page on the right
function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const signOut = useSignOut()
  const isAdmin = useAppSelector((state) => state.auth.user?.role) === 'ADMIN'
  const navItems = isAdmin ? [...NAV_ITEMS, ADMIN_ITEM] : NAV_ITEMS

  return (
    <div className={`app ${collapsed ? 'app-collapsed' : ''}`}>
      <aside className="sidebar">
        <div>
          <div className="sidebar-top">
            <Logo />
          </div>

          <nav className="sidebar-nav">
            {navItems.map(({ to, label, icon: Icon }) => (
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