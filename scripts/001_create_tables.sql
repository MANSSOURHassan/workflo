-- =============================================
-- CRM SaaS IA - Complete Database Schema
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. PROFILES TABLE (User Management)
-- =============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  company_name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_delete_own" ON public.profiles FOR DELETE USING (auth.uid() = id);

-- =============================================
-- 2. PROSPECTS TABLE (CRM Core)
-- =============================================
CREATE TABLE IF NOT EXISTS public.prospects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic Info
  company_name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  website TEXT,
  
  -- Address
  address TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'France',
  
  -- Classification
  sector TEXT,
  company_size TEXT CHECK (company_size IN ('1-10', '11-50', '51-200', '201-500', '500+')),
  source TEXT CHECK (source IN ('manual', 'import', 'linkedin', 'website', 'referral', 'ai_generated')),
  
  -- Status & Pipeline
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost')),
  pipeline_stage TEXT DEFAULT 'lead',
  
  -- AI Scoring
  ai_score INTEGER DEFAULT 0 CHECK (ai_score >= 0 AND ai_score <= 100),
  ai_score_details JSONB DEFAULT '{}',
  
  -- Financial
  estimated_value DECIMAL(15, 2) DEFAULT 0,
  currency TEXT DEFAULT 'EUR',
  
  -- Notes & Tags
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  custom_fields JSONB DEFAULT '{}',
  
  -- RGPD
  consent_given BOOLEAN DEFAULT FALSE,
  consent_date TIMESTAMP WITH TIME ZONE,
  data_source TEXT,
  
  -- Timestamps
  last_contact_date TIMESTAMP WITH TIME ZONE,
  next_follow_up TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_prospects_user_id ON public.prospects(user_id);
CREATE INDEX idx_prospects_status ON public.prospects(status);
CREATE INDEX idx_prospects_ai_score ON public.prospects(ai_score DESC);
CREATE INDEX idx_prospects_company_name ON public.prospects(company_name);

ALTER TABLE public.prospects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prospects_select_own" ON public.prospects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "prospects_insert_own" ON public.prospects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "prospects_update_own" ON public.prospects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "prospects_delete_own" ON public.prospects FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- 3. ACTIVITIES TABLE (Interaction History)
-- =============================================
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prospect_id UUID NOT NULL REFERENCES public.prospects(id) ON DELETE CASCADE,
  
  type TEXT NOT NULL CHECK (type IN ('call', 'email', 'meeting', 'note', 'task', 'linkedin', 'other')),
  title TEXT NOT NULL,
  description TEXT,
  
  -- Scheduling
  scheduled_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  is_completed BOOLEAN DEFAULT FALSE,
  
  -- Email specific
  email_subject TEXT,
  email_body TEXT,
  email_opened BOOLEAN DEFAULT FALSE,
  email_clicked BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_activities_prospect_id ON public.activities(prospect_id);
CREATE INDEX idx_activities_user_id ON public.activities(user_id);
CREATE INDEX idx_activities_scheduled_at ON public.activities(scheduled_at);

ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activities_select_own" ON public.activities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "activities_insert_own" ON public.activities FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "activities_update_own" ON public.activities FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "activities_delete_own" ON public.activities FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- 4. CAMPAIGNS TABLE (Email & Automation)
-- =============================================
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'email' CHECK (type IN ('email', 'sms', 'linkedin', 'multi_channel')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'paused', 'completed')),
  
  -- Email Content
  subject TEXT,
  content TEXT,
  template_id UUID,
  
  -- Targeting
  target_segments JSONB DEFAULT '[]',
  target_count INTEGER DEFAULT 0,
  
  -- Scheduling
  scheduled_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Stats
  sent_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  replied_count INTEGER DEFAULT 0,
  bounced_count INTEGER DEFAULT 0,
  
  -- AI Features
  ai_optimized BOOLEAN DEFAULT FALSE,
  ai_suggestions JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_campaigns_user_id ON public.campaigns(user_id);
CREATE INDEX idx_campaigns_status ON public.campaigns(status);

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "campaigns_select_own" ON public.campaigns FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "campaigns_insert_own" ON public.campaigns FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "campaigns_update_own" ON public.campaigns FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "campaigns_delete_own" ON public.campaigns FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- 5. CAMPAIGN_RECIPIENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.campaign_recipients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  prospect_id UUID NOT NULL REFERENCES public.prospects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'opened', 'clicked', 'replied', 'bounced', 'unsubscribed')),
  
  sent_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  replied_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_campaign_recipients_campaign_id ON public.campaign_recipients(campaign_id);
CREATE INDEX idx_campaign_recipients_prospect_id ON public.campaign_recipients(prospect_id);

ALTER TABLE public.campaign_recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "campaign_recipients_select_own" ON public.campaign_recipients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "campaign_recipients_insert_own" ON public.campaign_recipients FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "campaign_recipients_update_own" ON public.campaign_recipients FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "campaign_recipients_delete_own" ON public.campaign_recipients FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- 6. EMAIL_TEMPLATES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  
  -- Variables placeholders
  variables TEXT[] DEFAULT '{}',
  
  -- AI Generated
  is_ai_generated BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "email_templates_select_own" ON public.email_templates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "email_templates_insert_own" ON public.email_templates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "email_templates_update_own" ON public.email_templates FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "email_templates_delete_own" ON public.email_templates FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- 7. PIPELINES TABLE (Sales Pipeline)
-- =============================================
CREATE TABLE IF NOT EXISTS public.pipelines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.pipelines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pipelines_select_own" ON public.pipelines FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "pipelines_insert_own" ON public.pipelines FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "pipelines_update_own" ON public.pipelines FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "pipelines_delete_own" ON public.pipelines FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- 8. PIPELINE_STAGES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.pipeline_stages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pipeline_id UUID NOT NULL REFERENCES public.pipelines(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  position INTEGER NOT NULL,
  probability INTEGER DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.pipeline_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pipeline_stages_select_own" ON public.pipeline_stages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "pipeline_stages_insert_own" ON public.pipeline_stages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "pipeline_stages_update_own" ON public.pipeline_stages FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "pipeline_stages_delete_own" ON public.pipeline_stages FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- 9. DEALS TABLE (Opportunities)
-- =============================================
CREATE TABLE IF NOT EXISTS public.deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prospect_id UUID REFERENCES public.prospects(id) ON DELETE SET NULL,
  pipeline_id UUID REFERENCES public.pipelines(id) ON DELETE SET NULL,
  stage_id UUID REFERENCES public.pipeline_stages(id) ON DELETE SET NULL,
  
  name TEXT NOT NULL,
  value DECIMAL(15, 2) DEFAULT 0,
  currency TEXT DEFAULT 'EUR',
  probability INTEGER DEFAULT 0,
  
  expected_close_date DATE,
  actual_close_date DATE,
  
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'won', 'lost')),
  lost_reason TEXT,
  
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_deals_user_id ON public.deals(user_id);
CREATE INDEX idx_deals_stage_id ON public.deals(stage_id);
CREATE INDEX idx_deals_status ON public.deals(status);

ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deals_select_own" ON public.deals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "deals_insert_own" ON public.deals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "deals_update_own" ON public.deals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "deals_delete_own" ON public.deals FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- 10. SUPPORT_TICKETS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT DEFAULT 'general' CHECK (category IN ('general', 'bug', 'feature', 'billing', 'other')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "support_tickets_select_own" ON public.support_tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "support_tickets_insert_own" ON public.support_tickets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "support_tickets_update_own" ON public.support_tickets FOR UPDATE USING (auth.uid() = user_id);

-- =============================================
-- 11. AI_LOGS TABLE (Track AI Usage)
-- =============================================
CREATE TABLE IF NOT EXISTS public.ai_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  action_type TEXT NOT NULL,
  input_data JSONB,
  output_data JSONB,
  tokens_used INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.ai_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_logs_select_own" ON public.ai_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ai_logs_insert_own" ON public.ai_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================
-- 12. USER_SETTINGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Notifications
  email_notifications BOOLEAN DEFAULT TRUE,
  push_notifications BOOLEAN DEFAULT TRUE,
  
  -- Display
  language TEXT DEFAULT 'fr',
  timezone TEXT DEFAULT 'Europe/Paris',
  date_format TEXT DEFAULT 'DD/MM/YYYY',
  
  -- RGPD
  data_retention_days INTEGER DEFAULT 365,
  auto_delete_old_data BOOLEAN DEFAULT FALSE,
  
  -- API
  api_key TEXT,
  webhook_url TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_settings_select_own" ON public.user_settings FOR SELECT USING (auth.uid() = id);
CREATE POLICY "user_settings_insert_own" ON public.user_settings FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "user_settings_update_own" ON public.user_settings FOR UPDATE USING (auth.uid() = id);

-- =============================================
-- 13. IMPORTS TABLE (Track Data Imports)
-- =============================================
CREATE TABLE IF NOT EXISTS public.imports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  file_name TEXT NOT NULL,
  file_type TEXT CHECK (file_type IN ('csv', 'xlsx', 'json')),
  total_rows INTEGER DEFAULT 0,
  imported_rows INTEGER DEFAULT 0,
  failed_rows INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_log JSONB DEFAULT '[]',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "imports_select_own" ON public.imports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "imports_insert_own" ON public.imports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "imports_update_own" ON public.imports FOR UPDATE USING (auth.uid() = user_id);

-- =============================================
-- TRIGGER: Auto-create profile on signup
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', NULL),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', NULL)
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- Create default settings
  INSERT INTO public.user_settings (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  
  -- Create default pipeline
  INSERT INTO public.pipelines (id, user_id, name, is_default)
  VALUES (uuid_generate_v4(), NEW.id, 'Pipeline Principal', TRUE);
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- TRIGGER: Create default pipeline stages
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_pipeline()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_default = TRUE THEN
    INSERT INTO public.pipeline_stages (pipeline_id, user_id, name, color, position, probability)
    VALUES
      (NEW.id, NEW.user_id, 'Lead', '#94a3b8', 1, 10),
      (NEW.id, NEW.user_id, 'Contact', '#60a5fa', 2, 20),
      (NEW.id, NEW.user_id, 'Qualification', '#fbbf24', 3, 40),
      (NEW.id, NEW.user_id, 'Proposition', '#a78bfa', 4, 60),
      (NEW.id, NEW.user_id, 'Negociation', '#f97316', 5, 80),
      (NEW.id, NEW.user_id, 'Gagne', '#22c55e', 6, 100);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_pipeline_created ON public.pipelines;

CREATE TRIGGER on_pipeline_created
  AFTER INSERT ON public.pipelines
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_pipeline();

-- =============================================
-- TRIGGER: Update timestamps
-- =============================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_prospects_updated_at BEFORE UPDATE ON public.prospects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON public.activities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON public.campaigns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON public.email_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_pipelines_updated_at BEFORE UPDATE ON public.pipelines FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON public.deals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON public.user_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
