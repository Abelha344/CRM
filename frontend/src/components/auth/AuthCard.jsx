/** Compact auth card to match the provided sign-in reference. */
export default function AuthCard({ children, className = '' }) {
  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white p-5 shadow-[0_10px_30px_-14px_rgba(15,23,42,0.25)] sm:p-6 ${className}`}
    >
      {children}
    </div>
  )
}
