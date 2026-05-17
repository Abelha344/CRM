import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

import ClerkAuthSection from '../components/auth/ClerkAuthSection.jsx'
import { ClerkSignInEmbed } from '../components/ClerkSessionEmbeds.jsx'
import AuthBrandHeader from '../components/auth/AuthBrandHeader'
import AuthCard from '../components/auth/AuthCard'
import AuthMethodDivider from '../components/auth/AuthMethodDivider'
import AuthPageLayout from '../components/AuthPageLayout'
import OAuthSection from '../components/OAuthSection'
import { clerkEmbedAppearance } from '../config/clerkAppearance'
import {
  authAlertBox,
  authErrorBox,
  authInput,
  authLabel,
  authLink,
  authPrimaryBtn,
} from '../styles/authUi'
import { getClerkPublishableKey, isClerkConfigured } from '../utils/clerkEnv'
import { useOAuthProviders } from '../hooks/useOAuthProviders'
import { useLoginMutation } from '../store/apiSlice'
import { persistTokens, setJwtSession } from '../store/authSlice'

export default function LoginPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const clerkOn = isClerkConfigured(getClerkPublishableKey())
  const oauthErr = searchParams.get('oauth_error')
  const [login, { isLoading }] = useLoginMutation()
  const oauth = useOAuthProviders()
  const hasOAuth =
    oauth.isLoading || Boolean(oauth.data?.google || oauth.data?.facebook)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const data = await login({ email: email.trim(), password }).unwrap()
      persistTokens(data.access, data.refresh)
      dispatch(setJwtSession({ access: data.access, refresh: data.refresh }))
      navigate('/app', { replace: true })
    } catch (err) {
      const detail = err?.data?.detail
      const msg =
        typeof detail === 'string'
          ? detail
          : detail && typeof detail === 'object'
            ? Object.values(detail).flat().join(' ')
            : err?.error || 'Sign in failed.'
      setError(msg)
    }
  }

  return (
    <AuthPageLayout>
      <AuthCard>
        <AuthBrandHeader
          showLogo
          align="center"
          title="Welcome back"
          subtitle="Welcome back to Samart CRM"
        />

        {oauthErr ? (
          <p className={`mt-6 ${authAlertBox}`}>
            Social sign-in didn&apos;t complete ({oauthErr}). Try email or another method.
          </p>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label htmlFor="login-email" className={authLabel}>
              Email
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={authInput}
              placeholder="you@company.com"
            />
          </div>
          <div>
            <label htmlFor="login-password" className={authLabel}>
              Password
            </label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={authInput}
              placeholder="••••••••"
            />
          </div>

          {error ? <p className={authErrorBox}>{error}</p> : null}

          <button type="submit" disabled={isLoading} className={authPrimaryBtn}>
            {isLoading ? (
              <span className="inline-flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing in…
              </span>
            ) : (
              'Sign in'
            )}
          </button>
        </form>

        {hasOAuth ? (
          <>
            <AuthMethodDivider>Or continue with</AuthMethodDivider>
            <div className="space-y-5">
              <OAuthSection hideTopLabel />
            </div>
          </>
        ) : null}

        <p className="mt-10 border-t border-slate-100 pt-8 text-center text-sm text-slate-600">
          Don&apos;t have an account?{' '}
          <Link to="/register" className={authLink}>
            Create one
          </Link>
        </p>

        {clerkOn ? (
          <div className="mt-6">
            <ClerkAuthSection variant="sign-in">
              <ClerkSignInEmbed
                signUpUrl="/register"
                fallbackRedirectUrl="/app"
                appearance={clerkEmbedAppearance}
              />
            </ClerkAuthSection>
          </div>
        ) : null}
      </AuthCard>
    </AuthPageLayout>
  )
}
