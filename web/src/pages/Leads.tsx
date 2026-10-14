import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getLeads } from '@/api'
import { Download, Search, Linkedin, Globe, ChevronLeft, ChevronRight, Mail } from 'lucide-react'
import clsx from 'clsx'

export default function Leads() {
  const [page, setPage] = useState(1)
  const [withEmail, setWithEmail] = useState<boolean | undefined>(undefined)
  const [search, setSearch] = useState('')
  const PER_PAGE = 50

  const { data, isLoading } = useQuery({
    queryKey: ['leads', page, withEmail],
    queryFn: () => getLeads(page, PER_PAGE, withEmail),
  })

  const leads = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE))

  const filtered = search.trim()
    ? leads.filter(l =>
      [l.first_name, l.last_name, l.company, l.title, l.email]
        .join(' ')
        .toLowerCase()
        .includes(search.toLowerCase()),
    )
    : leads

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Leads</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {total} lead{total !== 1 ? 's' : ''} qualifié{total !== 1 ? 's' : ''}
          </p>
        </div>
        <a
          href="/api/v1/leads/export"
          download="leads.csv"
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
        >
          <Download className="h-4 w-4" />
          Exporter CSV
        </a>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="search"
            placeholder="Rechercher un lead…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div className="flex rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden text-sm">
          {[
            { label: 'Tous', value: undefined },
            { label: 'Avec email', value: true },
            { label: 'Sans email', value: false },
          ].map(opt => (
            <button
              key={String(opt.value)}
              onClick={() => { setWithEmail(opt.value); setPage(1) }}
              className={clsx(
                'px-3 py-2.5 font-medium transition-colors',
                withEmail === opt.value
                  ? 'bg-brand-600 text-white'
                  : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <Search className="h-10 w-10 mb-2" />
            <p>Aucun lead trouvé.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50">
                  {['Personne', 'Entreprise', 'Email', 'Raison', 'Liens'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filtered.map(lead => (
                  <tr key={lead.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 dark:text-white text-sm">
                        {lead.first_name} {lead.last_name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{lead.title}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{lead.company}</td>
                    <td className="px-4 py-3">
                      {lead.email ? (
                        <a href={`mailto:${lead.email}`} className="flex items-center gap-1.5 text-sm text-brand-600 hover:underline">
                          <Mail className="h-3.5 w-3.5" />
                          {lead.email}
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">{lead.reason}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {lead.linkedin_url && (
                          <a href={lead.linkedin_url} target="_blank" rel="noreferrer"
                            className="text-blue-600 hover:text-blue-700">
                            <Linkedin className="h-4 w-4" />
                          </a>
                        )}
                        {lead.website && (
                          <a href={lead.website} target="_blank" rel="noreferrer"
                            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                            <Globe className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Page {page} sur {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
              Précédent
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex items-center gap-1 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Suivant
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

