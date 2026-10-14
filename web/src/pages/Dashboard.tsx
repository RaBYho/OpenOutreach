import { useQuery } from '@tanstack/react-query'
import { getStatus } from '@/api'
import {
  Users, Mail, MailOpen, CheckCircle2, AlertCircle,
  TrendingUp, Search, Send, Zap,
} from 'lucide-react'
import clsx from 'clsx'

function StatCard({
  label, value, icon: Icon, color,
}: { label: string; value: number | string; icon: React.ElementType; color: string }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 flex items-start gap-4">
      <div className={clsx('flex h-12 w-12 items-center justify-center rounded-xl', color)}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-0.5">{value}</p>
      </div>
    </div>
  )
}

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className={clsx(
      'flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium',
      ok
        ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400'
        : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400',
    )}>
      {ok ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
      {label}
    </div>
  )
}

export default function Dashboard() {
  const { data: status, isLoading } = useQuery({ queryKey: ['status'], queryFn: getStatus, refetchInterval: 15_000 })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
      </div>
    )
  }

  if (!status) return null

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tableau de bord</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Vue d'ensemble de votre campagne de prospection.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Leads trouvés" value={status.leads_found} icon={Users} color="bg-blue-500" />
        <StatCard label="Avec email" value={status.leads_with_email} icon={Search} color="bg-violet-500" />
        <StatCard label="Emails envoyés" value={status.emails_sent} icon={Send} color="bg-brand-600" />
        <StatCard label="Emails ouverts" value={status.emails_opened} icon={MailOpen} color="bg-emerald-500" />
      </div>

      {/* System status */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="h-5 w-5 text-brand-600" />
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">État du système</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          <StatusBadge ok={status.is_configured} label="Configuration" />
          <StatusBadge ok={status.finder_ready} label="Moteur de recherche" />
          <StatusBadge ok={status.sender_ready} label="Agent d'envoi" />
        </div>

        {[...status.finder_issues, ...status.sender_issues].length > 0 && (
          <div className="mt-4 space-y-1">
            {[...status.finder_issues, ...status.sender_issues].map((issue, i) => (
              <p key={i} className="text-sm text-red-600 dark:text-red-400 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                {issue}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Conversion */}
      {status.leads_with_email > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-brand-600" />
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Conversion</h2>
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-400">Taux d'envoi</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {Math.round((status.emails_sent / status.leads_with_email) * 100)}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                <div
                  className="h-2 rounded-full bg-brand-500 transition-all"
                  style={{ width: `${Math.min(100, Math.round((status.emails_sent / status.leads_with_email) * 100))}%` }}
                />
              </div>
            </div>
            {status.emails_sent > 0 && (
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-400">Taux d'ouverture</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {Math.round((status.emails_opened / status.emails_sent) * 100)}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  <div
                    className="h-2 rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${Math.min(100, Math.round((status.emails_opened / status.emails_sent) * 100))}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

