-- =====================================================
-- WORKFLOW CRM - SCRIPT SQL COMPLET
-- =====================================================
-- Ce script crée TOUTES les tables nécessaires pour le CRM
-- Exécutez ce script dans Supabase Dashboard > SQL Editor
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLE: PROFILES (Profils utilisateurs)
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(254),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  avatar_url TEXT,
  company VARCHAR(200),
  job_title VARCHAR(100),
  phone VARCHAR(20),
  timezone VARCHAR(50) DEFAULT 'Europe/Paris',
  language VARCHAR(10) DEFAULT 'fr',
  plan VARCHAR(20) DEFAULT 'starter' CHECK (plan IN ('starter', 'pro', 'enterprise')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- =====================================================
-- TABLE: PROSPECTS (Contacts/Leads)
-- =====================================================
CREATE TABLE IF NOT EXISTS prospects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(254) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  company VARCHAR(200),
  job_title VARCHAR(100),
  phone VARCHAR(20),
  website VARCHAR(500),
  linkedin_url VARCHAR(500),
  address VARCHAR(300),
  city VARCHAR(100),
  country VARCHAR(100),
  source VARCHAR(50) DEFAULT 'manual' CHECK (source IN ('manual', 'import', 'website', 'linkedin', 'referral', 'api')),
  status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'lost')),
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  ai_score INTEGER CHECK (ai_score >= 0 AND ai_score <= 100),
  last_contacted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, email)
);

CREATE INDEX IF NOT EXISTS idx_prospects_user_id ON prospects(user_id);
CREATE INDEX IF NOT EXISTS idx_prospects_status ON prospects(status);
CREATE INDEX IF NOT EXISTS idx_prospects_email ON prospects(email);
CREATE INDEX IF NOT EXISTS idx_prospects_ai_score ON prospects(ai_score DESC);

-- =====================================================
-- TABLE: PIPELINES
-- =====================================================
CREATE TABLE IF NOT EXISTS pipelines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pipelines_user_id ON pipelines(user_id);

-- =====================================================
-- TABLE: PIPELINE_STAGES
-- =====================================================
CREATE TABLE IF NOT EXISTS pipeline_stages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pipeline_id UUID NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(20) DEFAULT '#6366f1',
  position INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pipeline_stages_pipeline_id ON pipeline_stages(pipeline_id);

-- =====================================================
-- TABLE: DEALS (Opportunités)
-- =====================================================
CREATE TABLE IF NOT EXISTS deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pipeline_id UUID NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
  stage_id UUID NOT NULL REFERENCES pipeline_stages(id) ON DELETE RESTRICT,
  prospect_id UUID REFERENCES prospects(id) ON DELETE SET NULL,
  name VARCHAR(200) NOT NULL,
  value DECIMAL(15, 2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'EUR',
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'won', 'lost')),
  expected_close_date DATE,
  actual_close_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deals_user_id ON deals(user_id);
CREATE INDEX IF NOT EXISTS idx_deals_pipeline_id ON deals(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_deals_stage_id ON deals(stage_id);
CREATE INDEX IF NOT EXISTS idx_deals_status ON deals(status);

-- =====================================================
-- TABLE: CAMPAIGNS
-- =====================================================
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  type VARCHAR(20) DEFAULT 'email' CHECK (type IN ('email', 'sms', 'linkedin', 'call')),
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'running', 'paused', 'completed', 'cancelled')),
  subject VARCHAR(500),
  content TEXT,
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  stats JSONB DEFAULT '{"sent": 0, "opened": 0, "clicked": 0, "replied": 0, "bounced": 0}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);

-- =====================================================
-- TABLE: CAMPAIGN_RECIPIENTS
-- =====================================================
CREATE TABLE IF NOT EXISTS campaign_recipients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  prospect_id UUID NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'opened', 'clicked', 'replied', 'bounced', 'unsubscribed')),
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(campaign_id, prospect_id)
);

CREATE INDEX IF NOT EXISTS idx_campaign_recipients_campaign_id ON campaign_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_prospect_id ON campaign_recipients(prospect_id);

-- =====================================================
-- TABLE: EMAIL_TEMPLATES
-- =====================================================
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  variables TEXT[] DEFAULT '{}',
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_templates_user_id ON email_templates(user_id);

-- =====================================================
-- TABLE: TASKS
-- =====================================================
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prospect_id UUID REFERENCES prospects(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
  title VARCHAR(300) NOT NULL,
  description TEXT,
  type VARCHAR(50) DEFAULT 'task' CHECK (type IN ('task', 'call', 'email', 'meeting', 'follow_up')),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);

-- =====================================================
-- TABLE: ACTIVITIES (Historique)
-- =====================================================
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prospect_id UUID REFERENCES prospects(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('note', 'email', 'call', 'meeting', 'status_change', 'deal_update')),
  title VARCHAR(300),
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_prospect_id ON activities(prospect_id);
CREATE INDEX IF NOT EXISTS idx_activities_deal_id ON activities(deal_id);

-- =====================================================
-- TABLE: AI_LOGS
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type VARCHAR(50) NOT NULL,
  input_data JSONB,
  output_data JSONB,
  tokens_used INTEGER DEFAULT 0,
  model_used VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_logs_user_id ON ai_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_logs_action_type ON ai_logs(action_type);

-- =====================================================
-- TABLE: WEBHOOKS
-- =====================================================
CREATE TABLE IF NOT EXISTS webhooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  url VARCHAR(500) NOT NULL,
  events TEXT[] NOT NULL,
  secret VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhooks_user_id ON webhooks(user_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_is_active ON webhooks(is_active);

-- =====================================================
-- TABLE: API_KEYS
-- =====================================================
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  key_hash VARCHAR(256) NOT NULL,
  key_prefix VARCHAR(20) NOT NULL,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_prefix ON api_keys(key_prefix);

-- =====================================================
-- TABLE: USER_SETTINGS
-- =====================================================
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email_notifications BOOLEAN DEFAULT TRUE,
  push_notifications BOOLEAN DEFAULT TRUE,
  marketing_emails BOOLEAN DEFAULT FALSE,
  weekly_report BOOLEAN DEFAULT TRUE,
  timezone VARCHAR(50) DEFAULT 'Europe/Paris',
  language VARCHAR(10) DEFAULT 'fr',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE: EMAIL_INTEGRATIONS (Connexions OAuth Gmail/Outlook)
-- =====================================================
CREATE TABLE IF NOT EXISTS email_integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider VARCHAR(20) NOT NULL CHECK (provider IN ('gmail', 'outlook', 'yahoo', 'imap')),
  email VARCHAR(254) NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  last_sync_at TIMESTAMPTZ,
  sync_status VARCHAR(20) DEFAULT 'pending' CHECK (sync_status IN ('pending', 'syncing', 'success', 'error')),
  sync_error TEXT,
  settings JSONB DEFAULT '{"sync_interval": 5, "auto_sync": true, "sync_folders": ["INBOX", "SENT"]}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider, email)
);

CREATE INDEX IF NOT EXISTS idx_email_integrations_user_id ON email_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_email_integrations_provider ON email_integrations(provider);
CREATE INDEX IF NOT EXISTS idx_email_integrations_is_active ON email_integrations(is_active);

-- =====================================================
-- TABLE: SYNCED_EMAILS (Emails synchronisés)
-- =====================================================
CREATE TABLE IF NOT EXISTS synced_emails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  integration_id UUID NOT NULL REFERENCES email_integrations(id) ON DELETE CASCADE,
  external_id VARCHAR(500) NOT NULL,
  thread_id VARCHAR(500),
  from_email VARCHAR(254) NOT NULL,
  from_name VARCHAR(200),
  to_emails TEXT[] DEFAULT '{}',
  cc_emails TEXT[] DEFAULT '{}',
  subject VARCHAR(1000),
  snippet TEXT,
  body_text TEXT,
  body_html TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  is_starred BOOLEAN DEFAULT FALSE,
  is_important BOOLEAN DEFAULT FALSE,
  has_attachments BOOLEAN DEFAULT FALSE,
  attachments JSONB DEFAULT '[]',
  labels TEXT[] DEFAULT '{}',
  folder VARCHAR(50) DEFAULT 'INBOX',
  received_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  prospect_id UUID REFERENCES prospects(id) ON DELETE SET NULL,
  ai_opportunity_score INTEGER CHECK (ai_opportunity_score >= 0 AND ai_opportunity_score <= 100),
  ai_analysis JSONB,
  UNIQUE(integration_id, external_id)
);

CREATE INDEX IF NOT EXISTS idx_synced_emails_user_id ON synced_emails(user_id);
CREATE INDEX IF NOT EXISTS idx_synced_emails_integration_id ON synced_emails(integration_id);
CREATE INDEX IF NOT EXISTS idx_synced_emails_from_email ON synced_emails(from_email);
CREATE INDEX IF NOT EXISTS idx_synced_emails_received_at ON synced_emails(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_synced_emails_is_read ON synced_emails(is_read);
CREATE INDEX IF NOT EXISTS idx_synced_emails_prospect_id ON synced_emails(prospect_id);
CREATE INDEX IF NOT EXISTS idx_synced_emails_folder ON synced_emails(folder);

-- =====================================================
-- TABLE: EMAIL_CONTACTS (Contacts extraits des emails)
-- =====================================================
CREATE TABLE IF NOT EXISTS email_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(254) NOT NULL,
  name VARCHAR(200),
  domain VARCHAR(200),
  email_count INTEGER DEFAULT 1,
  last_email_at TIMESTAMPTZ,
  first_email_at TIMESTAMPTZ,
  prospect_id UUID REFERENCES prospects(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, email)
);

CREATE INDEX IF NOT EXISTS idx_email_contacts_user_id ON email_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_email_contacts_email ON email_contacts(email);
CREATE INDEX IF NOT EXISTS idx_email_contacts_domain ON email_contacts(domain);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) - ENABLE
-- =====================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE synced_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_contacts ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- DROP ALL EXISTING POLICIES (éviter les erreurs de duplication)
-- =====================================================

-- Profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Prospects
DROP POLICY IF EXISTS "Users can view own prospects" ON prospects;
DROP POLICY IF EXISTS "Users can insert own prospects" ON prospects;
DROP POLICY IF EXISTS "Users can update own prospects" ON prospects;
DROP POLICY IF EXISTS "Users can delete own prospects" ON prospects;

-- Pipelines
DROP POLICY IF EXISTS "Users can view own pipelines" ON pipelines;
DROP POLICY IF EXISTS "Users can insert own pipelines" ON pipelines;
DROP POLICY IF EXISTS "Users can update own pipelines" ON pipelines;
DROP POLICY IF EXISTS "Users can delete own pipelines" ON pipelines;

-- Pipeline stages
DROP POLICY IF EXISTS "Users can view own pipeline stages" ON pipeline_stages;
DROP POLICY IF EXISTS "Users can insert own pipeline stages" ON pipeline_stages;
DROP POLICY IF EXISTS "Users can update own pipeline stages" ON pipeline_stages;
DROP POLICY IF EXISTS "Users can delete own pipeline stages" ON pipeline_stages;

-- Deals
DROP POLICY IF EXISTS "Users can view own deals" ON deals;
DROP POLICY IF EXISTS "Users can insert own deals" ON deals;
DROP POLICY IF EXISTS "Users can update own deals" ON deals;
DROP POLICY IF EXISTS "Users can delete own deals" ON deals;

-- Campaigns
DROP POLICY IF EXISTS "Users can view own campaigns" ON campaigns;
DROP POLICY IF EXISTS "Users can insert own campaigns" ON campaigns;
DROP POLICY IF EXISTS "Users can update own campaigns" ON campaigns;
DROP POLICY IF EXISTS "Users can delete own campaigns" ON campaigns;

-- Campaign recipients
DROP POLICY IF EXISTS "Users can view own campaign recipients" ON campaign_recipients;
DROP POLICY IF EXISTS "Users can insert own campaign recipients" ON campaign_recipients;
DROP POLICY IF EXISTS "Users can delete own campaign recipients" ON campaign_recipients;

-- Email templates
DROP POLICY IF EXISTS "Users can view own templates" ON email_templates;
DROP POLICY IF EXISTS "Users can insert own templates" ON email_templates;
DROP POLICY IF EXISTS "Users can update own templates" ON email_templates;
DROP POLICY IF EXISTS "Users can delete own templates" ON email_templates;

-- Tasks
DROP POLICY IF EXISTS "Users can view own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can insert own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete own tasks" ON tasks;

-- Activities
DROP POLICY IF EXISTS "Users can view own activities" ON activities;
DROP POLICY IF EXISTS "Users can insert own activities" ON activities;

-- AI logs
DROP POLICY IF EXISTS "Users can view own ai logs" ON ai_logs;
DROP POLICY IF EXISTS "Users can insert own ai logs" ON ai_logs;

-- Webhooks
DROP POLICY IF EXISTS "Users can view own webhooks" ON webhooks;
DROP POLICY IF EXISTS "Users can insert own webhooks" ON webhooks;
DROP POLICY IF EXISTS "Users can update own webhooks" ON webhooks;
DROP POLICY IF EXISTS "Users can delete own webhooks" ON webhooks;

-- API keys
DROP POLICY IF EXISTS "Users can view own api keys" ON api_keys;
DROP POLICY IF EXISTS "Users can insert own api keys" ON api_keys;
DROP POLICY IF EXISTS "Users can delete own api keys" ON api_keys;

-- User settings
DROP POLICY IF EXISTS "Users can view own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;

-- Email integrations
DROP POLICY IF EXISTS "Users can view own email integrations" ON email_integrations;
DROP POLICY IF EXISTS "Users can insert own email integrations" ON email_integrations;
DROP POLICY IF EXISTS "Users can update own email integrations" ON email_integrations;
DROP POLICY IF EXISTS "Users can delete own email integrations" ON email_integrations;

-- Synced emails
DROP POLICY IF EXISTS "Users can view own synced emails" ON synced_emails;
DROP POLICY IF EXISTS "Users can insert own synced emails" ON synced_emails;
DROP POLICY IF EXISTS "Users can update own synced emails" ON synced_emails;
DROP POLICY IF EXISTS "Users can delete own synced emails" ON synced_emails;

-- Email contacts
DROP POLICY IF EXISTS "Users can view own email contacts" ON email_contacts;
DROP POLICY IF EXISTS "Users can insert own email contacts" ON email_contacts;
DROP POLICY IF EXISTS "Users can update own email contacts" ON email_contacts;
DROP POLICY IF EXISTS "Users can delete own email contacts" ON email_contacts;

-- =====================================================
-- CREATE ALL POLICIES
-- =====================================================

-- Profiles
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Prospects
CREATE POLICY "Users can view own prospects" ON prospects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own prospects" ON prospects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own prospects" ON prospects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own prospects" ON prospects FOR DELETE USING (auth.uid() = user_id);

-- Pipelines
CREATE POLICY "Users can view own pipelines" ON pipelines FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own pipelines" ON pipelines FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own pipelines" ON pipelines FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own pipelines" ON pipelines FOR DELETE USING (auth.uid() = user_id);

-- Pipeline stages
CREATE POLICY "Users can view own pipeline stages" ON pipeline_stages FOR SELECT 
  USING (EXISTS (SELECT 1 FROM pipelines WHERE pipelines.id = pipeline_stages.pipeline_id AND pipelines.user_id = auth.uid()));
CREATE POLICY "Users can insert own pipeline stages" ON pipeline_stages FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM pipelines WHERE pipelines.id = pipeline_stages.pipeline_id AND pipelines.user_id = auth.uid()));
CREATE POLICY "Users can update own pipeline stages" ON pipeline_stages FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM pipelines WHERE pipelines.id = pipeline_stages.pipeline_id AND pipelines.user_id = auth.uid()));
CREATE POLICY "Users can delete own pipeline stages" ON pipeline_stages FOR DELETE 
  USING (EXISTS (SELECT 1 FROM pipelines WHERE pipelines.id = pipeline_stages.pipeline_id AND pipelines.user_id = auth.uid()));

-- Deals
CREATE POLICY "Users can view own deals" ON deals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own deals" ON deals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own deals" ON deals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own deals" ON deals FOR DELETE USING (auth.uid() = user_id);

-- Campaigns
CREATE POLICY "Users can view own campaigns" ON campaigns FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own campaigns" ON campaigns FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own campaigns" ON campaigns FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own campaigns" ON campaigns FOR DELETE USING (auth.uid() = user_id);

-- Campaign recipients
CREATE POLICY "Users can view own campaign recipients" ON campaign_recipients FOR SELECT 
  USING (EXISTS (SELECT 1 FROM campaigns WHERE campaigns.id = campaign_recipients.campaign_id AND campaigns.user_id = auth.uid()));
CREATE POLICY "Users can insert own campaign recipients" ON campaign_recipients FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM campaigns WHERE campaigns.id = campaign_recipients.campaign_id AND campaigns.user_id = auth.uid()));
CREATE POLICY "Users can delete own campaign recipients" ON campaign_recipients FOR DELETE 
  USING (EXISTS (SELECT 1 FROM campaigns WHERE campaigns.id = campaign_recipients.campaign_id AND campaigns.user_id = auth.uid()));

-- Email templates
CREATE POLICY "Users can view own templates" ON email_templates FOR SELECT USING (auth.uid() = user_id OR is_public = TRUE);
CREATE POLICY "Users can insert own templates" ON email_templates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own templates" ON email_templates FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own templates" ON email_templates FOR DELETE USING (auth.uid() = user_id);

-- Tasks
CREATE POLICY "Users can view own tasks" ON tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tasks" ON tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tasks" ON tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tasks" ON tasks FOR DELETE USING (auth.uid() = user_id);

-- Activities
CREATE POLICY "Users can view own activities" ON activities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own activities" ON activities FOR INSERT WITH CHECK (auth.uid() = user_id);

-- AI logs
CREATE POLICY "Users can view own ai logs" ON ai_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own ai logs" ON ai_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Webhooks
CREATE POLICY "Users can view own webhooks" ON webhooks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own webhooks" ON webhooks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own webhooks" ON webhooks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own webhooks" ON webhooks FOR DELETE USING (auth.uid() = user_id);

-- API keys
CREATE POLICY "Users can view own api keys" ON api_keys FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own api keys" ON api_keys FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own api keys" ON api_keys FOR DELETE USING (auth.uid() = user_id);

-- User settings
CREATE POLICY "Users can view own settings" ON user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON user_settings FOR UPDATE USING (auth.uid() = user_id);

-- Email integrations
CREATE POLICY "Users can view own email integrations" ON email_integrations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own email integrations" ON email_integrations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own email integrations" ON email_integrations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own email integrations" ON email_integrations FOR DELETE USING (auth.uid() = user_id);

-- Synced emails
CREATE POLICY "Users can view own synced emails" ON synced_emails FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own synced emails" ON synced_emails FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own synced emails" ON synced_emails FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own synced emails" ON synced_emails FOR DELETE USING (auth.uid() = user_id);

-- Email contacts
CREATE POLICY "Users can view own email contacts" ON email_contacts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own email contacts" ON email_contacts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own email contacts" ON email_contacts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own email contacts" ON email_contacts FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into profiles
  INSERT INTO public.profiles (id, email, first_name, last_name, company, plan)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'company_name', ''),
    'starter'
  );

  -- Insert default user settings
  INSERT INTO public.user_settings (user_id, email_notifications, push_notifications, marketing_emails, weekly_report, timezone, language)
  VALUES (
    NEW.id,
    TRUE,
    TRUE,
    FALSE,
    TRUE,
    'Europe/Paris',
    'fr'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing triggers to avoid errors
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_prospects_updated_at ON prospects;
DROP TRIGGER IF EXISTS update_pipelines_updated_at ON pipelines;
DROP TRIGGER IF EXISTS update_deals_updated_at ON deals;
DROP TRIGGER IF EXISTS update_campaigns_updated_at ON campaigns;
DROP TRIGGER IF EXISTS update_email_templates_updated_at ON email_templates;
DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
DROP TRIGGER IF EXISTS update_webhooks_updated_at ON webhooks;
DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
DROP TRIGGER IF EXISTS update_email_integrations_updated_at ON email_integrations;
DROP TRIGGER IF EXISTS update_email_contacts_updated_at ON email_contacts;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_prospects_updated_at BEFORE UPDATE ON prospects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pipelines_updated_at BEFORE UPDATE ON pipelines FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON deals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON email_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_webhooks_updated_at BEFORE UPDATE ON webhooks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_email_integrations_updated_at BEFORE UPDATE ON email_integrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_email_contacts_updated_at BEFORE UPDATE ON email_contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to create profile on auth signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- FORCER LE RAFRAÎCHISSEMENT DU CACHE POSTGREST
-- =====================================================
NOTIFY pgrst, 'reload schema';

-- =====================================================
-- SUCCESS!
-- =====================================================
-- Toutes les tables ont été créées avec succès!
-- Le schéma a été rechargé.
