-- ============================================================
-- FONCTIONS RPC POUR LES INVITATIONS D'ÉQUIPE
-- Exécuter dans Supabase Dashboard → SQL Editor
-- Ces fonctions contournent RLS sans avoir besoin du service role key
-- ============================================================

-- 1. Politiques RLS de base pour team_invitations
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "owners_select_invitations" ON team_invitations;
DROP POLICY IF EXISTS "owners_insert_invitations" ON team_invitations;
DROP POLICY IF EXISTS "owners_update_invitations" ON team_invitations;
DROP POLICY IF EXISTS "owners_delete_invitations" ON team_invitations;
DROP POLICY IF EXISTS "Owners can view their invitations" ON team_invitations;
DROP POLICY IF EXISTS "Owners can create invitations" ON team_invitations;
DROP POLICY IF EXISTS "Owners can update invitations" ON team_invitations;

-- Recréer les 4 politiques complètes
CREATE POLICY "owners_select_invitations" ON team_invitations
    FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "owners_insert_invitations" ON team_invitations
    FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "owners_update_invitations" ON team_invitations
    FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "owners_delete_invitations" ON team_invitations
    FOR DELETE USING (owner_id = auth.uid());

-- ============================================================
-- 2. Fonction UPSERT (crée ou renouvelle une invitation)
-- SECURITY DEFINER = s'exécute avec les droits du créateur (bypass RLS)
-- ============================================================
CREATE OR REPLACE FUNCTION upsert_team_invitation(
    p_owner_id   UUID,
    p_email      TEXT,
    p_role       TEXT,
    p_expires_at TIMESTAMPTZ
)
RETURNS SETOF team_invitations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    INSERT INTO team_invitations (owner_id, email, role, status, expires_at)
    VALUES (p_owner_id, p_email, p_role, 'pending', p_expires_at)
    ON CONFLICT (owner_id, email, status) DO UPDATE
        SET role       = EXCLUDED.role,
            expires_at = EXCLUDED.expires_at
    RETURNING *;
END;
$$;

-- Autoriser les utilisateurs authentifiés à appeler cette fonction
GRANT EXECUTE ON FUNCTION upsert_team_invitation TO authenticated;

-- ============================================================
-- 3. Fonction CANCEL (annule une invitation)
-- ============================================================
CREATE OR REPLACE FUNCTION cancel_team_invitation(
    p_invitation_id UUID,
    p_owner_id      UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE team_invitations
    SET status = 'cancelled'
    WHERE id = p_invitation_id
      AND owner_id = p_owner_id;
END;
$$;

GRANT EXECUTE ON FUNCTION cancel_team_invitation TO authenticated;
