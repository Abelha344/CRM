import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'

export default function AppIndexRedirect() {
  const role = useSelector((s) => s.auth.role)
  const loaded = useSelector((s) => s.auth.roleLoaded)

  if (!loaded) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center px-4">
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading Samart CRM…</p>
      </div>
    )
  }

  if (role === 'ADMIN') {
    return <Navigate to="/app/home" replace />
  }

  return <Navigate to="/app/leads" replace />
}
