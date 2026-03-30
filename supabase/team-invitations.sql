-- =====================================================
-- TABLE: TEAM_INVITATIONS (Invitations email équipe)
-- =====================================================
-- Exécutez ce script dans Supabase Dashboard > SQL Editor

-- Ajouter colonne member_user_id à team_members si elle n'existe pas
ALTER TABLE team_members 
ADD COLUMN IF NOT EXISTS member_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'pending', 'inactive'));

-- Mettre à jour owner_id = user_id pour les membres existants (rétrocompatibilité)
UPDATE team_members SET owner_id = user_id WHERE owner_id IS NULL;

-- Table des invitations en attente
CREATE TABLE IF NOT EXISTS team_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(254) NOT NULL,
  role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('admin', 'manager', 'member', 'viewer')),
  token UUID NOT NULL DEFAULT uuid_generate_v4(),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'cancelled', 'expired')),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(owner_id, email, status)
);

CREATE INDEX IF NOT EXISTS idx_team_invitations_owner_id ON team_invitations(owner_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_token ON team_invitations(token);
CREATE INDEX IF NOT EXISTS idx_team_invitations_email ON team_invitations(email);
CREATE INDEX IF NOT EXISTS idx_team_invitations_status ON team_invitations(status);

-- RLS
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can view own invitations" ON team_invitations;
DROP POLICY IF EXISTS "Owners can insert own invitations" ON team_invitations;
DROP POLICY IF EXISTS "Owners can update own invitations" ON team_invitations;
DROP POLICY IF EXISTS "Owners can delete own invitations" ON team_invitations;
-- Allow anyone with valid token to read (for accept flow - public)
DROP POLICY IF EXISTS "Anyone can read invitation by token" ON team_invitations;

CREATE POLICY "Owners can view own invitations" ON team_invitations 
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Owners can insert own invitations" ON team_invitations 
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update own invitations" ON team_invitations 
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete own invitations" ON team_invitations 
  FOR DELETE USING (auth.uid() = owner_id);

-- Trigger updated_at
DROP TRIGGER IF EXISTS update_team_invitations_updated_at ON team_invitations;
CREATE TRIGGER update_team_invitations_updated_at 
  BEFORE UPDATE ON team_invitations 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Refresh PostgREST cache
NOTIFY pgrst, 'reload schema';
