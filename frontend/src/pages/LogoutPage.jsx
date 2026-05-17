import { ArrowLeft, LogOut } from 'lucide-react'
import { Link } from 'react-router-dom'

import AppLogoutButton from '../components/AppLogoutButton'

/**
 * Dedicated sign-out screen: confirms before clearing CRM + Clerk session.
 */
export default function LogoutPage() {
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          Sign out
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          You will be signed out of Samart CRM in this browser. If you use Clerk, your Clerk session
          here will end as well. Unsaved work in other tabs may be lost.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/50">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            to="/app/profile"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Stay signed in
          </Link>
          <AppLogoutButton className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:from-indigo-500 hover:to-violet-500">
            <LogOut className="h-4 w-4" />
            Sign out
          </AppLogoutButton>
        </div>
      </div>
    </div>
  )
}
