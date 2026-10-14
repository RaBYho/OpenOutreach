import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getConfig, getProviders, testLLM, updateConfig } from '@/api'
import toast from 'react-hot-toast'
import {
  Bot, Building2, Mail, User, CheckCircle2, XCircle,
  Loader2, Eye, EyeOff, ChevronRight, ExternalLink,
} from 'lucide-react'
import clsx from 'clsx'
import { NavLink, Route, Routes, useNavigate } from 'react-router-dom'

// ── Shared Components ─────────────────────────────────────────────────────────

function Field({
  label, hint, children,
}: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{label}</label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-gray-400">{hint}</p>}
    </div>
  )
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={clsx(
        'w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-shadow',
        props.className,
      )}
    />
  )
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={clsx(
        'w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none transition-shadow',
        props.className,
      )}
    />
  )
}

function SecretInput({ value, onChange, placeholder }: {
  value: string; onChange: (v: string) => void; placeholder?: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <Input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="pr-10"
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  )
}

function SaveButton({ loading, onClick }: { loading: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60 transition-colors"
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      Enregistrer
    </button>
  )
}

function Section({ title, description, children }: {
  title: string; description?: string; children: React.ReactNode
}) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-5">
      <div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">{2}{title}</h2>
        {description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>}
      </div>
      {children}
    </div>
  )
}

// ── Sub-pages ─────────────────────────────────────────────────────────────────

function CampaignSettings() {
  const qc = useQueryClient()
  const { data: config } = useQuery({ queryKey: ['config'], queryFn: getConfig })
  const [docs, setDocs] = useState('')
  const [target, setTarget] = useState('')
  const [booking, setBooking] = useState('')
  const loaded = !!config

  useState(() => { if (config) { setDocs(config.product_docs); setTarget(config.campaign_target); setBooking(config.booking_link) } })

  const mut = useMutation({
    mutationFn: () => updateConfig({ product_docs: docs, campaign_target: target, booking_link: booking }),
    onSuccess: () => { toast.success('Configuration sauvegardée ✓'); qc.invalidateQueries({ queryKey: ['config'] }) },
    onError: () => toast.error('Erreur lors de la sauvegarde.'),
  })

  if (!loaded) return <Loader2 className="h-6 w-6 animate-spin mx-auto mt-8 text-brand-600" />

  return (
    <div className="space-y-4">
      <Section title="Votre produit & cible" description="Décrivez précisément ce que vous vendez et à qui. L'IA utilisera ces textes pour qualifier les leads et rédiger les emails.">
        <Field label="Description de votre produit" hint="Soyez précis : le problème résolu, la valeur unique, le profil de client idéal.">
          <Textarea rows={5} value={docs} onChange={e => setDocs(e.target.value)} placeholder="Ex: Nous proposons une solution de gestion de leads IA pour les équipes commerciales B2B de 5 à 50 personnes…" />
        </Field>
        <Field label="Cible de la campagne" hint="Décrivez le type de personne ou d'organisation que vous voulez contacter.">
          <Textarea rows={4} value={target} onChange={e => setTarget(e.target.value)} placeholder="Ex: Directeurs commerciaux dans des SaaS B2B en croissance, entreprises de 20 à 200 employés…" />
        </Field>
        <Field label="Lien de réservation (optionnel)" hint="Un lien Calendly ou Cal.com ajouté automatiquement dans vos emails.">
          <Input value={booking} onChange={e => setBooking(e.target.value)} placeholder="https://cal.com/votre-nom/15min" />
        </Field>
        <div className="flex justify-end">
          <SaveButton loading={mut.isPending} onClick={() => mut.mutate()} />
        </div>
      </Section>
    </div>
  )
}

const PROVIDER_LOGOS: Record<string, React.ReactNode> = {
  openrouter: <span className="text-lg">🔀</span>,
  anthropic: <span className="text-lg">🧠</span>,
  google: <span className="text-lg">✨</span>,
  openai: <span className="text-lg">⚡</span>,
  groq: <span className="text-lg">🚀</span>,
  mistral: <span className="text-lg">🌊</span>,
  ollama: <span className="text-lg">🦙</span>,
}

function AISettings() {
  const qc = useQueryClient()
  const { data: config } = useQuery({ queryKey: ['config'], queryFn: getConfig })
  const { data: providers } = useQuery({ queryKey: ['providers'], queryFn: getProviders })

  const [selectedProviderId, setSelectedProviderId] = useState<string>('')
  const [selectedModel, setSelectedModel] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [apiBase, setApiBase] = useState('')
  const [testResult, setTestResult] = useState<'idle' | 'testing' | 'ok' | 'error'>('idle')
  const [testError, setTestError] = useState('')

  const provider = providers?.find(p => p.id === selectedProviderId)

  // Initialise from saved config
  useState(() => {
    if (config && providers && !selectedProviderId) {
      const m = config.ai_model
      if (m) {
        const pfx = m.split(':')[0]
        const found = providers.find(p => p.prefix === pfx)
        if (found) {
          setSelectedProviderId(found.id)
          setSelectedModel(m.slice(pfx.length + 1))
          setApiBase(config.llm_api_base || found.default_base)
        }
      }
    }
  })

  const aiModel = provider ? `${provider.prefix}:${selectedModel}` : ''

  const testMut = useMutation({
    mutationFn: () => testLLM({ ai_model: aiModel, llm_api_key: apiKey, llm_api_base: apiBase }),
    onMutate: () => { setTestResult('testing'); setTestError('') },
    onSuccess: (d) => {
      if (d.success) { setTestResult('ok'); toast.success('Connexion réussie ✓') }
      else { setTestResult('error'); setTestError(d.error || 'Erreur inconnue.') }
    },
    onError: () => { setTestResult('error'); setTestError('Impossible de joindre le serveur.') },
  })

  const saveMut = useMutation({
    mutationFn: () => updateConfig({ ai_model: aiModel, llm_api_key: apiKey, llm_api_base: apiBase }),
    onSuccess: () => { toast.success('Fournisseur IA enregistré ✓'); qc.invalidateQueries({ queryKey: ['config'] }) },
    onError: () => toast.error('Erreur lors de la sauvegarde.'),
  })

  if (!providers) return <Loader2 className="h-6 w-6 animate-spin mx-auto mt-8 text-brand-600" />

  return (
    <div className="space-y-4">
      <Section title="Fournisseur d'intelligence artificielle" description="Choisissez le modèle qui qualifiera vos leads et rédigera vos emails de prospection.">
        {/* Provider cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {providers.map(p => (
            <button
              key={p.id}
              onClick={() => {
                setSelectedProviderId(p.id)
                setSelectedModel(p.models[0]?.id ?? '')
                setApiBase(p.default_base)
                setTestResult('idle')
              }}
              className={clsx(
                'flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all',
                selectedProviderId === p.id
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-950'
                  : 'border-gray-200 dark:border-gray-700 hover:border-brand-300 hover:bg-gray-50 dark:hover:bg-gray-800',
              )}
            >
              <div className="text-2xl">{PROVIDER_LOGOS[p.id] ?? '🤖'}</div>
              <div>
                <p className={clsx('text-xs font-semibold', selectedProviderId === p.id ? 'text-brand-700 dark:text-brand-300' : 'text-gray-700 dark:text-gray-300')}>{p.name}</p>
              </div>
              {selectedProviderId === p.id && (
                <CheckCircle2 className="h-4 w-4 text-brand-500" />
              )}
            </button>
          ))}
        </div>

        {provider && (
          <div className="space-y-4 pt-2 border-t border-gray-100 dark:border-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">{provider.description}</p>

            {/* Model selector */}
            <Field label="Modèle">
              <select
                value={selectedModel}
                onChange={e => setSelectedModel(e.target.value)}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {provider.models.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
                <option value={selectedModel}>Autre : {selectedModel}</option>
              </select>
              <div className="mt-2">
                <label className="text-xs text-gray-500 dark:text-gray-400">Ou saisissez un identifiant de modèle personnalisé :</label>
                <Input
                  value={selectedModel}
                  onChange={e => setSelectedModel(e.target.value)}
                  placeholder="ex: llama3.3, gemma4:31b…"
                  className="mt-1"
                />
              </div>
            </Field>

            {/* API Key */}
            {(provider.requires_key || !provider.requires_base) && (
              <Field
                label={`Clé API ${!provider.requires_key ? '(optionnel)' : ''}`}
                hint={config?.has_llm_api_key ? '✓ Une clé est déjà enregistrée. Laissez vide pour la conserver.' : undefined}
              >
                <SecretInput
                  value={apiKey}
                  onChange={setApiKey}
                  placeholder={config?.has_llm_api_key ? '••••••••••••••••' : 'sk-…'}
                />
              </Field>
            )}

            {/* API Base */}
            {(provider.requires_base || provider.id === 'openrouter') && (
              <Field
                label="URL de l'API"
                hint={provider.id === 'ollama' ? 'Ex : http://localhost:11434/v1 ou https://votre-serveur-ollama.com/v1' : undefined}
              >
                <Input
                  value={apiBase}
                  onChange={e => setApiBase(e.target.value)}
                  placeholder={provider.default_base || 'https://…'}
                />
              </Field>
            )}

            {/* Test */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => testMut.mutate()}
                disabled={testMut.isPending || !selectedModel}
                className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                {testMut.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Tester la connexion
              </button>
              {testResult === 'ok' && (
                <span className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-4 w-4" /> Connexion OK
                </span>
              )}
              {testResult === 'error' && (
                <span className="flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400">
                  <XCircle className="h-4 w-4" /> {testError}
                </span>
              )}
            </div>

            <div className="flex justify-between items-center">
              {provider.id === 'openrouter' && (
                <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer"
                  className="flex items-center gap-1 text-xs text-brand-600 hover:underline">
                  <ExternalLink className="h-3.5 w-3.5" />
                  Obtenir une clé OpenRouter
                </a>
              )}
              <div className="ml-auto">
                <SaveButton loading={saveMut.isPending} onClick={() => saveMut.mutate()} />
              </div>
            </div>
          </div>
        )}
      </Section>
    </div>
  )
}

function DataSettings() {
  const qc = useQueryClient()
  const { data: config } = useQuery({ queryKey: ['config'], queryFn: getConfig })
  const [bcKey, setBcKey] = useState('')
  const [apolloKey, setApolloKey] = useState('')
  const [emailFinder, setEmailFinder] = useState('')

  useState(() => {
    if (config) {
      setEmailFinder(config.email_finder || 'bettercontact')
    }
  })

  const mut = useMutation({
    mutationFn: () => updateConfig({ bettercontact_api_key: bcKey || undefined, apollo_api_key: apolloKey || undefined, email_finder: emailFinder }),
    onSuccess: () => { toast.success('Clés enregistrées ✓'); qc.invalidateQueries({ queryKey: ['config'] }) },
    onError: () => toast.error('Erreur lors de la sauvegarde.'),
  })

  if (!config) return <Loader2 className="h-6 w-6 animate-spin mx-auto mt-8 text-brand-600" />

  return (
    <div className="space-y-4">
      <Section title="Sources de données" description="Les clés API pour trouver des leads et résoudre leurs emails professionnels.">
        <Field
          label="BetterContact API Key"
          hint={config.has_bettercontact_api_key ? '✓ Clé déjà enregistrée. La découverte de leads est gratuite, seule la résolution d\'email coûte 1 crédit.' : 'Créez un compte gratuit (40 crédits, sans CB) via le lien ci-dessous.'}
        >
          <SecretInput
            value={bcKey}
            onChange={setBcKey}
            placeholder={config.has_bettercontact_api_key ? '••••••••••••' : 'bc-…'}
          />
          <a
            href="https://bettercontact.rocks?fpr=openoutreach"
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-xs text-brand-600 hover:underline"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Obtenir une clé BetterContact (lien affilié)
          </a>
        </Field>

        <Field label="Apollo API Key (optionnel)" hint="Alternative à BetterContact pour la résolution d'email.">
          <SecretInput value={apolloKey} onChange={setApolloKey} placeholder={config.apollo_api_key ? '••••••••' : ''} />
        </Field>

        <Field label="Service de résolution d'email préféré">
          <select
            value={emailFinder}
            onChange={e => setEmailFinder(e.target.value)}
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="bettercontact">BetterContact</option>
            <option value="apollo">Apollo</option>
          </select>
        </Field>

        <div className="flex justify-end">
          <SaveButton loading={mut.isPending} onClick={() => mut.mutate()} />
        </div>
      </Section>
    </div>
  )
}

function ProfileSettings() {
  const qc = useQueryClient()
  const { data: config } = useQuery({ queryKey: ['config'], queryFn: getConfig })
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [country, setCountry] = useState('')
  const [newsletter, setNewsletter] = useState(false)

  useState(() => {
    if (config) {
      setName(config.operator_name)
      setEmail(config.operator_email)
      setCountry(config.operator_country_code)
      setNewsletter(config.newsletter)
    }
  })

  const mut = useMutation({
    mutationFn: () => updateConfig({ operator_name: name, operator_email: email, operator_country_code: country, newsletter }),
    onSuccess: () => { toast.success('Profil enregistré ✓'); qc.invalidateQueries({ queryKey: ['config'] }) },
    onError: () => toast.error('Erreur lors de la sauvegarde.'),
  })

  if (!config) return <Loader2 className="h-6 w-6 animate-spin mx-auto mt-8 text-brand-600" />

  return (
    <div className="space-y-4">
      <Section title="Profil de l'opérateur" description="Informations sur vous — utilisées pour signer les emails et respecter votre juridiction.">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Votre nom">
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Jean Dupont" />
          </Field>
          <Field label="Votre email">
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jean@example.com" />
          </Field>
        </div>
        <Field label="Pays (code ISO-3166)" hint="Détermine les règles d'emailing applicables (RGPD, CAN-SPAM…)">
          <Input value={country} onChange={e => setCountry(e.target.value.toUpperCase())} placeholder="FR" maxLength={2} className="w-24" />
        </Field>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={newsletter} onChange={e => setNewsletter(e.target.checked)}
            className="rounded border-gray-300 text-brand-600 focus:ring-brand-500" />
          <span className="text-sm text-gray-700 dark:text-gray-300">Recevoir la newsletter OpenOutreach</span>
        </label>
        <div className="flex justify-end">
          <SaveButton loading={mut.isPending} onClick={() => mut.mutate()} />
        </div>
      </Section>
    </div>
  )
}

function MailboxSettings() {
  const qc = useQueryClient()
  const { data: config } = useQuery({ queryKey: ['config'], queryFn: getConfig })
  const [address, setAddress] = useState('')
  const [password, setPassword] = useState('')
  const [smtpHost, setSmtpHost] = useState('')
  const [smtpPort, setSmtpPort] = useState('')
  const [imapHost, setImapHost] = useState('')
  const [imapPort, setImapPort] = useState('')
  const [signature, setSignature] = useState('')

  useState(() => {
    if (config) {
      setAddress(config.mailbox_address)
      setSmtpHost(config.smtp_host)
      setSmtpPort(config.smtp_port)
      setImapHost(config.imap_host)
      setImapPort(config.imap_port)
      setSignature(config.signature)
    }
  })

  const mut = useMutation({
    mutationFn: () => updateConfig({
      mailbox_address: address,
      ...(password ? { mailbox_password: password } : {}),
      smtp_host: smtpHost, smtp_port: smtpPort,
      imap_host: imapHost, imap_port: imapPort,
      signature,
    }),
    onSuccess: () => { toast.success('Boîte mail enregistrée ✓'); qc.invalidateQueries({ queryKey: ['config'] }) },
    onError: () => toast.error('Erreur lors de la sauvegarde.'),
  })

  if (!config) return <Loader2 className="h-6 w-6 animate-spin mx-auto mt-8 text-brand-600" />

  return (
    <div className="space-y-4">
      <Section title="Boîte email d'envoi" description="La boîte mail depuis laquelle vos emails de prospection seront envoyés.">
        <Field label="Adresse email d'envoi">
          <Input type="email" value={address} onChange={e => setAddress(e.target.value)} placeholder="vous@exemple.com" />
        </Field>
        <Field
          label="Mot de passe d'application"
          hint={config.has_mailbox_password ? '✓ Mot de passe déjà enregistré. Laissez vide pour le conserver. Utilisez un mot de passe d\'application, pas votre mot de passe habituel.' : 'Créez un mot de passe d\'application dans les paramètres de votre fournisseur d\'email.'}
        >
          <SecretInput
            value={password}
            onChange={setPassword}
            placeholder={config.has_mailbox_password ? '••••••••••••' : 'Mot de passe application…'}
          />
        </Field>
        <div className="rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 p-4">
          <p className="text-sm text-amber-800 dark:text-amber-300 font-medium">Google Workspace</p>
          <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
            Laissez les hôtes SMTP/IMAP vides pour Gmail / Google Workspace. Les valeurs par défaut seront utilisées automatiquement.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Hôte SMTP (optionnel)">
            <Input value={smtpHost} onChange={e => setSmtpHost(e.target.value)} placeholder="smtp.gmail.com" />
          </Field>
          <Field label="Port SMTP (optionnel)">
            <Input value={smtpPort} onChange={e => setSmtpPort(e.target.value)} placeholder="465" />
          </Field>
          <Field label="Hôte IMAP (optionnel)">
            <Input value={imapHost} onChange={e => setImapHost(e.target.value)} placeholder="imap.gmail.com" />
          </Field>
          <Field label="Port IMAP (optionnel)">
            <Input value={imapPort} onChange={e => setImapPort(e.target.value)} placeholder="993" />
          </Field>
        </div>
        <Field label="Signature email (optionnel)" hint="Ajoutée à la fin de chaque message envoyé.">
          <Textarea rows={4} value={signature} onChange={e => setSignature(e.target.value)} placeholder="Cordialement,&#10;Jean Dupont" />
        </Field>
        <div className="flex justify-end">
          <SaveButton loading={mut.isPending} onClick={() => mut.mutate()} />
        </div>
      </Section>
    </div>
  )
}

// ── Main Settings Page ────────────────────────────────────────────────────────

const SETTINGS_NAV = [
  { to: '', end: true, label: 'Campagne', icon: Building2 },
  { to: 'ai', end: false, label: 'IA & Modèle', icon: Bot },
  { to: 'data', end: false, label: 'Sources de données', icon: User },
  { to: 'profile', end: false, label: 'Profil', icon: User },
  { to: 'mailbox', end: false, label: 'Boîte email', icon: Mail },
]

export default function SettingsPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configuration</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Paramétrez chaque aspect de votre prospection IA.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar nav */}
        <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:w-52 shrink-0">
          {SETTINGS_NAV.map(({ to, end, label, icon: Icon }) => (
            <NavLink
              key={label}
              to={`/settings${to ? `/${to}` : ''}`}
              end={end}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium whitespace-nowrap transition-colors',
                  isActive
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white',
                )
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
              <ChevronRight className="h-4 w-4 ml-auto opacity-40" />
            </NavLink>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <Routes>
            <Route index element={<CampaignSettings />} />
            <Route path="ai" element={<AISettings />} />
            <Route path="data" element={<DataSettings />} />
            <Route path="profile" element={<ProfileSettings />} />
            <Route path="mailbox" element={<MailboxSettings />} />
          </Routes>
        </div>
      </div>
    </div>
  )
}

