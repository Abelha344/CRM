import { Link } from 'react-router-dom'

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100 px-4 dark:bg-slate-950">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">
          403 Forbidden
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          You do not have access
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          This area is restricted to administrators. If you believe this is a mistake, contact your team
          owner.
        </p>
        <Link
          to="/app/leads"
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
        >
          Back to Samart CRM
        </Link>
      </div>
    </div>
  )
}
