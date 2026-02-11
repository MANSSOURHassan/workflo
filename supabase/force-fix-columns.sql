-- =====================================================
-- FIX: FORCER LA CORRECTION DES COLONNES
-- =====================================================
-- Ce script supprime l'ancienne colonne et crée la nouvelle propre.
-- Exécutez ce script dans Supabase Dashboard > SQL Editor
-- =====================================================

ALTER TABLE invoices DROP COLUMN IF EXISTS code_de_compte;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS account_code VARCHAR(10) DEFAULT '706';

ALTER TABLE expenses DROP COLUMN IF EXISTS code_de_compte;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS account_code VARCHAR(10) DEFAULT '606';

-- Forcer le rechargement du cache de schéma
NOTIFY pgrst, 'reload schema';
