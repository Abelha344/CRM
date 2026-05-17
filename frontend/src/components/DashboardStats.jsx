import { ArrowDownRight, ArrowUpRight, DollarSign, Target, Users } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { useGetDashboardStatsQuery } from '../store/apiSlice'

function StatCard({ title, value, sub, icon, trend }) {
  const Icon = icon
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {title}
          </p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-slate-900 dark:text-slate-100">
            {value}
          </p>
          {sub && (
            <p className="mt-1 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
              {trend === 'down' && <ArrowDownRight className="h-3.5 w-3.5 text-rose-500" />}
              {trend === 'up' && <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />}
              {sub}
            </p>
          )}
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300">
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  )
}

function LeadsStatusChart({ byStatus }) {
  const baseOrder = ['new', 'contacted', 'qualified', 'lost']
  const colors = ['#2563eb', '#0ea5e9', '#6366f1', '#8b5cf6']
  const barData = baseOrder.map((k, i) => ({
    name: k,
    value: Number(byStatus?.[k] ?? 0),
    color: colors[i % colors.length],
  }))
  const total = barData.reduce((acc, d) => acc + d.value, 0)
  const pieData = total > 0 ? barData : [{ name: 'no_data', value: 1, color: '#cbd5e1' }]

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/50">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        Report visualization
      </p>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Leads by status (bar + pie chart)</p>

      <div className="mt-4 grid gap-5 lg:grid-cols-2">
        <div className="h-56 rounded-lg bg-slate-50/60 p-2 dark:bg-slate-800/40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {barData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="relative h-56 rounded-lg bg-slate-50/60 p-2 dark:bg-slate-800/40">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                innerRadius={42}
                outerRadius={78}
                paddingAngle={2}
                label={total > 0}
              >
                {pieData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="rounded-full bg-white/90 px-2 py-1 text-xs font-semibold text-slate-700 shadow-sm">
              {total > 0 ? `${total} total` : 'No data'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DashboardStats() {
  const { data, isLoading, isError, error } = useGetDashboardStatsQuery()

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800"
          />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
        {error?.data?.detail ?? error?.error ?? 'Could not load dashboard metrics.'}
      </div>
    )
  }

  const fmtMoney = (v) => {
    const n = Number(v)
    if (Number.isNaN(n)) return '—'
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(n)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          Overview
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Pipeline health and workload at a glance.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total leads"
          value={data?.total_leads ?? '—'}
          sub={`${data?.by_status?.qualified ?? 0} qualified`}
          icon={Users}
          trend="up"
        />
        <StatCard
          title="Pipeline value"
          value={fmtMoney(data?.pipeline_value)}
          sub="Sum of estimated deal values"
          icon={DollarSign}
        />
        <StatCard
          title="Open tasks"
          value={data?.open_tasks ?? '—'}
          sub={`${data?.overdue_tasks ?? 0} overdue`}
          icon={Target}
          trend={data?.overdue_tasks > 0 ? 'down' : 'up'}
        />
        <StatCard
          title="Win rate (decided)"
          value={data?.qualified_rate_when_decided != null ? `${data.qualified_rate_when_decided}%` : '—'}
          sub="Qualified vs qualified+lost"
          icon={Target}
        />
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/50">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Leads by status
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {data?.by_status &&
            Object.entries(data.by_status).map(([k, v]) => (
              <span
                key={k}
                className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-800 dark:bg-slate-800 dark:text-slate-200"
              >
                <span className="capitalize">{k}</span>
                <span className="font-semibold tabular-nums">{v}</span>
              </span>
            ))}
        </div>
      </div>
      <LeadsStatusChart byStatus={data?.by_status} />
    </div>
  )
}
