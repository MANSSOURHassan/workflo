-- =====================================================
-- WORKFLOW CRM - Tables pour l'intégration Email
-- =====================================================
-- Exécutez ce script dans Supabase Dashboard > SQL Editor
-- =====================================================

-- =====================================================
-- TABLE: EMAIL_INTEGRATIONS (Connexions OAuth)
-- Stocke les tokens d'accès Gmail/Outlook
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
-- Stocke les emails téléchargés depuis Gmail/Outlook
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
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE email_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE synced_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_contacts ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- SUPPRIMER LES POLICIES EXISTANTES (pour éviter les erreurs)
-- =====================================================
DROP POLICY IF EXISTS "Users can view own email integrations" ON email_integrations;
DROP POLICY IF EXISTS "Users can insert own email integrations" ON email_integrations;
DROP POLICY IF EXISTS "Users can update own email integrations" ON email_integrations;
DROP POLICY IF EXISTS "Users can delete own email integrations" ON email_integrations;

DROP POLICY IF EXISTS "Users can view own synced emails" ON synced_emails;
DROP POLICY IF EXISTS "Users can insert own synced emails" ON synced_emails;
DROP POLICY IF EXISTS "Users can update own synced emails" ON synced_emails;
DROP POLICY IF EXISTS "Users can delete own synced emails" ON synced_emails;

DROP POLICY IF EXISTS "Users can view own email contacts" ON email_contacts;
DROP POLICY IF EXISTS "Users can insert own email contacts" ON email_contacts;
DROP POLICY IF EXISTS "Users can update own email contacts" ON email_contacts;
DROP POLICY IF EXISTS "Users can delete own email contacts" ON email_contacts;

-- =====================================================
-- CRÉER LES POLICIES
-- =====================================================

-- Policies for email_integrations
CREATE POLICY "Users can view own email integrations" ON email_integrations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own email integrations" ON email_integrations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own email integrations" ON email_integrations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own email integrations" ON email_integrations FOR DELETE USING (auth.uid() = user_id);

-- Policies for synced_emails
CREATE POLICY "Users can view own synced emails" ON synced_emails FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own synced emails" ON synced_emails FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own synced emails" ON synced_emails FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own synced emails" ON synced_emails FOR DELETE USING (auth.uid() = user_id);

-- Policies for email_contacts
CREATE POLICY "Users can view own email contacts" ON email_contacts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own email contacts" ON email_contacts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own email contacts" ON email_contacts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own email contacts" ON email_contacts FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Supprimer les triggers existants pour éviter les erreurs
DROP TRIGGER IF EXISTS update_email_integrations_updated_at ON email_integrations;
DROP TRIGGER IF EXISTS update_email_contacts_updated_at ON email_contacts;

-- Créer les triggers
CREATE TRIGGER update_email_integrations_updated_at BEFORE UPDATE ON email_integrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_email_contacts_updated_at BEFORE UPDATE ON email_contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
-- Tables email créées avec succès !
