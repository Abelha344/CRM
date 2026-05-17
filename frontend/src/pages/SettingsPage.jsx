import { Download } from 'lucide-react'

import RoleBadge from '../components/RoleBadge'
import { useExportLeadsCsvMutation } from '../store/apiSlice'

export default function SettingsPage() {
  const [exportCsv, { isLoading: isExporting }] = useExportLeadsCsvMutation()

  const handleExport = async () => {
    const blob = await exportCsv().unwrap()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'leads_export.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Settings
          </h1>
          <RoleBadge />
        </div>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Organization-wide preferences and integrations (admin only).
        </p>
      </div>

      <div className="rounded-xl border border-amber-200/80 bg-amber-50/80 p-6 dark:border-amber-900/60 dark:bg-amber-950/30">
        <h2 className="text-sm font-semibold text-amber-950 dark:text-amber-100">Administrative area</h2>
        <p className="mt-2 text-sm text-amber-900/90 dark:text-amber-200/90">
          Connect billing, data retention, and API keys here when you extend Samart CRM. Access is enforced
          by the backend for every sensitive action.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/50">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Mass data export</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Download all leads as CSV. The export is generated only if your session has the Admin role on
          the server.
        </p>
        <button
          type="button"
          onClick={() => handleExport().catch(() => {})}
          disabled={isExporting}
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-500 disabled:opacity-50 dark:border-amber-800 dark:bg-amber-700 dark:hover:bg-amber-600"
        >
          <Download className="h-4 w-4" />
          {isExporting ? 'Preparing…' : 'Export all leads (CSV)'}
        </button>
      </div>
    </div>
  )
}
