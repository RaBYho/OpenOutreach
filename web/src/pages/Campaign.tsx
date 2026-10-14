import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { campaignFind, campaignRun, campaignSend, getStatus } from '@/api'
import toast from 'react-hot-toast'
import { Play, Search, Send, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import clsx from 'clsx'

function ActionCard({
  title,
  description,
  icon: Icon,
  color,
  onClick,
  loading,
  disabled,
  children,
}: {
  title: string
  description: string
  icon: React.ElementType
  color: string
  onClick: () => void
  loading?: boolean
  disabled?: boolean
  children?: React.ReactNode
}) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
      <div className="flex items-start gap-4">
        <div className={clsx('flex h-12 w-12 items-center justify-center rounded-xl shrink-0', color)}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>
          {children && <div className="mt-4">{children}</div>}
        </div>
      </div>
      <div className="mt-4">
        <button
          onClick={onClick}
          disabled={disabled || loading}
          className={clsx(
            'w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition-all',
            disabled
              ? 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600 cursor-not-allowed'
              : 'bg-brand-600 text-white hover:bg-brand-700 active:scale-[0.98]',
          )}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {title}
        </button>
      </div>
    </div>
  )
}

export default function Campaign() {
  const queryClient = useQueryClient()
  const [findGoal, setFindGoal] = useState(10)
  const [findEmails, setFindEmails] = useState(false)
  const [sendGoal, setSendGoal] = useState<number | undefined>(undefined)
  const [runGoal, setRunGoal] = useState(5)

  const { data: status } = useQuery({ queryKey: ['status'], queryFn: getStatus })
  const isConfigured = status?.is_configured ?? false

  const invalidate = () => {
    setTimeout(() => queryClient.invalidateQueries({ queryKey: ['status'] }), 1500)
    setTimeout(() => queryClient.invalidateQueries({ queryKey: ['leads'] }), 3000)
  }

  const findMut = useMutation({
    mutationFn: () => campaignFind(findGoal, findEmails),
    onSuccess: (d) => { toast.success(d.detail); invalidate() },
    onError: () => toast.error('Erreur lors du lancement de la recherche.'),
  })

  const sendMut = useMutation({
    mutationFn: () => campaignSend(sendGoal),
    onSuccess: (d) => { toast.success(d.detail); invalidate() },
    onError: () => toast.error('Erreur lors du lancement de l\'envoi.'),
  })

  const runMut = useMutation({
    mutationFn: () => campaignRun(runGoal),
    onSuccess: (d) => { toast.success(d.detail); invalidate() },
    onError: () => toast.error('Erreur lors du lancement du pipeline.'),
  })

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Campagne</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Lancez une recherche, un envoi, ou le pipeline complet.
        </p>
      </div>

      {!isConfigured && (
        <div className="flex items-start gap-3 rounded-xl bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 p-4">
          <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Configuration incomplète</p>
            <p className="text-sm text-amber-700 dark:text-amber-400 mt-0.5">
              Complétez votre configuration dans{' '}
              <a href="/settings" className="font-medium underline">Paramètres</a>{' '}
              avant de lancer une campagne.
            </p>
          </div>
        </div>
      )}

      {/* Run all */}
      <ActionCard
        title="Lancer le pipeline complet"
        description="Trouve des leads qualifiés avec emails et les envoie automatiquement. Idéal pour une première campagne."
        icon={Play}
        color="bg-brand-600"
        onClick={() => runMut.mutate()}
        loading={runMut.isPending}
        disabled={!isConfigured}
      >
        <div>
          <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Objectif (leads)</label>
          <input
            type="number"
            min={1}
            max={100}
            value={runGoal}
            onChange={e => setRunGoal(Number(e.target.value))}
            className="mt-1 w-24 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <p className="text-xs text-gray-400 mt-1">≤ {runGoal} crédits email seront consommés.</p>
        </div>
      </ActionCard>

      <div className="grid sm:grid-cols-2 gap-4">
        {/* Find */}
        <ActionCard
          title="Trouver des leads"
          description="Recherche et qualifie des leads. Gratuit sans emails."
          icon={Search}
          color="bg-violet-500"
          onClick={() => findMut.mutate()}
          loading={findMut.isPending}
          disabled={!isConfigured}
        >
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Nombre de leads</label>
              <input
                type="number"
                min={1}
                max={100}
                value={findGoal}
                onChange={e => setFindGoal(Number(e.target.value))}
                className="mt-1 w-24 block rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={findEmails}
                onChange={e => setFindEmails(e.target.checked)}
                className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Inclure les emails (payant)</span>
            </label>
          </div>
        </ActionCard>

        {/* Send */}
        <ActionCard
          title="Envoyer les emails"
          description="Envoie les emails aux leads déjà qualifiés avec adresse."
          icon={Send}
          color="bg-emerald-500"
          onClick={() => sendMut.mutate()}
          loading={sendMut.isPending}
          disabled={!isConfigured}
        >
          <div>
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Limite d'envoi (optionnel)</label>
            <input
              type="number"
              min={1}
              placeholder="Illimité"
              value={sendGoal ?? ''}
              onChange={e => setSendGoal(e.target.value ? Number(e.target.value) : undefined)}
              className="mt-1 w-28 block rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </ActionCard>
      </div>

      {/* Recent activity indicator */}
      {status && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="h-5 w-5 text-brand-600" />
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Bilan actuel</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Leads trouvés', value: status.leads_found },
              { label: 'Avec email', value: status.leads_with_email },
              { label: 'Emails envoyés', value: status.emails_sent },
              { label: 'Ouverts', value: status.emails_opened },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

