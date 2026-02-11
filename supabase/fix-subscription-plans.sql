-- =====================================================
-- WORKFLOW CRM - SCRIPT DE RÉPARATION DES PLANS
-- =====================================================
-- Copiez ce script dans l'éditeur SQL de Supabase
-- (Dashboard > SQL Editor > New Query)
-- =====================================================

-- 1. S'assurer que la table profiles existe
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Ajouter la colonne plan si elle manque
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='profiles' AND COLUMN_NAME='plan') THEN
    ALTER TABLE profiles ADD COLUMN plan VARCHAR(20) DEFAULT 'starter' CHECK (plan IN ('starter', 'pro', 'enterprise'));
  END IF;
END $$;

-- 3. Activer RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 4. Nettoyer les anciennes politiques pour éviter les doublons
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can manage own profile" ON profiles; -- Au cas où une ancienne existe

-- 5. Créer les nouvelles politiques strictes
-- On autorise l'affichage, l'insertion et la modification pour le propriétaire du profil
CREATE POLICY "Users can view own profile" ON profiles 
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles 
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles 
  FOR UPDATE USING (auth.uid() = id);

-- 6. Forcer le rechargement du cache de l'API Supabase
NOTIFY pgrst, 'reload schema';

-- 7. Initialiser le profil pour l'utilisateur actuel s'il n'existe pas
-- Remarque : Le code JS s'en occupe maintenant avec upsert, mais c'est bien de le faire ici aussi
INSERT INTO profiles (id, email, plan)
SELECT id, email, 'starter'
FROM auth.users
ON CONFLICT (id) DO NOTHING;
