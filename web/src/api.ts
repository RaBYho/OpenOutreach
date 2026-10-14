import axios from 'axios'

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

export interface Provider {
  id: string
  name: string
  description: string
  logo: string
  requires_key: boolean
  requires_base: boolean
  default_base: string
  models: { id: string; name: string }[]
  prefix: string
}

export interface Config {
  is_configured: boolean
  product_docs: string
  campaign_target: string
  booking_link: string
  ai_model: string
  llm_api_base: string
  has_llm_api_key: boolean
  bettercontact_api_key: string
  apollo_api_key: string
  email_finder: string
  operator_name: string
  operator_email: string
  operator_country_code: string
  newsletter: boolean
  mailbox_address: string
  smtp_host: string
  smtp_port: string
  imap_host: string
  imap_port: string
  signature: string
  has_mailbox_password: boolean
  has_bettercontact_api_key: boolean
}

export interface Status {
  leads_found: number
  leads_with_email: number
  emails_sent: number
  emails_opened: number
  is_configured: boolean
  finder_ready: boolean
  sender_ready: boolean
  finder_issues: string[]
  sender_issues: string[]
}

export interface Lead {
  id: number
  first_name: string
  last_name: string
  company: string
  title: string
  email: string
  linkedin_url: string
  website: string
  reason: string
  qualified_at: string | null
}

export interface LeadsPage {
  total: number
  page: number
  per_page: number
  items: Lead[]
  error?: string
}

export const getProviders = () => api.get<Provider[]>('/providers').then(r => r.data)
export const getConfig = () => api.get<Config>('/config').then(r => r.data)
export const updateConfig = (data: Partial<Config> & { llm_api_key?: string; mailbox_password?: string }) =>
  api.patch<Config>('/config', data).then(r => r.data)
export const testLLM = (data: { ai_model: string; llm_api_key?: string; llm_api_base?: string }) =>
  api.post<{ success: boolean; error?: string }>('/config/test-llm', data).then(r => r.data)
export const getStatus = () => api.get<Status>('/status').then(r => r.data)
export const getLeads = (page = 1, perPage = 50, withEmail?: boolean) => {
  const params: Record<string, string | number | boolean> = { page, per_page: perPage }
  if (withEmail !== undefined) params.with_email = withEmail
  return api.get<LeadsPage>('/leads', { params }).then(r => r.data)
}
export const campaignFind = (goal: number, withEmails: boolean) =>
  api.post<{ detail: string }>('/campaign/find', null, { params: { goal, with_emails: withEmails } }).then(r => r.data)
export const campaignSend = (goal?: number) =>
  api.post<{ detail: string }>('/campaign/send', null, { params: goal ? { goal } : {} }).then(r => r.data)
export const campaignRun = (goal: number) =>
  api.post<{ detail: string }>('/campaign/run', { goal }).then(r => r.data)

export default api

