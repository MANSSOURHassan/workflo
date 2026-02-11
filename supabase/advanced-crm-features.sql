-- =====================================================
-- ADVANCED FEATURES FOR WORKFLOW CRM
-- =====================================================

-- 1. Prospect Assignment & AI Reasoning
ALTER TABLE prospects 
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES team_members(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS ai_reasoning TEXT;

-- 2. Audit Logs (Global Activity Feed)
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_member_id UUID REFERENCES team_members(id) ON DELETE SET NULL,
  action_type VARCHAR(50) NOT NULL, -- 'prospect_created', 'deal_closed', 'email_sent', etc.
  entity_type VARCHAR(50) NOT NULL, -- 'prospect', 'deal', 'campaign', etc.
  entity_id UUID NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own audit logs" ON audit_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own audit logs" ON audit_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. Automated Sequences
CREATE TABLE IF NOT EXISTS automated_sequences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sequence_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sequence_id UUID NOT NULL REFERENCES automated_sequences(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  wait_days INTEGER DEFAULT 0,
  action_type VARCHAR(50) NOT NULL, -- 'email', 'task', 'wait'
  template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
  task_title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sequence_enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sequence_id UUID NOT NULL REFERENCES automated_sequences(id) ON DELETE CASCADE,
  prospect_id UUID NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
  current_step INTEGER DEFAULT 1,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
  last_step_at TIMESTAMPTZ,
  next_step_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sequence_id, prospect_id)
);

ALTER TABLE automated_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE sequence_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE sequence_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can perform all actions on sequences" ON automated_sequences USING (auth.uid() = user_id);
CREATE POLICY "Users can perform all actions on steps" ON sequence_steps USING (EXISTS (SELECT 1 FROM automated_sequences WHERE id = sequence_id AND user_id = auth.uid()));
CREATE POLICY "Users can perform all actions on enrollments" ON sequence_enrollments USING (auth.uid() = user_id);

-- 4. Linking Documents to Entities
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS prospect_id UUID REFERENCES prospects(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS deal_id UUID REFERENCES deals(id) ON DELETE CASCADE;

-- 5. Deal Attribution
ALTER TABLE deals 
ADD COLUMN IF NOT EXISTS closed_by UUID REFERENCES team_members(id) ON DELETE SET NULL;

-- 6. Trigger for Audit Logs on Prospect Update
CREATE OR REPLACE FUNCTION log_prospect_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO audit_logs (user_id, action_type, entity_type, entity_id, description)
    VALUES (NEW.user_id, 'prospect_created', 'prospect', NEW.id, 'Nouveau prospect: ' || COALESCE(NEW.first_name, '') || ' ' || COALESCE(NEW.last_name, ''));
  ELSIF (TG_OP = 'UPDATE') THEN
    IF (OLD.status <> NEW.status) THEN
      INSERT INTO audit_logs (user_id, action_type, entity_type, entity_id, description)
      VALUES (NEW.user_id, 'status_changed', 'prospect', NEW.id, 'Status changé de ' || OLD.status || ' à ' || NEW.status);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_log_prospect_activity ON prospects;
CREATE TRIGGER tr_log_prospect_activity
AFTER INSERT OR UPDATE ON prospects
FOR EACH ROW EXECUTE FUNCTION log_prospect_activity();

-- Refresh PostgREST
NOTIFY pgrst, 'reload schema';
