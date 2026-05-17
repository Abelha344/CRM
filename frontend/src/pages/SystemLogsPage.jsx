import { ScrollText } from 'lucide-react'

import RoleBadge from '../components/RoleBadge'
import { useGetAdminLogsQuery } from '../store/apiSlice'

export default function SystemLogsPage() {
  const { data, isLoading, isError, error } = useGetAdminLogsQuery()

  const rows = data?.results ?? (Array.isArray(data) ? data : [])

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            System logs
          </h1>
          <RoleBadge />
        </div>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Audit trail for lead lifecycle events (admin only).
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900/50">
        <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/80">
          <ScrollText className="h-4 w-4 text-slate-500" />
          <span className="text-sm font-medium text-slate-800 dark:text-slate-200">Recent entries</span>
        </div>
        <ul className="divide-y divide-slate-200 dark:divide-slate-700">
          {isLoading && (
            <li className="px-4 py-8 text-center text-sm text-slate-500">Loading logs…</li>
          )}
          {isError && (
            <li className="px-4 py-8 text-center text-sm text-rose-600">
              {error?.data?.detail ?? error?.error ?? 'Could not load logs.'}
            </li>
          )}
          {!isLoading &&
            !isError &&
            rows.map((log) => (
              <li key={log.id} className="px-4 py-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm text-slate-800 dark:text-slate-100">{log.message}</p>
                  <span className="text-xs tabular-nums text-slate-500 dark:text-slate-400">
                    {log.created_at ? new Date(log.created_at).toLocaleString() : ''}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-medium text-slate-600 dark:text-slate-300">{log.level}</span>
                  {log.actor_clerk_id ? ` · ${log.actor_clerk_id}` : ''}
                </p>
              </li>
            ))}
          {!isLoading && !isError && rows.length === 0 && (
            <li className="px-4 py-8 text-center text-sm text-slate-500">No log entries yet.</li>
          )}
        </ul>
      </div>
    </div>
  )
}
