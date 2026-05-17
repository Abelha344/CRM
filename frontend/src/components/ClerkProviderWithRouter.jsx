import { ClerkProvider } from '@clerk/react'
import { useNavigate } from 'react-router-dom'

/**
 * Clerk defaults to `window.location` for redirects (full page reload). Passing routerPush /
 * routerReplace makes SignIn / SignUp / UserButton use React Router — no browser self-refresh.
 */
export default function ClerkProviderWithRouter({ publishableKey, children }) {
  const navigate = useNavigate()

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      routerPush={async (to) => {
        navigate(to)
      }}
      routerReplace={async (to) => {
        navigate(to, { replace: true })
      }}
    >
      {children}
    </ClerkProvider>
  )
}
