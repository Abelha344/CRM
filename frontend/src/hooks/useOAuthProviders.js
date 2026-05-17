import { useEffect, useState } from 'react'

const STORAGE_KEY = 'crm_oauth_providers_cache_v1'

function readSessionCache() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function writeSessionCache(data) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    /* private mode / quota */
  }
}

/** In-memory + sessionStorage so Strict Mode / remounts / HMR do not re-hit the API. */
let memoryCache = readSessionCache()
let inflight = null

function fetchProviders() {
  if (memoryCache !== null) {
    return Promise.resolve(memoryCache)
  }
  if (inflight) {
    return inflight
  }
  inflight = fetch('/api/auth/oauth/providers/')
    .then((res) => {
      if (!res.ok) throw new Error(String(res.status))
      return res.json()
    })
    .then((data) => {
      memoryCache = data
      writeSessionCache(data)
      inflight = null
      return data
    })
    .catch((err) => {
      inflight = null
      throw err
    })
  return inflight
}

/**
 * One network request per tab session for Google/Facebook availability (static config).
 * Not RTK Query — avoids refetch-on-focus and subscription churn entirely.
 */
export function useOAuthProviders() {
  const [data, setData] = useState(memoryCache)
  const [isLoading, setIsLoading] = useState(memoryCache === null)
  const [isError, setIsError] = useState(false)

  useEffect(() => {
    if (memoryCache !== null) {
      setData(memoryCache)
      setIsLoading(false)
      return
    }
    let cancelled = false
    fetchProviders()
      .then((d) => {
        if (!cancelled) {
          setData(d)
          setIsLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setIsError(true)
          setIsLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { data, isLoading, isError }
}
