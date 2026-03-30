-- =====================================================
-- TABLE: AUDIT_LOGS
-- =====================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies for audit_logs
-- Pour l'instant, les utilisateurs ne peuvent voir que leurs propres logs.
-- Dans une version multi-utilisateur/entreprise, on pourrait avoir des rôles admin.
DROP POLICY IF EXISTS "Users can view own audit logs" ON audit_logs;
CREATE POLICY "Users can view own audit logs" ON audit_logs 
  FOR SELECT USING (auth.uid() = user_id);

-- Seul le système peut insérer des logs (via service_role ou fonctions définies)
-- Mais pour simplifier avec les Server Actions, on autorise l'insertion par l'utilisateur authentifié
DROP POLICY IF EXISTS "Users can insert own audit logs" ON audit_logs;
CREATE POLICY "Users can insert own audit logs" ON audit_logs 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Index pour la performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id ON audit_logs(entity_id);
