/**
 * Visual cue for administrative context (Tailwind).
 */
export default function RoleBadge({ className = '' }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-amber-300/80 bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-900 shadow-sm dark:border-amber-700/80 dark:bg-amber-950/60 dark:text-amber-100 ${className}`}
    >
      Admin
    </span>
  )
}
