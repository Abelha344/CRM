import { Link, useLocation } from 'react-router-dom'

import CrmLogoMark from './CrmLogoMark'

/**
 * Compact auth shell inspired by the provided reference:
 * a light top bar + centered small form card.
 * Logic and routing stay unchanged.
 */
export default function AuthPageLayout({ children }) {
  const { pathname } = useLocation()
  const isRegister = pathname === '/register'

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-100 bg-white">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <CrmLogoMark className="h-8 w-8" />
            <span className="text-sm font-semibold tracking-tight text-slate-900">Samart CRM</span>
          </Link>
          <nav className="flex items-center gap-1.5">
            <Link
              to="/login"
              className={`rounded-md px-3 py-1.5 text-sm font-semibold transition ${
                !isRegister
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className={`rounded-md px-3 py-1.5 text-sm font-semibold transition ${
                isRegister
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              Register
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex min-h-[calc(100vh-4rem)] items-start justify-center px-4 pt-12 pb-8 sm:pt-16">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  )
}
