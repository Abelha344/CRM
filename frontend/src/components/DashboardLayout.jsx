import { useMemo, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  ListTodo,
  ScrollText,
  Settings,
  UserCircle,
  UserCog,
  Users,
} from 'lucide-react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'

import AppLogoutButton from './AppLogoutButton'
import RoleBadge from './RoleBadge'
import DashboardClerkAccount from './DashboardClerkAccount'
import { selectIsAdmin } from '../store/authSlice'
import { getClerkPublishableKey, isClerkConfigured } from '../utils/clerkEnv'

const navCls = ({ isActive }) =>
  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${
    isActive
      ? 'bg-indigo-50 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-200'
      : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/80'
  }`

export default function DashboardLayout() {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { user } = useSelector((s) => s.auth)
  const isAdmin = useSelector(selectIsAdmin)
  const location = useLocation()
  const clerkOn = isClerkConfigured(getClerkPublishableKey())

  const toggleSidebar = () => setSidebarOpen((v) => !v)

  const subtitle = useMemo(() => {
    const p = location.pathname
    if (p.endsWith('/home')) return 'Pipeline and workload'
    if (p.includes('/leads')) return 'Leads and opportunities'
    if (p.includes('/tasks')) return 'Follow-ups and next steps'
    if (p.includes('/settings')) return 'Organization settings'
    if (p.includes('/team')) return 'Roles and access'
    if (p.includes('/logs')) return 'Audit and system events'
    if (p.includes('/profile')) return 'Your account and session'
    if (p.includes('/logout')) return 'Sign out of Samart CRM'
    return 'Samart CRM workspace'
  }, [location.pathname])

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <aside
        className={`${
          sidebarOpen ? 'w-56' : 'w-[4.5rem]'
        } flex shrink-0 flex-col border-r border-slate-200 bg-white transition-[width] duration-200 ease-out dark:border-slate-800 dark:bg-slate-900`}
      >
        <div className="flex h-14 items-center justify-between gap-2 border-b border-slate-200 px-3 dark:border-slate-800">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
              <LayoutDashboard className="h-5 w-5" />
            </span>
            {sidebarOpen && (
              <span className="truncate text-sm font-semibold tracking-tight">Samart CRM</span>
            )}
          </div>
          <button
            type="button"
            onClick={toggleSidebar}
            className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {sidebarOpen ? (
              <ChevronLeft className="h-5 w-5" />
            ) : (
              <ChevronRight className="h-5 w-5" />
            )}
          </button>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-2">
          {isAdmin && (
            <NavLink to="/app/home" className={navCls} end>
              <LayoutDashboard className="h-5 w-5 shrink-0" />
              {sidebarOpen && <span>Overview</span>}
            </NavLink>
          )}
          <NavLink to="/app/leads" className={navCls}>
            <Users className="h-5 w-5 shrink-0" />
            {sidebarOpen && <span>Leads</span>}
          </NavLink>
          <NavLink to="/app/tasks" className={navCls}>
            <ListTodo className="h-5 w-5 shrink-0" />
            {sidebarOpen && <span>Tasks</span>}
          </NavLink>
          <NavLink to="/app/profile" className={navCls}>
            <UserCircle className="h-5 w-5 shrink-0" />
            {sidebarOpen && <span>Profile</span>}
          </NavLink>
          {isAdmin && (
            <>
              <NavLink to="/app/settings" className={navCls}>
                <Settings className="h-5 w-5 shrink-0" />
                {sidebarOpen && <span>Settings</span>}
              </NavLink>
              <NavLink to="/app/team" className={navCls}>
                <UserCog className="h-5 w-5 shrink-0" />
                {sidebarOpen && <span>Team</span>}
              </NavLink>
              <NavLink to="/app/logs" className={navCls}>
                <ScrollText className="h-5 w-5 shrink-0" />
                {sidebarOpen && <span>Logs</span>}
              </NavLink>
            </>
          )}
        </nav>
        <div className="border-t border-slate-200 p-3 dark:border-slate-800">
          {sidebarOpen && (
            <button
              type="button"
              onClick={() => navigate('/app/profile')}
              className="mb-2 w-full truncate rounded-lg px-1 py-0.5 text-left text-xs text-slate-500 transition hover:bg-slate-50 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              title={user?.email}
            >
              {user?.name || user?.email || 'Account'}
            </button>
          )}
          {clerkOn ? (
            <DashboardClerkAccount />
          ) : (
            <div className="flex justify-center">
              <AppLogoutButton className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
                Sign out
              </AppLogoutButton>
            </div>
          )}
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-auto">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 px-6 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-medium uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Samart CRM
                </p>
                {isAdmin && <RoleBadge />}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">{subtitle}</p>
            </div>
          </div>
        </header>
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
