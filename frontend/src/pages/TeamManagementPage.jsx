import { useMemo, useState } from 'react'

import { Shield, UserX, Users } from 'lucide-react'

import RoleBadge from '../components/RoleBadge'
import {
  useDeleteAdminUserMutation,
  useGetAdminUsersQuery,
  useGetMeQuery,
  usePatchAdminUserRoleMutation,
} from '../store/apiSlice'

const ROLES = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'AGENT', label: 'Agent' },
]

export default function TeamManagementPage() {
  const { data, isLoading, isError, error } = useGetAdminUsersQuery()
  const { data: me, isLoading: meLoading } = useGetMeQuery()
  const [patchRole, { isLoading: isSaving }] = usePatchAdminUserRoleMutation()
  const [deleteUser, { isLoading: isTerminating }] = useDeleteAdminUserMutation()
  const [terminateError, setTerminateError] = useState(null)

  const rows = useMemo(() => {
    const raw = data?.results ?? data
    return Array.isArray(raw) ? raw : []
  }, [data])

  const handleRoleChange = async (profileId, role) => {
    setTerminateError(null)
    await patchRole({ profileId, role }).unwrap()
  }

  const handleTerminate = async (row) => {
    setTerminateError(null)
    const name = row.username || row.email || row.clerk_id || 'this user'
    const ok = window.confirm(
      `Terminate agent ${name}? Their login will be removed and their leads will be unassigned (owner cleared). This cannot be undone.`,
    )
    if (!ok) return
    try {
      await deleteUser(row.id).unwrap()
    } catch (e) {
      const msg = e?.data?.detail ?? e?.error ?? 'Could not terminate user.'
      setTerminateError(typeof msg === 'string' ? msg : 'Could not terminate user.')
    }
  }

  const busy = isSaving || isTerminating

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Team management
          </h1>
          <RoleBadge />
        </div>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Roles are stored in the database and verified on every API request. CRM admins and Django
          superusers can terminate agents; admins cannot be removed from this screen.
        </p>
        {terminateError && (
          <p className="mt-2 text-sm text-rose-600 dark:text-rose-400" role="alert">
            {terminateError}
          </p>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900/50">
        <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/80">
          <Users className="h-4 w-4 text-slate-500" />
          <span className="text-sm font-medium text-slate-800 dark:text-slate-200">Users</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-800/80">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                  Username
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                  Role
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {isLoading && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-500">
                    Loading team…
                  </td>
                </tr>
              )}
              {isError && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-rose-600">
                    {error?.data?.detail ?? error?.error ?? 'Could not load users.'}
                  </td>
                </tr>
              )}
              {!isLoading &&
                !isError &&
                rows.map((u) => {
                  const isSelf = me?.profile_id != null && u.id === me.profile_id
                  const canTerminate =
                    u.role === 'AGENT' && !isSelf && !meLoading && me?.profile_id != null
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700 dark:text-slate-200">
                        {u.username || u.clerk_id || '—'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700 dark:text-slate-200">
                        {u.email || '—'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex items-center gap-2">
                          <select
                            value={u.role}
                            disabled={busy}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            className={`rounded-lg border px-2 py-1.5 text-sm shadow-sm dark:bg-slate-800 ${
                              u.role === 'ADMIN'
                                ? 'border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100'
                                : 'border-slate-200 bg-white text-slate-800 dark:border-slate-600 dark:text-slate-200'
                            }`}
                            aria-label={`Role for ${u.username || u.id}`}
                          >
                            {ROLES.map((r) => (
                              <option key={r.value} value={r.value}>
                                {r.label}
                              </option>
                            ))}
                          </select>
                          {u.role === 'ADMIN' && (
                            <Shield className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        {canTerminate ? (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => handleTerminate(u)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-xs font-medium text-rose-700 shadow-sm hover:bg-rose-50 disabled:opacity-50 dark:border-rose-900 dark:bg-slate-900 dark:text-rose-300 dark:hover:bg-rose-950/50"
                          >
                            <UserX className="h-3.5 w-3.5" />
                            Terminate
                          </button>
                        ) : u.role === 'AGENT' && isSelf ? (
                          <span className="text-xs text-slate-400">—</span>
                        ) : null}
                      </td>
                    </tr>
                  )
                })}
              {!isLoading && !isError && rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-500">
                    No profiles yet. Register a user to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
