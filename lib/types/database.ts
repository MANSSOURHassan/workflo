export type ProspectStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'lost'
export type ProspectSource = 'manual' | 'import' | 'api' | 'website' | 'linkedin' | 'referral'
export type CampaignStatus = 'draft' | 'scheduled' | 'active' | 'paused' | 'completed'
export type CampaignType = 'email' | 'sms' | 'linkedin'
export type DealStatus = 'open' | 'won' | 'lost'
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface Profile {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  company_name: string | null
  role: 'admin' | 'manager' | 'commercial'
  avatar_url: string | null
  plan?: 'starter' | 'pro' | 'enterprise'
  battery_level?: number | null
  battery_status?: string | null
  last_battery_update?: string | null
  created_at: string
  updated_at: string
}

export interface Prospect {
  id: string
  user_id: string
  email: string
  first_name: string | null
  last_name: string | null
  company: string | null
  job_title: string | null
  phone: string | null
  linkedin_url: string | null
  website: string | null
  address: string | null
  city: string | null
  country: string | null
  status: ProspectStatus
  source: ProspectSource
  ai_score: number | null
  tags: string[]
  custom_fields: Record<string, unknown>
  notes: string | null
  last_contacted_at: string | null
  assigned_to: string | null
  assigned_to_member?: {
    id: string
    first_name: string | null
    last_name: string | null
  } | null
  ai_reasoning: string | null
  created_at: string
  updated_at: string
}

export interface Activity {
  id: string
  user_id: string
  prospect_id: string | null
  deal_id: string | null
  type: 'email' | 'call' | 'meeting' | 'note' | 'task'
  title: string
  description: string | null
  scheduled_at: string | null
  completed_at: string | null
  created_at: string
}

export interface Campaign {
  id: string
  user_id: string
  name: string
  type: CampaignType
  status: CampaignStatus
  subject: string | null
  content: string | null
  template_id: string | null
  scheduled_at: string | null
  sent_count: number
  open_count: number
  click_count: number
  reply_count: number
  created_at: string
  updated_at: string
}

export interface CampaignRecipient {
  id: string
  campaign_id: string
  prospect_id: string
  status: 'pending' | 'sent' | 'opened' | 'clicked' | 'replied' | 'bounced' | 'unsubscribed'
  sent_at: string | null
  opened_at: string | null
  clicked_at: string | null
  replied_at: string | null
}

export interface EmailTemplate {
  id: string
  user_id: string
  name: string
  subject: string
  content: string
  variables: string[]
  is_public: boolean
  created_at: string
  updated_at: string
}

export interface Pipeline {
  id: string
  user_id: string
  name: string
  is_default: boolean
  created_at: string
}

export interface PipelineStage {
  id: string
  pipeline_id: string
  name: string
  position: number
  color: string
  probability: number
  created_at: string
}

export interface Deal {
  id: string
  user_id: string
  prospect_id: string | null
  pipeline_id: string
  stage_id: string
  name: string
  value: number
  currency: string
  status: DealStatus
  expected_close_date: string | null
  closed_at: string | null
  notes: string | null
  closed_by: string | null
  created_at: string
  updated_at: string
  prospect?: Prospect
  stage?: PipelineStage
}

export interface SupportTicket {
  id: string
  user_id: string
  subject: string
  description: string
  status: TicketStatus
  priority: TicketPriority
  assigned_to: string | null
  resolved_at: string | null
  created_at: string
  updated_at: string
}

export interface AILog {
  id: string
  user_id: string
  action_type: string
  input_data: Record<string, unknown>
  output_data: Record<string, unknown>
  tokens_used: number
  model_used: string
  created_at: string
}

export interface UserSettings {
  id: string
  user_id: string
  email_notifications: boolean
  sms_notifications: boolean
  language: string
  timezone: string
  gdpr_consent: boolean
  gdpr_consent_date: string | null
  data_retention_days: number
  created_at: string
  updated_at: string
}

export interface Import {
  id: string
  user_id: string
  file_name: string
  file_type: string
  total_rows: number
  processed_rows: number
  success_rows: number
  error_rows: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  error_log: Record<string, unknown>[] | null
  created_at: string
  completed_at: string | null
}

// Stats types
export interface DashboardStats {
  totalProspects: number
  newProspectsThisMonth: number
  totalDeals: number
  totalDealsValue: number
  wonDealsValue: number
  conversionRate: number
  activeCampaigns: number
  avgAiScore: number
}

export interface ChartData {
  name: string
  value: number
}

export interface AuditLog {
  id: string
  user_id: string
  team_member_id: string | null
  action_type: string
  entity_type: string
  entity_id: string
  description: string
  metadata: Record<string, unknown>
  created_at: string
  team_member?: {
    first_name: string | null
    last_name: string | null
  }
}

export interface AutomatedSequence {
  id: string
  user_id: string
  name: string
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  steps?: SequenceStep[]
  enrollments_count?: number
}

export interface SequenceStep {
  id: string
  sequence_id: string
  step_order: number
  step_type: 'email' | 'delay' | 'task'
  delay_days: number
  template_id: string | null
  subject: string | null
  content: string | null
  created_at: string
}

export interface SequenceEnrollment {
  id: string
  sequence_id: string
  prospect_id: string
  status: 'active' | 'paused' | 'completed' | 'cancelled'
  current_step_order: number
  last_step_at: string | null
  next_step_at: string | null
  created_at: string
}

export interface Supplier {
  id: string
  user_id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  vat_number: string | null
  category: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Expense {
  id: string
  user_id: string
  supplier_id: string | null
  description: string
  amount: number
  tax_amount: number
  total_amount: number
  currency: string
  category: string | null
  status: 'pending' | 'paid' | 'cancelled'
  issue_date: string
  due_date: string | null
  paid_at: string | null
  payment_method: string | null
  document_url: string | null
  account_code: string | null
  created_at: string
  updated_at: string
  supplier?: Supplier
}

export interface Quote {
  id: string
  user_id: string
  prospect_id: string | null
  quote_number: string
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'pending'
  issue_date: string
  valid_until: string | null
  subtotal: number
  tax_rate: number
  tax_amount: number
  total: number
  currency: string
  notes: string | null
  items: any[]
  created_at: string
  updated_at: string
  prospect?: Prospect
}

export interface Invoice {
  id: string
  user_id: string
  prospect_id: string | null
  invoice_number: string
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled' | 'pending'
  issue_date: string
  due_date: string | null
  subtotal: number
  tax_rate: number
  tax_amount: number
  total: number
  currency: string
  notes: string | null
  items: any[]
  account_code: string | null
  created_at: string
  updated_at: string
  prospect?: Prospect
}

export interface BankAccount {
  id: string
  user_id: string
  name: string
  bank_name: string | null
  iban: string | null
  bic: string | null
  currency: string
  initial_balance: number
  current_balance: number
  account_type: 'checking' | 'savings' | 'credit' | 'payment_processor'
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface BankTransaction {
  id: string
  user_id: string
  bank_account_id: string
  date: string
  description: string
  amount: number
  category: string | null
  external_id: string | null
  status: 'unreconciled' | 'reconciled' | 'ignored'
  linked_entity_type: 'invoice' | 'expense' | 'transfer' | 'other' | null
  linked_entity_id: string | null
  created_at: string
  updated_at: string
  bank_account?: BankAccount
}

export interface Customization {
  id: string
  user_id: string
  theme: 'light' | 'dark' | 'system'
  primary_color: string
  accent_color: string
  logo_url: string | null
  favicon_url: string | null
  company_name: string | null
  sidebar_collapsed: boolean
  dashboard_layout: Record<string, any>
  widget_positions: any[]
  hidden_features: string[]
  custom_css: string | null
  email_signature: string | null
  default_currency: string
  date_format: string
  time_format: string
  created_at: string
  updated_at: string
}

export interface UrssafDeclaration {
  id: string
  user_id: string
  period_start: string
  period_end: string
  sales_revenue: number
  services_revenue: number
  tax_amount: number
  status: 'pending' | 'declared' | 'paid'
  created_at: string
  updated_at: string
}
