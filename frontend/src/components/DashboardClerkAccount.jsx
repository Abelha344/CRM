import { UserButton, useAuth } from '@clerk/react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import { clearPersistedTokens, logout } from '../store/authSlice'

/**
 * Clerk avatar when a Clerk session exists; otherwise plain sign-out (JWT-only / email login).
 */
export default function DashboardClerkAccount() {
  const { isSignedIn } = useAuth()
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const handleSignOut = () => {
    clearPersistedTokens()
    dispatch(logout())
    navigate('/login', { replace: true })
  }

  if (!isSignedIn) {
    return (
      <div className="flex justify-center">
        <button
          type="button"
          onClick={handleSignOut}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          Sign out
        </button>
      </div>
    )
  }

  return (
    <div className="flex justify-center">
      <UserButton
        afterSignOutUrl="/login"
        appearance={{
          elements: {
            userButtonAvatarBox: 'h-9 w-9',
            userButtonBox: 'flex items-center',
          },
        }}
      />
    </div>
  )
}
