import { useAuth } from '@clerk/react'
import { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { getClerkPublishableKey, isClerkConfigured } from '../utils/clerkEnv'
import {
  clearPersistedTokens,
  logout,
  persistTokens,
  selectAccessToken,
  setAuthBootstrapReady,
  setJwtSession,
} from '../store/authSlice'

const SETTLED_CLERK_IDS_KEY = 'crm_clerk_exchange_settled_ids'

function readSettledClerkIds() {
  try {
    const raw = sessionStorage.getItem(SETTLED_CLERK_IDS_KEY)
    if (!raw) return new Set()
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? new Set(arr) : new Set()
  } catch {
    return new Set()
  }
}

function writeSettledClerkIds(set) {
  try {
    if (set.size === 0) sessionStorage.removeItem(SETTLED_CLERK_IDS_KEY)
    else sessionStorage.setItem(SETTLED_CLERK_IDS_KEY, JSON.stringify([...set]))
  } catch {
    /* ignore quota / private mode */
  }
}

function markClerkExchangeSettled(userId) {
  const s = readSettledClerkIds()
  s.add(userId)
  writeSettledClerkIds(s)
}

function clearAllClerkExchangeSettled() {
  writeSettledClerkIds(new Set())
}

function clearClerkExchangeSettledForUser(userId) {
  const s = readSettledClerkIds()
  s.delete(userId)
  writeSettledClerkIds(s)
}

function isClerkExchangeSettled(userId) {
  return userId && readSettledClerkIds().has(userId)
}

/**
 * Exchange Clerk session JWT for CRM SimpleJWT at most once per Clerk `userId`.
 * Prevents endless POST /api/auth/clerk-token/ when Clerk session object updates.
 * `getToken` is kept in a ref — it is not stable across renders.
 */
export default function ClerkAuthBridge() {
  const key = getClerkPublishableKey()
  const enabled = isClerkConfigured(key)
  const dispatch = useDispatch()

  useEffect(() => {
    if (!enabled) {
      dispatch(setAuthBootstrapReady(true))
    }
  }, [enabled, dispatch])

  if (!enabled) {
    return null
  }

  return <ClerkAuthBridgeInner />
}

function ClerkAuthBridgeInner() {
  const dispatch = useDispatch()
  const accessToken = useSelector(selectAccessToken)
  const { isLoaded, isSignedIn, userId, getToken } = useAuth()
  const getTokenRef = useRef(getToken)
  getTokenRef.current = getToken

  const prevSignedIn = useRef(null)
  const exchangedForUserId = useRef(null)
  const prevAccessToken = useRef(accessToken)

  useEffect(() => {
    if (!isLoaded) return
    if (prevSignedIn.current === true && isSignedIn === false) {
      exchangedForUserId.current = null
      clearAllClerkExchangeSettled()
      clearPersistedTokens()
      dispatch(logout())
    }
    prevSignedIn.current = isSignedIn
  }, [isLoaded, isSignedIn, dispatch])

  // CRM session cleared (e.g. /me 401) while Clerk is still signed in — allow a fresh clerk-token exchange.
  useEffect(() => {
    const had = Boolean(prevAccessToken.current)
    const has = Boolean(accessToken)
    prevAccessToken.current = accessToken
    if (had && !has && isLoaded && isSignedIn && userId) {
      exchangedForUserId.current = null
      clearClerkExchangeSettledForUser(userId)
    }
  }, [accessToken, isLoaded, isSignedIn, userId])

  useEffect(() => {
    if (!isLoaded) return

    // Do not clear `exchangedForUserId` here when `!isSignedIn`: Clerk can briefly report
    // signed-out during load and wipe the guard, causing endless POST /clerk-token/ retries.
    if (!isSignedIn) {
      dispatch(setAuthBootstrapReady(true))
      return
    }

    if (!userId) {
      dispatch(setAuthBootstrapReady(true))
      return
    }

    if (exchangedForUserId.current === userId || isClerkExchangeSettled(userId)) {
      exchangedForUserId.current = userId
      dispatch(setAuthBootstrapReady(true))
      return
    }

    let cancelled = false

    ;(async () => {
      const markDone = () => {
        markClerkExchangeSettled(userId)
        exchangedForUserId.current = userId
      }
      try {
        // Fresh session JWT (avoids a stale cached token after instance/config changes).
        const clerkJwt = await getTokenRef.current({ skipCache: true })
        if (cancelled && !clerkJwt) return
        if (!clerkJwt) {
          markDone()
          return
        }
        const res = await fetch('/api/auth/clerk-token/', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${clerkJwt}`,
            'Content-Type': 'application/json',
          },
        })
        // Record 401/503 etc. even if this effect was cancelled (Strict Mode / isLoaded flicker),
        // otherwise the guard never sticks and POSTs repeat forever.
        if (!res.ok) {
          markDone()
          return
        }
        if (cancelled) return
        const data = await res.json()
        if (data.access && data.refresh) {
          persistTokens(data.access, data.refresh)
          dispatch(
            setJwtSession({
              access: data.access,
              refresh: data.refresh,
            }),
          )
        }
        markDone()
      } catch {
        if (!cancelled) markDone()
      } finally {
        dispatch(setAuthBootstrapReady(true))
      }
    })()

    return () => {
      cancelled = true
    }
  }, [isLoaded, isSignedIn, userId, dispatch])

  return null
}
