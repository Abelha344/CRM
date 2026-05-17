import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, Search, Trash2 } from 'lucide-react'
import { useSelector } from 'react-redux'

import {
  useCreateLeadMutation,
  useDeleteLeadMutation,
  useGetLeadsQuery,
  useUpdateLeadMutation,
} from '../store/apiSlice'
import { selectIsAdmin } from '../store/authSlice'
import LeadDetailDrawer from './LeadDetailDrawer'
import NewLeadModal from './NewLeadModal'
import StatusBadge from './StatusBadge'

function buildLeadPayload(lead) {
  return {
    first_name: lead.first_name,
    last_name: lead.last_name,
    email: lead.email,
    phone: lead.phone ?? '',
    company: lead.company ?? '',
    status: lead.status,
    source: lead.source ?? 'other',
    estimated_value:
      lead.estimated_value != null && lead.estimated_value !== ''
        ? Number(lead.estimated_value)
        : null,
    last_contacted_at: lead.last_contacted_at,
  }
}

export default function LeadsTable() {
  const isAdmin = useSelector(selectIsAdmin)
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [drawerLead, setDrawerLead] = useState(null)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 350)
    return () => clearTimeout(t)
  }, [searchInput])

  const queryArgs = useMemo(() => {
    const p = { page, page_size: 25 }
    if (debouncedSearch) p.search = debouncedSearch
    if (statusFilter) p.status = statusFilter
    return p
  }, [page, debouncedSearch, statusFilter])

  const { data, isLoading, isError, error, isFetching } = useGetLeadsQuery(queryArgs)
  const [createLead, { isLoading: isCreating }] = useCreateLeadMutation()
  const [updateLead] = useUpdateLeadMutation()
  const [deleteLead] = useDeleteLeadMutation()

  const leads = data?.results ?? (Array.isArray(data) ? data : [])
  const total = data?.count ?? leads.length
  const totalPages = Math.max(1, Math.ceil(total / 25))

  const handleStatusChange = (lead, e) => {
    const status = e.target.value
    updateLead({
      id: lead.id,
      ...buildLeadPayload(lead),
      status,
    })
  }

  const handleNewLead = async (form) => {
    await createLead(form).unwrap()
    setModalOpen(false)
    setPage(1)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Leads
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Search, filter by stage, and open a lead for notes and context.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition ${
            isAdmin
              ? 'bg-amber-600 hover:bg-amber-500 dark:bg-amber-700 dark:hover:bg-amber-600'
              : 'bg-indigo-600 hover:bg-indigo-500'
          }`}
        >
          <Plus className="h-4 w-4" />
          New lead
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Search name, email, company, phone…"
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value)
              setPage(1)
            }}
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm text-slate-900 shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value)
            setPage(1)
          }}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
        >
          <option value="">All stages</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="qualified">Qualified</option>
          <option value="lost">Lost</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900/50">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-800/80">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                  Email
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 lg:table-cell dark:text-slate-400">
                  Company
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 md:table-cell dark:text-slate-400">
                  Source
                </th>
                <th className="hidden px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600 sm:table-cell dark:text-slate-400">
                  Est. value
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {(isLoading || isFetching) && !leads.length && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">
                    Loading leads…
                  </td>
                </tr>
              )}
              {isError && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-rose-600">
                    {error?.data?.detail ?? error?.error ?? 'Could not load leads. Is the API running?'}
                  </td>
                </tr>
              )}
              {!isLoading && !isError && leads.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">
                    No leads match your filters.
                  </td>
                </tr>
              )}
              {leads.map((lead) => (
                <tr
                  key={lead.id}
                  className="cursor-pointer transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                  onClick={() => setDrawerLead(lead)}
                >
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-slate-900 dark:text-slate-100">
                    {lead.first_name} {lead.last_name}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                    {lead.email}
                  </td>
                  <td className="hidden whitespace-nowrap px-4 py-3 text-sm text-slate-600 lg:table-cell dark:text-slate-300">
                    {lead.company || '—'}
                  </td>
                  <td className="hidden whitespace-nowrap px-4 py-3 text-sm capitalize text-slate-600 md:table-cell dark:text-slate-300">
                    {lead.source?.replace(/_/g, ' ') || '—'}
                  </td>
                  <td className="hidden whitespace-nowrap px-4 py-3 text-right text-sm tabular-nums text-slate-700 sm:table-cell dark:text-slate-200">
                    {lead.estimated_value != null && lead.estimated_value !== ''
                      ? new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(
                          Number(lead.estimated_value),
                        )
                      : '—'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={lead.status} />
                      <select
                        value={lead.status}
                        onChange={(e) => handleStatusChange(lead, e)}
                        className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800 shadow-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                        aria-label={`Change status for ${lead.first_name} ${lead.last_name}`}
                      >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="qualified">Qualified</option>
                        <option value="lost">Lost</option>
                      </select>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => deleteLead(lead.id)}
                      className="inline-flex rounded-lg p-2 text-slate-500 transition hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/50 dark:hover:text-rose-300"
                      aria-label={`Delete ${lead.first_name} ${lead.last_name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {total > 25 && (
          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-400">
            <span>
              Page {page} of {totalPages} ({total} leads)
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 font-medium hover:bg-slate-50 disabled:opacity-40 dark:border-slate-600 dark:hover:bg-slate-800"
              >
                <ChevronLeft className="h-4 w-4" />
                Prev
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 font-medium hover:bg-slate-50 disabled:opacity-40 dark:border-slate-600 dark:hover:bg-slate-800"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <NewLeadModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleNewLead}
        isSubmitting={isCreating}
      />

      {drawerLead && (
        <LeadDetailDrawer lead={drawerLead} onClose={() => setDrawerLead(null)} />
      )}
    </div>
  )
}
