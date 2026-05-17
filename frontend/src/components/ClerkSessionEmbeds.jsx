import { SignIn, SignOutButton, SignUp, useAuth } from '@clerk/react'
import { Loader2 } from 'lucide-react'
import { useSelector } from 'react-redux'

import { selectAccessToken, selectAuthBootstrapReady } from '../store/authSlice'

function ClerkEmbedLoading() {
  return (
    <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-600">
      <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
      Loading Clerk…
    </div>
  )
}

/**
 * When Clerk says "signed in" but the CRM has no JWT (e.g. clerk-token 401), rendering
 * <SignIn/> makes Clerk redirect to fallbackRedirectUrl while the app sends users back to
 * /login — a navigation loop. Only render SignIn/SignUp when there is no Clerk user id.
 *
 * Note: @clerk/react v6 does not export SignedIn/SignedOut; use useAuth() instead.
 */
function SignedInWithoutCrmToken() {
  const accessToken = useSelector(selectAccessToken)
  const bootstrapReady = useSelector(selectAuthBootstrapReady)

  if (accessToken) {
    return null
  }

  if (!bootstrapReady) {
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-600">
        <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
        Connecting your account…
      </div>
    )
  }

  return (
    <div className="space-y-3 rounded-xl border border-amber-100 bg-amber-50/90 p-4 text-sm text-slate-800">
      <p className="font-medium">Could not sign you in to Samart CRM</p>
      <p className="text-slate-600">
        The server did not accept your Clerk session. In the backend{' '}
        <code className="rounded bg-white px-1 py-0.5 text-xs">.env</code>, set{' '}
        <code className="rounded bg-white px-1 py-0.5 text-xs">CLERK_JWKS_URL</code> and{' '}
        <code className="rounded bg-white px-1 py-0.5 text-xs">CLERK_ISSUER</code> to the values
        for the same Clerk instance as your frontend publishable key (Clerk Dashboard → API keys →
        JWT verification).
      </p>
      <SignOutButton className="inline-flex rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800">
        Sign out of Clerk
      </SignOutButton>
    </div>
  )
}

export function ClerkSignInEmbed({ appearance, signUpUrl, fallbackRedirectUrl }) {
  const { isLoaded, userId } = useAuth()

  if (!isLoaded) {
    return <ClerkEmbedLoading />
  }

  if (userId) {
    return <SignedInWithoutCrmToken />
  }

  return (
    <SignIn
      routing="hash"
      signUpUrl={signUpUrl}
      fallbackRedirectUrl={fallbackRedirectUrl}
      appearance={appearance}
    />
  )
}

export function ClerkSignUpEmbed({ appearance, signInUrl, fallbackRedirectUrl }) {
  const { isLoaded, userId } = useAuth()

  if (!isLoaded) {
    return <ClerkEmbedLoading />
  }

  if (userId) {
    return <SignedInWithoutCrmToken />
  }

  return (
    <SignUp
      routing="hash"
      signInUrl={signInUrl}
      fallbackRedirectUrl={fallbackRedirectUrl}
      appearance={appearance}
    />
  )
}
