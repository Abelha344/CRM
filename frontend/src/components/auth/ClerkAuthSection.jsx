import { Shield } from 'lucide-react'

/**
 * Minimal Clerk section that blends into the same auth card.
 * Keeps Clerk embedded (no hosted redirect page).
 */
export default function ClerkAuthSection({ variant = 'sign-in', children }) {
  const title = variant === 'sign-in' ? 'Continue with Clerk' : 'Register with Clerk'

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2.5">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
          <Shield className="h-4 w-4" />
        </span>
        <p className="text-sm font-semibold text-slate-700">{title}</p>
      </div>
      {children}
    </div>
  )
}
