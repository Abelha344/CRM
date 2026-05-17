/** Horizontal rule with centered label between email/password and other sign-in methods. */
export default function AuthMethodDivider({ children = 'Or continue with' }) {
  return (
    <div className="relative my-8">
      <div className="absolute inset-0 flex items-center" aria-hidden>
        <div className="w-full border-t border-slate-200/90" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-white px-4 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
          {children}
        </span>
      </div>
    </div>
  )
}
