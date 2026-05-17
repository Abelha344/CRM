import { useClerk } from '@clerk/react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import { clearPersistedTokens, logout } from '../store/authSlice'
import { getClerkPublishableKey, isClerkConfigured } from '../utils/clerkEnv'

function PlainLogoutButton({ className, children }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const onClick = () => {
    clearPersistedTokens()
    dispatch(logout())
    navigate('/login', { replace: true })
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {children}
    </button>
  )
}

function ClerkLogoutButton({ className, children }) {
  const { signOut } = useClerk()
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const onClick = async () => {
    clearPersistedTokens()
    dispatch(logout())
    try {
      await signOut({ redirectUrl: `${window.location.origin}/login` })
    } catch {
      navigate('/login', { replace: true })
    }
  }

  return (
    <button type="button" onClick={() => void onClick()} className={className}>
      {children}
    </button>
  )
}

/**
 * Clears CRM tokens and signs out of Clerk when enabled. Only mounts the Clerk branch when
 * `VITE_CLERK_PUBLISHABLE_KEY` is set so `useClerk` runs inside `ClerkProvider`.
 */
export default function AppLogoutButton({ className, children = 'Sign out' }) {
  const clerkOn = isClerkConfigured(getClerkPublishableKey())
  if (clerkOn) {
    return <ClerkLogoutButton className={className}>{children}</ClerkLogoutButton>
  }
  return <PlainLogoutButton className={className}>{children}</PlainLogoutButton>
}
