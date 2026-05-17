import { useOAuthProviders } from '../hooks/useOAuthProviders'

function GoogleIcon(props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={props.className}>
      <path
        fill="currentColor"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="currentColor"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="currentColor"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="currentColor"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

function FacebookIcon(props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={props.className}>
      <path
        fill="#1877F2"
        d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
      />
    </svg>
  )
}

const btnOutline =
  'inline-flex min-h-[44px] w-full flex-1 items-center justify-center gap-2.5 rounded-xl border border-slate-200/90 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50/80 hover:shadow-md sm:min-h-0 sm:py-3'

/**
 * Backend Google/Facebook OAuth — compact grid, hidden when not configured.
 */
export default function OAuthSection({ hideTopLabel = false }) {
  const { data, isLoading } = useOAuthProviders()

  const google = Boolean(data?.google)
  const facebook = Boolean(data?.facebook)
  const dividerLabel = 'Continue with'

  if (!isLoading && !google && !facebook) {
    return null
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-3">
        <span className="text-sm text-slate-400">Loading providers…</span>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {!hideTopLabel ? (
        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
          {dividerLabel}
        </p>
      ) : null}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {google ? (
          <a href="/api/auth/oauth/google/start/" className={btnOutline}>
            <GoogleIcon className="h-[18px] w-[18px] shrink-0 text-slate-700" />
            Google
          </a>
        ) : (
          <span className={`${btnOutline} cursor-not-allowed opacity-40`} title="Configure Google OAuth">
            <GoogleIcon className="h-[18px] w-[18px] shrink-0" />
            Google
          </span>
        )}
        {facebook ? (
          <a href="/api/auth/oauth/facebook/start/" className={btnOutline}>
            <FacebookIcon className="h-[18px] w-[18px] shrink-0" />
            Facebook
          </a>
        ) : (
          <span className={`${btnOutline} cursor-not-allowed opacity-40`} title="Configure Facebook OAuth">
            <FacebookIcon className="h-[18px] w-[18px] shrink-0" />
            Facebook
          </span>
        )}
      </div>
    </div>
  )
}
