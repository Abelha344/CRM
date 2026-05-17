const statusStyles = {
  new: 'bg-slate-100 text-slate-800 ring-slate-500/20 dark:bg-slate-800/80 dark:text-slate-200',
  contacted:
    'bg-amber-50 text-amber-900 ring-amber-500/25 dark:bg-amber-950/60 dark:text-amber-100',
  qualified:
    'bg-emerald-50 text-emerald-900 ring-emerald-500/25 dark:bg-emerald-950/60 dark:text-emerald-100',
  lost: 'bg-rose-50 text-rose-900 ring-rose-500/25 dark:bg-rose-950/60 dark:text-rose-100',
}

const labelFor = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  lost: 'Lost',
}

export default function StatusBadge({ status }) {
  const key = status ?? 'new'
  const cls = statusStyles[key] ?? statusStyles.new
  const label = labelFor[key] ?? key

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${cls}`}
    >
      {label}
    </span>
  )
}
