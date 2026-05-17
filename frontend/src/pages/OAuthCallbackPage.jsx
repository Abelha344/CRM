import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { persistTokens, setJwtSession } from '../store/authSlice'

export default function OAuthCallbackPage() {
  const navigate = useNavigate()
  const [search] = useSearchParams()
  const dispatch = useDispatch()

  useEffect(() => {
    const err = search.get('error')
    if (err) {
      navigate(`/login?oauth_error=${encodeURIComponent(err)}`, { replace: true })
      return
    }
    const raw = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : ''
    const params = new URLSearchParams(raw)
    const access = params.get('access')
    const refresh = params.get('refresh')
    if (access && refresh) {
      persistTokens(access, refresh)
      dispatch(setJwtSession({ access, refresh }))
      navigate('/app', { replace: true })
      return
    }
    navigate('/login?oauth_error=missing_tokens', { replace: true })
  }, [dispatch, navigate, search])

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 dark:bg-slate-950">
      <p className="text-sm text-slate-600 dark:text-slate-400">Completing sign-in…</p>
    </div>
  )
}
