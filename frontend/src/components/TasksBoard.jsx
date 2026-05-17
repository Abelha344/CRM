import { useMemo, useState } from 'react'
import { CheckCircle2, Circle, Plus, Trash2 } from 'lucide-react'

import {
  useCreateTaskMutation,
  useDeleteTaskMutation,
  useGetLeadsQuery,
  useGetTasksQuery,
  useUpdateTaskMutation,
} from '../store/apiSlice'

export default function TasksBoard() {
  const [showOpenOnly, setShowOpenOnly] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({
    lead: '',
    title: '',
    description: '',
    due_date: '',
    priority: 2,
  })

  const taskParams = useMemo(() => {
    const p = { page_size: 50 }
    if (showOpenOnly) p.completed = false
    return p
  }, [showOpenOnly])

  const { data, isLoading, isError, error } = useGetTasksQuery(taskParams)
  const { data: leadsPage } = useGetLeadsQuery({ page_size: 100 })
  const [createTask, { isLoading: isCreating }] = useCreateTaskMutation()
  const [updateTask] = useUpdateTaskMutation()
  const [deleteTask] = useDeleteTaskMutation()

  const tasks = data?.results ?? data ?? []
  const leads = leadsPage?.results ?? leadsPage ?? []

  const toggleDone = (task) => {
    updateTask({
      id: task.id,
      lead: task.lead,
      title: task.title,
      description: task.description ?? '',
      due_date: task.due_date,
      completed: !task.completed,
      priority: task.priority ?? 2,
    })
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.lead || !form.title.trim()) return
    await createTask({
      lead: Number(form.lead),
      title: form.title.trim(),
      description: form.description,
      due_date: form.due_date || null,
      priority: Number(form.priority),
      completed: false,
    }).unwrap()
    setModalOpen(false)
    setForm({ lead: '', title: '', description: '', due_date: '', priority: 2 })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Tasks
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Follow-ups tied to leads. Priorities help your team focus.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <input
              type="checkbox"
              checked={showOpenOnly}
              onChange={(e) => setShowOpenOnly(e.target.checked)}
              className="rounded border-slate-300"
            />
            Open only
          </label>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            <Plus className="h-4 w-4" />
            New task
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900/50">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-800/80">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">
                  Task
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">
                  Lead
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600 md:table-cell dark:text-slate-400">
                  Due
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">
                  Priority
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">
                  Done
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {isLoading && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">
                    Loading tasks…
                  </td>
                </tr>
              )}
              {isError && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-rose-600">
                    {error?.data?.detail ?? error?.error ?? 'Could not load tasks.'}
                  </td>
                </tr>
              )}
              {!isLoading && !isError && tasks.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">
                    No tasks yet. Create one linked to a lead.
                  </td>
                </tr>
              )}
              {tasks.map((task) => (
                <tr key={task.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3 text-sm">
                    <p className="font-medium text-slate-900 dark:text-slate-100">{task.title}</p>
                    {task.description && (
                      <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{task.description}</p>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                    {task.lead_name || `Lead #${task.lead}`}
                  </td>
                  <td className="hidden whitespace-nowrap px-4 py-3 text-sm text-slate-600 md:table-cell dark:text-slate-400">
                    {task.due_date
                      ? new Date(task.due_date).toLocaleString(undefined, {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })
                      : '—'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    <span
                      className={
                        task.priority === 1
                          ? 'text-rose-600 dark:text-rose-400'
                          : task.priority === 3
                            ? 'text-slate-500'
                            : 'text-slate-700 dark:text-slate-300'
                      }
                    >
                      {task.priority === 1 ? 'High' : task.priority === 3 ? 'Low' : 'Normal'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => toggleDone(task)}
                      className="inline-flex rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                      aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
                    >
                      {task.completed ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      ) : (
                        <Circle className="h-5 w-5" />
                      )}
                    </button>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => deleteTask(task.id)}
                      className="inline-flex rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/50"
                      aria-label="Delete task"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/50"
            aria-label="Close"
            onClick={() => setModalOpen(false)}
          />
          <form
            onSubmit={handleCreate}
            className="relative z-10 w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900"
          >
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">New task</h2>
            <div className="mt-4 space-y-3">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Lead
                <select
                  required
                  value={form.lead}
                  onChange={(e) => setForm((f) => ({ ...f, lead: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                >
                  <option value="">Select lead</option>
                  {leads.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.first_name} {l.last_name} — {l.company || l.email}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Title
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Description
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={2}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Due
                  <input
                    type="datetime-local"
                    value={form.due_date}
                    onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  />
                </label>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Priority
                  <select
                    value={form.priority}
                    onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value={1}>High</option>
                    <option value={2}>Normal</option>
                    <option value={3}>Low</option>
                  </select>
                </label>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreating}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                {isCreating ? 'Creating…' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
