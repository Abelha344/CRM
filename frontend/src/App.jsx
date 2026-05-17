import { useLayoutEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Navigate, Route, Routes } from 'react-router-dom'

import AuthSession from './components/AuthSession'
import ClerkAuthBridge from './components/ClerkAuthBridge'
import AdminRoute from './components/AdminRoute'
import DashboardLayout from './components/DashboardLayout'
import AppIndexRedirect from './pages/AppIndexRedirect'
import ForbiddenPage from './pages/ForbiddenPage'
import LoginPage from './pages/LoginPage'
import OAuthCallbackPage from './pages/OAuthCallbackPage'
import LogoutPage from './pages/LogoutPage'
import OverviewPage from './pages/OverviewPage'
import ProfilePage from './pages/ProfilePage'
import RegisterPage from './pages/RegisterPage'
import SettingsPage from './pages/SettingsPage'
import SystemLogsPage from './pages/SystemLogsPage'
import TeamManagementPage from './pages/TeamManagementPage'
import LeadsTable from './components/LeadsTable'
import TasksBoard from './components/TasksBoard'
import { hydrateTokens, readPersistedTokens, selectAccessToken } from './store/authSlice'

export default function App() {
  const dispatch = useDispatch()
  const accessToken = useSelector(selectAccessToken)
  const [hydrated, setHydrated] = useState(false)

  // Sync tokens from storage before paint so the first paint matches session state.
  // Full-screen loading only covers this instant — not Clerk bootstrap or /me (those use in-route loaders).
  useLayoutEffect(() => {
    const { access, refresh } = readPersistedTokens()
    if (access) {
      dispatch(hydrateTokens({ access, refresh }))
    }
    setHydrated(true)
  }, [dispatch])

  const showApp = Boolean(accessToken)
  const showLoading = !hydrated

  return (
    <>
      <ClerkAuthBridge />
      <AuthSession />
      <div className="relative min-h-screen">
        <Routes>
          <Route path="/forbidden" element={<ForbiddenPage />} />
          <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
          <Route path="/login" element={showApp ? <Navigate to="/app" replace /> : <LoginPage />} />
          <Route path="/register" element={showApp ? <Navigate to="/app" replace /> : <RegisterPage />} />
          {showApp ? (
            <>
              <Route path="/" element={<Navigate to="/app" replace />} />
              <Route path="/app" element={<DashboardLayout />}>
                <Route index element={<AppIndexRedirect />} />
                <Route path="home" element={<OverviewPage />} />
                <Route path="leads" element={<LeadsTable />} />
                <Route path="tasks" element={<TasksBoard />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="logout" element={<LogoutPage />} />
                <Route
                  path="settings"
                  element={
                    <AdminRoute>
                      <SettingsPage />
                    </AdminRoute>
                  }
                />
                <Route
                  path="team"
                  element={
                    <AdminRoute>
                      <TeamManagementPage />
                    </AdminRoute>
                  }
                />
                <Route
                  path="logs"
                  element={
                    <AdminRoute>
                      <SystemLogsPage />
                    </AdminRoute>
                  }
                />
              </Route>
              <Route path="*" element={<Navigate to="/app" replace />} />
            </>
          ) : (
            <Route path="*" element={<Navigate to="/login" replace />} />
          )}
        </Routes>
        {showLoading ? (
          <div
            className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center bg-slate-100/80 dark:bg-slate-950/80"
            aria-busy="true"
            aria-live="polite"
          >
            <p className="text-sm text-slate-600 dark:text-slate-400">Loading…</p>
          </div>
        ) : null}
      </div>
    </>
  )
}
