-- =====================================================
-- WORKFLOW CRM - REPARATION FINALE DES TABLES
-- =====================================================

-- 1. Création de la table TEAM_MEMBERS (Manquante dans schema.sql)
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(254) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('admin', 'manager', 'member', 'viewer')),
  avatar_url TEXT,
  phone VARCHAR(20),
  department VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Création de la table AUDIT_LOGS (Manquante dans schema.sql)
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type VARCHAR(100) NOT NULL, -- Corrigé de 'action' à 'action_type' pour correspondre au code
  entity_type VARCHAR(100) NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  description TEXT, -- Ajouté pour correspondre à RecentActivity.tsx
  ip_address VARCHAR(45),
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Mise à jour de la table ACTIVITIES (Renommage content -> description)
DO $$ 
BEGIN 
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activities' AND column_name = 'content') THEN
    ALTER TABLE activities RENAME COLUMN content TO description;
  END IF;
END $$;

-- 4. Mise à jour de la table PROSPECTS (Ajout des colonnes manquantes)
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS address VARCHAR(300);
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS country VARCHAR(100);
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES team_members(id);

-- 5. RLS pour Team Members
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own team members" ON team_members;
CREATE POLICY "Users can view own team members" ON team_members FOR SELECT USING (auth.uid() = user_id);

-- 6. RLS pour Audit Logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own audit logs" ON audit_logs;
CREATE POLICY "Users can view own audit logs" ON audit_logs FOR SELECT USING (auth.uid() = user_id);

-- 7. Rafraîchissement du cache
NOTIFY pgrst, 'reload schema';
