import { UserButton, useAuth } from '@clerk/react'
import { LogOut, UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'

import AppLogoutButton from '../components/AppLogoutButton'
import RoleBadge from '../components/RoleBadge'
import { selectIsAdmin } from '../store/authSlice'
import { getClerkPublishableKey, isClerkConfigured } from '../utils/clerkEnv'

/** Only mounted when Clerk is configured — safe to call `useAuth`. */
function ProfileClerkControls() {
  const { isSignedIn } = useAuth()
  if (!isSignedIn) return null
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        Clerk account
      </h3>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        Manage your Clerk profile, security, and connected accounts.
      </p>
      <div className="mt-4 flex justify-start">
        <UserButton
          afterSignOutUrl="/login"
          appearance={{
            elements: {
              userButtonAvatarBox: 'h-11 w-11',
              userButtonBox: 'flex items-center',
            },
          }}
        />
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const { user, role, backendEmail, roleLoaded, clerkId } = useSelector((s) => s.auth)
  const isAdmin = useSelector(selectIsAdmin)
  const clerkOn = isClerkConfigured(getClerkPublishableKey())

  const displayName = user?.name || user?.email || 'Your account'
  const email = backendEmail || user?.email || '—'

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          Profile
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Your workspace identity and session. Sign out ends this browser session for Samart CRM.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900/50">
        <div className="border-b border-slate-100 bg-gradient-to-r from-indigo-50/80 to-violet-50/40 px-6 py-5 dark:border-slate-700 dark:from-indigo-950/40 dark:to-violet-950/30">
          <div className="flex flex-wrap items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25">
              <UserRound className="h-8 w-8" strokeWidth={1.75} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {displayName}
                </h2>
                {roleLoaded ? (
                  isAdmin ? (
                    <RoleBadge />
                  ) : (
                    <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200">
                      {role || 'Member'}
                    </span>
                  )
                ) : (
                  <span className="text-xs text-slate-400">Loading role…</span>
                )}
              </div>
              <p className="mt-1 truncate text-sm text-slate-600 dark:text-slate-400">{email}</p>
              {clerkId ? (
                <p className="mt-2 font-mono text-[11px] text-slate-400 dark:text-slate-500">
                  Clerk ID: {clerkId}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="space-y-6 px-6 py-6">
          {clerkOn ? <ProfileClerkControls /> : null}

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Session
            </h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Leave Samart CRM on this device. You can open the full sign-out screen if you want a
              confirmation step first.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <AppLogoutButton className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:from-indigo-500 hover:to-violet-500">
                <LogOut className="h-4 w-4" />
                Sign out
              </AppLogoutButton>
              <Link
                to="/app/logout"
                className="text-sm font-semibold text-indigo-600 underline-offset-2 hover:underline dark:text-indigo-400"
              >
                Sign out with confirmation…
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
