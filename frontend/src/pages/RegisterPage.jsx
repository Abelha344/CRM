import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'

import ClerkAuthSection from '../components/auth/ClerkAuthSection.jsx'
import { ClerkSignUpEmbed } from '../components/ClerkSessionEmbeds.jsx'
import AuthBrandHeader from '../components/auth/AuthBrandHeader'
import AuthCard from '../components/auth/AuthCard'
import AuthMethodDivider from '../components/auth/AuthMethodDivider'
import AuthPageLayout from '../components/AuthPageLayout'
import OAuthSection from '../components/OAuthSection'
import { clerkEmbedAppearance } from '../config/clerkAppearance'
import {
  authErrorBox,
  authInput,
  authLabel,
  authLink,
  authPrimaryBtn,
} from '../styles/authUi'
import { getClerkPublishableKey, isClerkConfigured } from '../utils/clerkEnv'
import { useOAuthProviders } from '../hooks/useOAuthProviders'
import { useRegisterMutation } from '../store/apiSlice'
import { persistTokens, setJwtSession } from '../store/authSlice'

export default function RegisterPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const clerkOn = isClerkConfigured(getClerkPublishableKey())
  const [register, { isLoading }] = useRegisterMutation()
  const oauth = useOAuthProviders()
  const hasOAuth = oauth.isLoading || Boolean(oauth.data?.google || oauth.data?.facebook)

  const [username, setUsername] = useState('')
  const [middleName, setMiddleName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password !== passwordConfirm) {
      setError('Passwords do not match.')
      return
    }
    try {
      const data = await register({
        username: username.trim(),
        middle_name: middleName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        password,
        password_confirm: passwordConfirm,
      }).unwrap()
      persistTokens(data.access, data.refresh)
      const u = data.user
      dispatch(
        setJwtSession({
          access: data.access,
          refresh: data.refresh,
          user: {
            id: u.id,
            username: u.username,
            email: u.email,
            last_name: u.last_name,
            middle_name: u.middle_name,
            role: u.role,
            clerk_id: null,
          },
        }),
      )
      navigate('/app', { replace: true })
    } catch (err) {
      const d = err?.data
      const msg =
        d && typeof d === 'object'
          ? Object.entries(d)
              .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(' ') : v}`)
              .join(' ')
          : err?.error || 'Registration failed.'
      setError(msg)
    }
  }

  return (
    <AuthPageLayout>
      <AuthCard>
        <AuthBrandHeader
          showLogo
          align="center"
          title="Create your account"
          subtitle="Create your Samart CRM account"
        />

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="reg-username" className={authLabel}>
                Username
              </label>
              <input
                id="reg-username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={authInput}
                placeholder="jane.doe"
              />
            </div>
            <div>
              <label htmlFor="reg-last" className={authLabel}>
                Last name
              </label>
              <input
                id="reg-last"
                type="text"
                autoComplete="family-name"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={authInput}
                placeholder="Doe"
              />
            </div>
          </div>

          <div>
            <label htmlFor="reg-middle" className={authLabel}>
              Middle name <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <input
              id="reg-middle"
              type="text"
              autoComplete="additional-name"
              value={middleName}
              onChange={(e) => setMiddleName(e.target.value)}
              className={authInput}
              placeholder="—"
            />
          </div>

          <div>
            <label htmlFor="reg-email" className={authLabel}>
              Email
            </label>
            <input
              id="reg-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={authInput}
              placeholder="you@company.com"
            />
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="reg-password" className={authLabel}>
                Password
              </label>
              <input
                id="reg-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={authInput}
                placeholder="Min. 8 characters"
              />
            </div>
            <div>
              <label htmlFor="reg-password2" className={authLabel}>
                Confirm password
              </label>
              <input
                id="reg-password2"
                type="password"
                autoComplete="new-password"
                required
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                className={authInput}
                placeholder="Repeat password"
              />
            </div>
          </div>

          {error ? <p className={authErrorBox}>{error}</p> : null}

          <button type="submit" disabled={isLoading} className={authPrimaryBtn}>
            {isLoading ? (
              <span className="inline-flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating account…
              </span>
            ) : (
              'Create account'
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
          Already have an account?{' '}
          <Link to="/login" className={authLink}>
            Sign in
          </Link>
        </p>

        {clerkOn ? (
          <div className="mt-6">
            <ClerkAuthSection variant="sign-up">
              <ClerkSignUpEmbed
                signInUrl="/login"
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
