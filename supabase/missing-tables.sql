-- =====================================================
-- WORKFLOW CRM - TABLES MANQUANTES
-- =====================================================
-- Ce script contient TOUTES les tables manquantes
-- Exécutez ce script APRÈS complete-schema.sql et all-additional-tables.sql
-- =====================================================

-- Enable UUID extension (au cas où)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLE: CALENDAR_EVENTS (Événements du calendrier)
-- =====================================================
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(300) NOT NULL,
  description TEXT,
  event_type VARCHAR(50) DEFAULT 'meeting' CHECK (event_type IN ('meeting', 'call', 'task', 'reminder', 'deadline', 'other')),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  all_day BOOLEAN DEFAULT FALSE,
  location VARCHAR(500),
  meeting_link TEXT,
  color VARCHAR(20) DEFAULT '#6366f1',
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_rule JSONB,
  reminder_minutes INTEGER DEFAULT 15,
  prospect_id UUID REFERENCES prospects(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
  attendees JSONB DEFAULT '[]',
  status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'tentative', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_time ON calendar_events(start_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_end_time ON calendar_events(end_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_prospect_id ON calendar_events(prospect_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_deal_id ON calendar_events(deal_id);

-- =====================================================
-- TABLE: LEADS (Leads - différent de prospects, plus qualifiés)
-- =====================================================
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prospect_id UUID REFERENCES prospects(id) ON DELETE SET NULL,
  source VARCHAR(100),
  source_details TEXT,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  score INTEGER DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  score_details JSONB DEFAULT '{}',
  status VARCHAR(30) DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'unqualified', 'converted', 'lost')),
  qualified_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,
  converted_deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES team_members(id) ON DELETE SET NULL,
  notes TEXT,
  custom_fields JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_user_id ON leads(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_score ON leads(score DESC);
CREATE INDEX IF NOT EXISTS idx_leads_prospect_id ON leads(prospect_id);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);

-- =====================================================
-- TABLE: ANALYTICS_DATA (Données analytiques)
-- =====================================================
CREATE TABLE IF NOT EXISTS analytics_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  metric_type VARCHAR(100) NOT NULL,
  metric_name VARCHAR(200) NOT NULL,
  metric_value DECIMAL(20, 4) DEFAULT 0,
  metric_unit VARCHAR(50),
  dimensions JSONB DEFAULT '{}',
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  period_type VARCHAR(20) DEFAULT 'daily' CHECK (period_type IN ('hourly', 'daily', 'weekly', 'monthly', 'yearly')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_data_user_id ON analytics_data(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_data_metric_type ON analytics_data(metric_type);
CREATE INDEX IF NOT EXISTS idx_analytics_data_period_start ON analytics_data(period_start);
CREATE INDEX IF NOT EXISTS idx_analytics_data_period_type ON analytics_data(period_type);

-- =====================================================
-- TABLE: REPORTS (Rapports personnalisés)
-- =====================================================
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  report_type VARCHAR(50) DEFAULT 'custom' CHECK (report_type IN ('sales', 'leads', 'campaigns', 'team', 'custom')),
  config JSONB DEFAULT '{}',
  filters JSONB DEFAULT '{}',
  columns JSONB DEFAULT '[]',
  chart_type VARCHAR(30) DEFAULT 'table' CHECK (chart_type IN ('table', 'bar', 'line', 'pie', 'area', 'funnel')),
  is_scheduled BOOLEAN DEFAULT FALSE,
  schedule_config JSONB,
  last_run_at TIMESTAMPTZ,
  is_favorite BOOLEAN DEFAULT FALSE,
  is_shared BOOLEAN DEFAULT FALSE,
  shared_with JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_report_type ON reports(report_type);
CREATE INDEX IF NOT EXISTS idx_reports_is_favorite ON reports(is_favorite);

-- =====================================================
-- TABLE: BILLING_INFO (Informations de facturation)
-- =====================================================
CREATE TABLE IF NOT EXISTS billing_info (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name VARCHAR(200),
  billing_email VARCHAR(254),
  address_line1 VARCHAR(200),
  address_line2 VARCHAR(200),
  city VARCHAR(100),
  state VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100) DEFAULT 'France',
  vat_number VARCHAR(50),
  payment_method VARCHAR(50) DEFAULT 'card',
  stripe_customer_id VARCHAR(100),
  stripe_payment_method_id VARCHAR(100),
  card_last4 VARCHAR(4),
  card_brand VARCHAR(20),
  card_exp_month INTEGER,
  card_exp_year INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_billing_info_user_id ON billing_info(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_info_stripe_customer_id ON billing_info(stripe_customer_id);

-- =====================================================
-- TABLE: SUBSCRIPTIONS (Abonnements)
-- =====================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id VARCHAR(100) NOT NULL,
  plan_name VARCHAR(100) NOT NULL,
  status VARCHAR(30) DEFAULT 'active' CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'unpaid', 'incomplete')),
  billing_cycle VARCHAR(20) DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  price_amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'EUR',
  stripe_subscription_id VARCHAR(100),
  stripe_price_id VARCHAR(100),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMPTZ,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  features JSONB DEFAULT '{}',
  limits JSONB DEFAULT '{"prospects": 1000, "emails": 5000, "team_members": 5}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);

-- =====================================================
-- TABLE: PAYMENT_HISTORY (Historique des paiements)
-- =====================================================
CREATE TABLE IF NOT EXISTS payment_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'EUR',
  status VARCHAR(20) DEFAULT 'succeeded' CHECK (status IN ('succeeded', 'pending', 'failed', 'refunded')),
  payment_method VARCHAR(50),
  stripe_payment_intent_id VARCHAR(100),
  stripe_invoice_id VARCHAR(100),
  description TEXT,
  receipt_url TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_history_user_id ON payment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_status ON payment_history(status);
CREATE INDEX IF NOT EXISTS idx_payment_history_paid_at ON payment_history(paid_at);

-- =====================================================
-- TABLE: INTEGRATIONS (Intégrations tierces)
-- =====================================================
CREATE TABLE IF NOT EXISTS integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider VARCHAR(100) NOT NULL,
  provider_category VARCHAR(50) DEFAULT 'other' CHECK (provider_category IN ('crm', 'email', 'calendar', 'storage', 'communication', 'analytics', 'automation', 'other')),
  name VARCHAR(200),
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  api_key TEXT,
  webhook_url TEXT,
  webhook_secret TEXT,
  settings JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  last_sync_at TIMESTAMPTZ,
  sync_status VARCHAR(20) DEFAULT 'idle' CHECK (sync_status IN ('idle', 'syncing', 'success', 'error')),
  sync_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_integrations_user_id ON integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_integrations_provider ON integrations(provider);
CREATE INDEX IF NOT EXISTS idx_integrations_is_active ON integrations(is_active);

-- =====================================================
-- TABLE: SUPPORT_TICKETS (Tickets de support)
-- =====================================================
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ticket_number VARCHAR(50) NOT NULL UNIQUE,
  subject VARCHAR(300) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) DEFAULT 'general' CHECK (category IN ('general', 'billing', 'technical', 'feature_request', 'bug', 'other')),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status VARCHAR(30) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting_response', 'resolved', 'closed')),
  assigned_agent VARCHAR(200),
  attachments JSONB DEFAULT '[]',
  tags TEXT[] DEFAULT '{}',
  first_response_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
  satisfaction_feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_support_tickets_ticket_number ON support_tickets(ticket_number);

-- =====================================================
-- TABLE: SUPPORT_MESSAGES (Messages de support)
-- =====================================================
CREATE TABLE IF NOT EXISTS support_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('user', 'agent', 'system')),
  sender_name VARCHAR(200),
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  is_internal BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_messages_ticket_id ON support_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_sender_type ON support_messages(sender_type);

-- =====================================================
-- TABLE: CHATBOT_CONVERSATIONS (Conversations chatbot)
-- =====================================================
CREATE TABLE IF NOT EXISTS chatbot_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  visitor_id VARCHAR(100),
  visitor_email VARCHAR(254),
  visitor_name VARCHAR(200),
  source VARCHAR(50) DEFAULT 'website' CHECK (source IN ('website', 'app', 'widget', 'api')),
  status VARCHAR(30) DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'transferred', 'abandoned')),
  assigned_to UUID REFERENCES team_members(id) ON DELETE SET NULL,
  prospect_id UUID REFERENCES prospects(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  last_message_at TIMESTAMPTZ,
  message_count INTEGER DEFAULT 0,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_user_id ON chatbot_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_status ON chatbot_conversations(status);
CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_visitor_email ON chatbot_conversations(visitor_email);
CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_started_at ON chatbot_conversations(started_at);

-- =====================================================
-- TABLE: CHATBOT_MESSAGES (Messages du chatbot)
-- =====================================================
CREATE TABLE IF NOT EXISTS chatbot_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES chatbot_conversations(id) ON DELETE CASCADE,
  sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('visitor', 'bot', 'agent')),
  content TEXT NOT NULL,
  content_type VARCHAR(30) DEFAULT 'text' CHECK (content_type IN ('text', 'image', 'file', 'button', 'quick_reply', 'card')),
  attachments JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chatbot_messages_conversation_id ON chatbot_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_messages_sender_type ON chatbot_messages(sender_type);
CREATE INDEX IF NOT EXISTS idx_chatbot_messages_created_at ON chatbot_messages(created_at);

-- =====================================================
-- TABLE: CHATBOT_FLOWS (Flux de conversation chatbot)
-- =====================================================
CREATE TABLE IF NOT EXISTS chatbot_flows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  trigger_type VARCHAR(50) DEFAULT 'greeting' CHECK (trigger_type IN ('greeting', 'keyword', 'page', 'time', 'exit_intent', 'custom')),
  trigger_config JSONB DEFAULT '{}',
  nodes JSONB DEFAULT '[]',
  edges JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT TRUE,
  is_default BOOLEAN DEFAULT FALSE,
  priority INTEGER DEFAULT 0,
  stats JSONB DEFAULT '{"triggered": 0, "completed": 0, "converted": 0}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chatbot_flows_user_id ON chatbot_flows(user_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_flows_is_active ON chatbot_flows(is_active);
CREATE INDEX IF NOT EXISTS idx_chatbot_flows_trigger_type ON chatbot_flows(trigger_type);

-- =====================================================
-- TABLE: ASSISTANT_CONVERSATIONS (Conversations assistant IA)
-- =====================================================
CREATE TABLE IF NOT EXISTS assistant_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(300),
  model VARCHAR(50) DEFAULT 'gpt-4',
  context_type VARCHAR(50) DEFAULT 'general' CHECK (context_type IN ('general', 'prospect', 'deal', 'campaign', 'email', 'content')),
  context_id UUID,
  message_count INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  last_message_at TIMESTAMPTZ,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assistant_conversations_user_id ON assistant_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_assistant_conversations_context_type ON assistant_conversations(context_type);
CREATE INDEX IF NOT EXISTS idx_assistant_conversations_is_archived ON assistant_conversations(is_archived);

-- =====================================================
-- TABLE: ASSISTANT_MESSAGES (Messages assistant IA)
-- =====================================================
CREATE TABLE IF NOT EXISTS assistant_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES assistant_conversations(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  model VARCHAR(50),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assistant_messages_conversation_id ON assistant_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_assistant_messages_role ON assistant_messages(role);

-- =====================================================
-- TABLE: AUTOPILOT_RULES (Règles d'automatisation)
-- =====================================================
CREATE TABLE IF NOT EXISTS autopilot_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  trigger_type VARCHAR(50) NOT NULL CHECK (trigger_type IN ('event', 'schedule', 'condition', 'webhook')),
  trigger_config JSONB NOT NULL DEFAULT '{}',
  conditions JSONB DEFAULT '[]',
  actions JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN DEFAULT TRUE,
  priority INTEGER DEFAULT 0,
  run_limit INTEGER,
  run_count INTEGER DEFAULT 0,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  stats JSONB DEFAULT '{"triggered": 0, "success": 0, "failed": 0}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_autopilot_rules_user_id ON autopilot_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_autopilot_rules_is_active ON autopilot_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_autopilot_rules_trigger_type ON autopilot_rules(trigger_type);
CREATE INDEX IF NOT EXISTS idx_autopilot_rules_next_run_at ON autopilot_rules(next_run_at);

-- =====================================================
-- TABLE: AUTOPILOT_ACTIONS (Actions exécutées)
-- =====================================================
CREATE TABLE IF NOT EXISTS autopilot_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_id UUID NOT NULL REFERENCES autopilot_rules(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type VARCHAR(100) NOT NULL,
  action_config JSONB DEFAULT '{}',
  target_type VARCHAR(50),
  target_id UUID,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'success', 'failed', 'skipped')),
  result JSONB DEFAULT '{}',
  error TEXT,
  executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_autopilot_actions_rule_id ON autopilot_actions(rule_id);
CREATE INDEX IF NOT EXISTS idx_autopilot_actions_user_id ON autopilot_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_autopilot_actions_status ON autopilot_actions(status);
CREATE INDEX IF NOT EXISTS idx_autopilot_actions_executed_at ON autopilot_actions(executed_at);

-- =====================================================
-- TABLE: COURSES (Cours de l'académie)
-- =====================================================
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(300) NOT NULL,
  slug VARCHAR(300) NOT NULL UNIQUE,
  description TEXT,
  short_description VARCHAR(500),
  thumbnail_url TEXT,
  video_url TEXT,
  category VARCHAR(100) DEFAULT 'general',
  difficulty VARCHAR(20) DEFAULT 'beginner' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  duration_minutes INTEGER DEFAULT 0,
  lesson_count INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT FALSE,
  is_free BOOLEAN DEFAULT FALSE,
  order_index INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_courses_slug ON courses(slug);
CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category);
CREATE INDEX IF NOT EXISTS idx_courses_is_published ON courses(is_published);
CREATE INDEX IF NOT EXISTS idx_courses_order_index ON courses(order_index);

-- =====================================================
-- TABLE: LESSONS (Leçons des cours)
-- =====================================================
CREATE TABLE IF NOT EXISTS lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title VARCHAR(300) NOT NULL,
  slug VARCHAR(300) NOT NULL,
  description TEXT,
  content TEXT,
  content_type VARCHAR(30) DEFAULT 'video' CHECK (content_type IN ('video', 'article', 'quiz', 'exercise')),
  video_url TEXT,
  duration_minutes INTEGER DEFAULT 0,
  order_index INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT FALSE,
  is_free BOOLEAN DEFAULT FALSE,
  resources JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(course_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_lessons_course_id ON lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_lessons_is_published ON lessons(is_published);
CREATE INDEX IF NOT EXISTS idx_lessons_order_index ON lessons(order_index);

-- =====================================================
-- TABLE: USER_COURSE_PROGRESS (Progression des cours)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_course_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  completed_lessons UUID[] DEFAULT '{}',
  current_lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL,
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  time_spent_minutes INTEGER DEFAULT 0,
  quiz_scores JSONB DEFAULT '{}',
  certificate_issued BOOLEAN DEFAULT FALSE,
  certificate_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_user_course_progress_user_id ON user_course_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_course_progress_course_id ON user_course_progress(course_id);
CREATE INDEX IF NOT EXISTS idx_user_course_progress_completed_at ON user_course_progress(completed_at);

-- =====================================================
-- TABLE: CUSTOMIZATIONS (Personnalisations UI)
-- =====================================================
CREATE TABLE IF NOT EXISTS customizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  theme VARCHAR(20) DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  primary_color VARCHAR(20) DEFAULT '#6366f1',
  accent_color VARCHAR(20) DEFAULT '#8b5cf6',
  logo_url TEXT,
  favicon_url TEXT,
  company_name VARCHAR(200),
  sidebar_collapsed BOOLEAN DEFAULT FALSE,
  dashboard_layout JSONB DEFAULT '{}',
  widget_positions JSONB DEFAULT '[]',
  hidden_features TEXT[] DEFAULT '{}',
  custom_css TEXT,
  email_signature TEXT,
  default_currency VARCHAR(3) DEFAULT 'EUR',
  date_format VARCHAR(20) DEFAULT 'DD/MM/YYYY',
  time_format VARCHAR(10) DEFAULT '24h',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customizations_user_id ON customizations(user_id);

-- =====================================================
-- TABLE: NOTIFICATIONS (Notifications)
-- =====================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(300) NOT NULL,
  message TEXT,
  icon VARCHAR(50),
  link TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- =====================================================
-- TABLE: AUDIT_LOGS (Logs d'audit)
-- =====================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY - ENABLE ALL
-- =====================================================
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistant_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistant_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE autopilot_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE autopilot_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_course_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE customizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- DROP ALL EXISTING POLICIES (éviter les erreurs)
-- =====================================================

-- Calendar events
DROP POLICY IF EXISTS "Users can view own calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Users can insert own calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Users can update own calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Users can delete own calendar events" ON calendar_events;

-- Leads
DROP POLICY IF EXISTS "Users can view own leads" ON leads;
DROP POLICY IF EXISTS "Users can insert own leads" ON leads;
DROP POLICY IF EXISTS "Users can update own leads" ON leads;
DROP POLICY IF EXISTS "Users can delete own leads" ON leads;

-- Analytics data
DROP POLICY IF EXISTS "Users can view own analytics data" ON analytics_data;
DROP POLICY IF EXISTS "Users can insert own analytics data" ON analytics_data;

-- Reports
DROP POLICY IF EXISTS "Users can view own reports" ON reports;
DROP POLICY IF EXISTS "Users can insert own reports" ON reports;
DROP POLICY IF EXISTS "Users can update own reports" ON reports;
DROP POLICY IF EXISTS "Users can delete own reports" ON reports;

-- Billing info
DROP POLICY IF EXISTS "Users can view own billing info" ON billing_info;
DROP POLICY IF EXISTS "Users can insert own billing info" ON billing_info;
DROP POLICY IF EXISTS "Users can update own billing info" ON billing_info;

-- Subscriptions
DROP POLICY IF EXISTS "Users can view own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can insert own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can update own subscriptions" ON subscriptions;

-- Payment history
DROP POLICY IF EXISTS "Users can view own payment history" ON payment_history;
DROP POLICY IF EXISTS "Users can insert own payment history" ON payment_history;

-- Integrations
DROP POLICY IF EXISTS "Users can view own integrations" ON integrations;
DROP POLICY IF EXISTS "Users can insert own integrations" ON integrations;
DROP POLICY IF EXISTS "Users can update own integrations" ON integrations;
DROP POLICY IF EXISTS "Users can delete own integrations" ON integrations;

-- Support tickets
DROP POLICY IF EXISTS "Users can view own support tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users can insert own support tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users can update own support tickets" ON support_tickets;

-- Support messages
DROP POLICY IF EXISTS "Users can view own support messages" ON support_messages;
DROP POLICY IF EXISTS "Users can insert own support messages" ON support_messages;

-- Chatbot conversations
DROP POLICY IF EXISTS "Users can view own chatbot conversations" ON chatbot_conversations;
DROP POLICY IF EXISTS "Users can insert own chatbot conversations" ON chatbot_conversations;
DROP POLICY IF EXISTS "Users can update own chatbot conversations" ON chatbot_conversations;
DROP POLICY IF EXISTS "Users can delete own chatbot conversations" ON chatbot_conversations;

-- Chatbot messages
DROP POLICY IF EXISTS "Users can view own chatbot messages" ON chatbot_messages;
DROP POLICY IF EXISTS "Users can insert own chatbot messages" ON chatbot_messages;

-- Chatbot flows
DROP POLICY IF EXISTS "Users can view own chatbot flows" ON chatbot_flows;
DROP POLICY IF EXISTS "Users can insert own chatbot flows" ON chatbot_flows;
DROP POLICY IF EXISTS "Users can update own chatbot flows" ON chatbot_flows;
DROP POLICY IF EXISTS "Users can delete own chatbot flows" ON chatbot_flows;

-- Assistant conversations
DROP POLICY IF EXISTS "Users can view own assistant conversations" ON assistant_conversations;
DROP POLICY IF EXISTS "Users can insert own assistant conversations" ON assistant_conversations;
DROP POLICY IF EXISTS "Users can update own assistant conversations" ON assistant_conversations;
DROP POLICY IF EXISTS "Users can delete own assistant conversations" ON assistant_conversations;

-- Assistant messages
DROP POLICY IF EXISTS "Users can view own assistant messages" ON assistant_messages;
DROP POLICY IF EXISTS "Users can insert own assistant messages" ON assistant_messages;

-- Autopilot rules
DROP POLICY IF EXISTS "Users can view own autopilot rules" ON autopilot_rules;
DROP POLICY IF EXISTS "Users can insert own autopilot rules" ON autopilot_rules;
DROP POLICY IF EXISTS "Users can update own autopilot rules" ON autopilot_rules;
DROP POLICY IF EXISTS "Users can delete own autopilot rules" ON autopilot_rules;

-- Autopilot actions
DROP POLICY IF EXISTS "Users can view own autopilot actions" ON autopilot_actions;
DROP POLICY IF EXISTS "Users can insert own autopilot actions" ON autopilot_actions;

-- Courses (public read)
DROP POLICY IF EXISTS "Anyone can view published courses" ON courses;
DROP POLICY IF EXISTS "Admins can manage courses" ON courses;

-- Lessons (public read)
DROP POLICY IF EXISTS "Anyone can view published lessons" ON lessons;
DROP POLICY IF EXISTS "Admins can manage lessons" ON lessons;

-- User course progress
DROP POLICY IF EXISTS "Users can view own course progress" ON user_course_progress;
DROP POLICY IF EXISTS "Users can insert own course progress" ON user_course_progress;
DROP POLICY IF EXISTS "Users can update own course progress" ON user_course_progress;

-- Customizations
DROP POLICY IF EXISTS "Users can view own customizations" ON customizations;
DROP POLICY IF EXISTS "Users can insert own customizations" ON customizations;
DROP POLICY IF EXISTS "Users can update own customizations" ON customizations;

-- Notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can insert own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;

-- Audit logs
DROP POLICY IF EXISTS "Users can view own audit logs" ON audit_logs;
DROP POLICY IF EXISTS "System can insert audit logs" ON audit_logs;

-- =====================================================
-- CREATE ALL POLICIES
-- =====================================================

-- Calendar events
CREATE POLICY "Users can view own calendar events" ON calendar_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own calendar events" ON calendar_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own calendar events" ON calendar_events FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own calendar events" ON calendar_events FOR DELETE USING (auth.uid() = user_id);

-- Leads
CREATE POLICY "Users can view own leads" ON leads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own leads" ON leads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own leads" ON leads FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own leads" ON leads FOR DELETE USING (auth.uid() = user_id);

-- Analytics data
CREATE POLICY "Users can view own analytics data" ON analytics_data FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own analytics data" ON analytics_data FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Reports
CREATE POLICY "Users can view own reports" ON reports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own reports" ON reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reports" ON reports FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reports" ON reports FOR DELETE USING (auth.uid() = user_id);

-- Billing info
CREATE POLICY "Users can view own billing info" ON billing_info FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own billing info" ON billing_info FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own billing info" ON billing_info FOR UPDATE USING (auth.uid() = user_id);

-- Subscriptions
CREATE POLICY "Users can view own subscriptions" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own subscriptions" ON subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own subscriptions" ON subscriptions FOR UPDATE USING (auth.uid() = user_id);

-- Payment history
CREATE POLICY "Users can view own payment history" ON payment_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own payment history" ON payment_history FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Integrations
CREATE POLICY "Users can view own integrations" ON integrations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own integrations" ON integrations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own integrations" ON integrations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own integrations" ON integrations FOR DELETE USING (auth.uid() = user_id);

-- Support tickets
CREATE POLICY "Users can view own support tickets" ON support_tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own support tickets" ON support_tickets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own support tickets" ON support_tickets FOR UPDATE USING (auth.uid() = user_id);

-- Support messages
CREATE POLICY "Users can view own support messages" ON support_messages FOR SELECT 
  USING (EXISTS (SELECT 1 FROM support_tickets WHERE support_tickets.id = support_messages.ticket_id AND support_tickets.user_id = auth.uid()));
CREATE POLICY "Users can insert own support messages" ON support_messages FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM support_tickets WHERE support_tickets.id = support_messages.ticket_id AND support_tickets.user_id = auth.uid()));

-- Chatbot conversations
CREATE POLICY "Users can view own chatbot conversations" ON chatbot_conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own chatbot conversations" ON chatbot_conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own chatbot conversations" ON chatbot_conversations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own chatbot conversations" ON chatbot_conversations FOR DELETE USING (auth.uid() = user_id);

-- Chatbot messages
CREATE POLICY "Users can view own chatbot messages" ON chatbot_messages FOR SELECT 
  USING (EXISTS (SELECT 1 FROM chatbot_conversations WHERE chatbot_conversations.id = chatbot_messages.conversation_id AND chatbot_conversations.user_id = auth.uid()));
CREATE POLICY "Users can insert own chatbot messages" ON chatbot_messages FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM chatbot_conversations WHERE chatbot_conversations.id = chatbot_messages.conversation_id AND chatbot_conversations.user_id = auth.uid()));

-- Chatbot flows
CREATE POLICY "Users can view own chatbot flows" ON chatbot_flows FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own chatbot flows" ON chatbot_flows FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own chatbot flows" ON chatbot_flows FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own chatbot flows" ON chatbot_flows FOR DELETE USING (auth.uid() = user_id);

-- Assistant conversations
CREATE POLICY "Users can view own assistant conversations" ON assistant_conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own assistant conversations" ON assistant_conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own assistant conversations" ON assistant_conversations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own assistant conversations" ON assistant_conversations FOR DELETE USING (auth.uid() = user_id);

-- Assistant messages
CREATE POLICY "Users can view own assistant messages" ON assistant_messages FOR SELECT 
  USING (EXISTS (SELECT 1 FROM assistant_conversations WHERE assistant_conversations.id = assistant_messages.conversation_id AND assistant_conversations.user_id = auth.uid()));
CREATE POLICY "Users can insert own assistant messages" ON assistant_messages FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM assistant_conversations WHERE assistant_conversations.id = assistant_messages.conversation_id AND assistant_conversations.user_id = auth.uid()));

-- Autopilot rules
CREATE POLICY "Users can view own autopilot rules" ON autopilot_rules FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own autopilot rules" ON autopilot_rules FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own autopilot rules" ON autopilot_rules FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own autopilot rules" ON autopilot_rules FOR DELETE USING (auth.uid() = user_id);

-- Autopilot actions
CREATE POLICY "Users can view own autopilot actions" ON autopilot_actions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own autopilot actions" ON autopilot_actions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Courses (public read for published)
CREATE POLICY "Anyone can view published courses" ON courses FOR SELECT USING (is_published = TRUE);

-- Lessons (public read for published)
CREATE POLICY "Anyone can view published lessons" ON lessons FOR SELECT USING (is_published = TRUE);

-- User course progress
CREATE POLICY "Users can view own course progress" ON user_course_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own course progress" ON user_course_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own course progress" ON user_course_progress FOR UPDATE USING (auth.uid() = user_id);

-- Customizations
CREATE POLICY "Users can view own customizations" ON customizations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own customizations" ON customizations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own customizations" ON customizations FOR UPDATE USING (auth.uid() = user_id);

-- Notifications
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notifications" ON notifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notifications" ON notifications FOR DELETE USING (auth.uid() = user_id);

-- Audit logs
CREATE POLICY "Users can view own audit logs" ON audit_logs FOR SELECT USING (auth.uid() = user_id);

-- =====================================================
-- TRIGGERS FOR updated_at
-- =====================================================

DROP TRIGGER IF EXISTS update_calendar_events_updated_at ON calendar_events;
DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
DROP TRIGGER IF EXISTS update_reports_updated_at ON reports;
DROP TRIGGER IF EXISTS update_billing_info_updated_at ON billing_info;
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
DROP TRIGGER IF EXISTS update_integrations_updated_at ON integrations;
DROP TRIGGER IF EXISTS update_support_tickets_updated_at ON support_tickets;
DROP TRIGGER IF EXISTS update_chatbot_conversations_updated_at ON chatbot_conversations;
DROP TRIGGER IF EXISTS update_chatbot_flows_updated_at ON chatbot_flows;
DROP TRIGGER IF EXISTS update_assistant_conversations_updated_at ON assistant_conversations;
DROP TRIGGER IF EXISTS update_autopilot_rules_updated_at ON autopilot_rules;
DROP TRIGGER IF EXISTS update_courses_updated_at ON courses;
DROP TRIGGER IF EXISTS update_lessons_updated_at ON lessons;
DROP TRIGGER IF EXISTS update_user_course_progress_updated_at ON user_course_progress;
DROP TRIGGER IF EXISTS update_customizations_updated_at ON customizations;

CREATE TRIGGER update_calendar_events_updated_at BEFORE UPDATE ON calendar_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_billing_info_updated_at BEFORE UPDATE ON billing_info FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_integrations_updated_at BEFORE UPDATE ON integrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON support_tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chatbot_conversations_updated_at BEFORE UPDATE ON chatbot_conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chatbot_flows_updated_at BEFORE UPDATE ON chatbot_flows FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assistant_conversations_updated_at BEFORE UPDATE ON assistant_conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_autopilot_rules_updated_at BEFORE UPDATE ON autopilot_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON lessons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_course_progress_updated_at BEFORE UPDATE ON user_course_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customizations_updated_at BEFORE UPDATE ON customizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- HELPER FUNCTION: Generate ticket number
-- =====================================================
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.ticket_number := 'TKT-' || LPAD(EXTRACT(EPOCH FROM NOW())::BIGINT % 1000000::TEXT, 6, '0') || '-' || LPAD(FLOOR(RANDOM() * 1000)::TEXT, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_ticket_number ON support_tickets;
CREATE TRIGGER set_ticket_number BEFORE INSERT ON support_tickets FOR EACH ROW EXECUTE FUNCTION generate_ticket_number();

-- =====================================================
-- REFRESH POSTGREST CACHE
-- =====================================================
NOTIFY pgrst, 'reload schema';

-- =====================================================
-- SUCCESS!
-- =====================================================
-- Toutes les tables manquantes ont été créées!
--
-- TABLES AJOUTÉES:
-- ✅ calendar_events - Événements du calendrier
-- ✅ leads - Leads qualifiés
-- ✅ analytics_data - Données analytiques
-- ✅ reports - Rapports personnalisés
-- ✅ billing_info - Informations de facturation
-- ✅ subscriptions - Abonnements
-- ✅ payment_history - Historique des paiements
-- ✅ integrations - Intégrations tierces
-- ✅ support_tickets - Tickets de support
-- ✅ support_messages - Messages de support
-- ✅ chatbot_conversations - Conversations chatbot
-- ✅ chatbot_messages - Messages du chatbot
-- ✅ chatbot_flows - Flux de conversation
-- ✅ assistant_conversations - Conversations assistant IA
-- ✅ assistant_messages - Messages assistant IA
-- ✅ autopilot_rules - Règles d'automatisation
-- ✅ autopilot_actions - Actions exécutées
-- ✅ courses - Cours de l'académie
-- ✅ lessons - Leçons des cours
-- ✅ user_course_progress - Progression des cours
-- ✅ customizations - Personnalisations UI
-- ✅ notifications - Notifications
-- ✅ audit_logs - Logs d'audit
