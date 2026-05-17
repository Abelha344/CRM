import { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { store } from '../store'
import { setApiAuthGetter, useGetMeQuery } from '../store/apiSlice'
import {
  clearBackendRole,
  clearPersistedTokens,
  logout,
  setBackendRole,
  setSession,
  selectAccessToken,
} from '../store/authSlice'

export default function AuthSession() {
  const dispatch = useDispatch()
  const accessToken = useSelector(selectAccessToken)
  /** One retry after 401 so Clerk → CRM token + redirect to /app can win the race (stops logout/refresh loop). */
  const retriedMe401 = useRef(false)

  const { data: me, isSuccess, isError, isFetching, error, refetch } = useGetMeQuery(undefined, {
    skip: !accessToken,
    refetchOnFocus: false,
  })

  useEffect(() => {
    setApiAuthGetter(async () => store.getState().auth.accessToken)
  }, [])

  useEffect(() => {
    if (!accessToken) {
      retriedMe401.current = false
      dispatch(clearBackendRole())
      return
    }
    if (isFetching) return
    if (isSuccess && me) {
      retriedMe401.current = false
      dispatch(
        setSession({
          id: me.id,
          name: me.username,
          email: me.email,
        }),
      )
      dispatch(
        setBackendRole({
          role: me.role,
          clerk_id: me.clerk_id,
          email: me.email,
        }),
      )
    } else if (isError) {
      const status = error?.status
      if (status === 401 || status === 403) {
        if (!retriedMe401.current) {
          retriedMe401.current = true
          // Brief delay so the access token is definitely on the wire after Clerk exchange + redirect.
          window.setTimeout(() => void refetch(), 100)
          return
        }
        clearPersistedTokens()
        dispatch(logout())
      }
    }
  }, [accessToken, isFetching, isSuccess, isError, error, me, dispatch, refetch])

  return null
}
