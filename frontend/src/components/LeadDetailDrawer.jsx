import { useState } from 'react'
import { X } from 'lucide-react'

import { useCreateNoteMutation, useGetNotesQuery } from '../store/apiSlice'
import StatusBadge from './StatusBadge'

export default function LeadDetailDrawer({ lead, onClose }) {
  const [body, setBody] = useState('')
  const { data: notes, isLoading } = useGetNotesQuery(lead.id, { skip: !lead })
  const [createNote, { isLoading: isSaving }] = useCreateNoteMutation()

  if (!lead) return null

  const handleAddNote = async (e) => {
    e.preventDefault()
    if (!body.trim()) return
    await createNote({ lead: lead.id, body: body.trim() }).unwrap()
    setBody('')
  }

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm"
        aria-label="Close panel"
        onClick={onClose}
      />
      <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-slate-700">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Lead detail
            </p>
            <h2 className="mt-1 truncate text-lg font-semibold text-slate-900 dark:text-slate-100">
              {lead.first_name} {lead.last_name}
            </h2>
            <div className="mt-2">
              <StatusBadge status={lead.status} />
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <dl className="grid grid-cols-1 gap-3 text-sm">
            <div>
              <dt className="text-slate-500 dark:text-slate-400">Email</dt>
              <dd className="font-medium text-slate-900 dark:text-slate-100">{lead.email}</dd>
            </div>
            <div>
              <dt className="text-slate-500 dark:text-slate-400">Company</dt>
              <dd className="font-medium text-slate-900 dark:text-slate-100">{lead.company || '—'}</dd>
            </div>
            <div>
              <dt className="text-slate-500 dark:text-slate-400">Source</dt>
              <dd className="capitalize text-slate-800 dark:text-slate-200">
                {lead.source?.replace(/_/g, ' ') || '—'}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500 dark:text-slate-400">Est. value</dt>
              <dd className="font-medium tabular-nums text-slate-900 dark:text-slate-100">
                {lead.estimated_value != null && lead.estimated_value !== ''
                  ? new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(
                      Number(lead.estimated_value),
                    )
                  : '—'}
              </dd>
            </div>
          </dl>

          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Activity notes</h3>
            <ul className="mt-2 space-y-2">
              {isLoading && <li className="text-sm text-slate-500">Loading notes…</li>}
              {!isLoading && (!notes || notes.length === 0) && (
                <li className="text-sm text-slate-500">No notes yet.</li>
              )}
              {notes?.map((n) => (
                <li
                  key={n.id}
                  className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-200"
                >
                  <p className="whitespace-pre-wrap">{n.body}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {n.created_at ? new Date(n.created_at).toLocaleString() : ''}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <form
          onSubmit={handleAddNote}
          className="border-t border-slate-200 p-4 dark:border-slate-700"
        >
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
            Add note
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
              placeholder="Call summary, objection, next step…"
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            />
          </label>
          <div className="mt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSaving || !body.trim()}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {isSaving ? 'Saving…' : 'Save note'}
            </button>
          </div>
        </form>
      </aside>
    </>
  )
}
