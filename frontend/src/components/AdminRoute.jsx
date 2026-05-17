import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'

/**
 * Wraps admin-only UI. Agents are redirected to /forbidden (RBAC).
 */
export default function AdminRoute({ children }) {
  const role = useSelector((s) => s.auth.role)
  const loaded = useSelector((s) => s.auth.roleLoaded)

  if (!loaded) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center px-4">
        <p className="text-sm text-slate-500 dark:text-slate-400">Checking permissions…</p>
      </div>
    )
  }

  if (role !== 'ADMIN') {
    return <Navigate to="/forbidden" replace />
  }

  return children
}
