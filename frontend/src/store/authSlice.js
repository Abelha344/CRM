import { createSlice } from '@reduxjs/toolkit'

const ACCESS_KEY = 'crm_access_token'
const REFRESH_KEY = 'crm_refresh_token'

export function persistTokens(access, refresh) {
  try {
    if (access) localStorage.setItem(ACCESS_KEY, access)
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh)
  } catch {
    /* ignore */
  }
}

export function clearPersistedTokens() {
  try {
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
  } catch {
    /* ignore */
  }
}

export function readPersistedTokens() {
  try {
    const access = localStorage.getItem(ACCESS_KEY)
    const refresh = localStorage.getItem(REFRESH_KEY)
    return { access: access || null, refresh: refresh || null }
  } catch {
    return { access: null, refresh: null }
  }
}

const initialState = {
  accessToken: null,
  refreshToken: null,
  user: null,
  isAuthenticated: false,
  role: null,
  clerkId: null,
  backendEmail: null,
  roleLoaded: false,
  /** Clerk session + JWT exchange finished (or Clerk not used). */
  authBootstrapReady: false,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    hydrateTokens(state, action) {
      const { access, refresh } = action.payload ?? {}
      state.accessToken = access ?? null
      state.refreshToken = refresh ?? null
      state.isAuthenticated = Boolean(access)
    },
    setSession(state, action) {
      const user = action.payload ?? null
      state.user = user
      state.isAuthenticated = Boolean(user)
    },
    setJwtSession(state, action) {
      const { access, refresh, user } = action.payload ?? {}
      state.accessToken = access ?? null
      state.refreshToken = refresh ?? state.refreshToken
      state.isAuthenticated = Boolean(access)
      if (user) {
        state.user = user
        if (user.role != null) {
          state.role = user.role
          state.clerkId = user.clerk_id ?? null
          state.backendEmail = user.email ?? null
          state.roleLoaded = true
        }
      }
    },
    setBackendRole(state, action) {
      const { role, clerk_id: clerkId, email } = action.payload ?? {}
      state.role = role ?? null
      state.clerkId = clerkId ?? null
      state.backendEmail = email ?? null
      state.roleLoaded = true
    },
    clearBackendRole(state) {
      state.role = null
      state.clerkId = null
      state.backendEmail = null
      state.roleLoaded = false
    },
    logout(state) {
      state.accessToken = null
      state.refreshToken = null
      state.user = null
      state.isAuthenticated = false
      state.role = null
      state.clerkId = null
      state.backendEmail = null
      state.roleLoaded = false
    },
    setAuthBootstrapReady(state, action) {
      state.authBootstrapReady = action.payload === true
    },
  },
})

export const {
  hydrateTokens,
  setSession,
  setJwtSession,
  setBackendRole,
  clearBackendRole,
  logout,
  setAuthBootstrapReady,
} = authSlice.actions
export default authSlice.reducer

export const selectIsAdmin = (state) => state.auth.role === 'ADMIN'
export const selectIsAgent = (state) => state.auth.role === 'AGENT'
export const selectAccessToken = (state) => state.auth.accessToken
export const selectAuthBootstrapReady = (state) => state.auth.authBootstrapReady
