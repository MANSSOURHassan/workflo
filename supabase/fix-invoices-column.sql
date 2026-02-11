-- =====================================================
-- FIX: AJOUT DES COLONNES COMPTABLES MANQUANTES
-- =====================================================
-- Ce script ajoute les colonnes 'account_code' manquantes aux tables invoices et expenses.
-- Exécutez ce script dans Supabase Dashboard > SQL Editor
-- =====================================================

DO $$
BEGIN
    -- 1. Ajout de la colonne account_code pour INVOICES (Factures - Compte 706)
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'invoices' 
        AND column_name = 'account_code'
    ) THEN
        ALTER TABLE invoices ADD COLUMN account_code VARCHAR(10) DEFAULT '706';
    END IF;

    -- 2. Ajout de la colonne account_code pour EXPENSES (Dépenses - Compte 606)
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'expenses' 
        AND column_name = 'account_code'
    ) THEN
        ALTER TABLE expenses ADD COLUMN account_code VARCHAR(10) DEFAULT '606';
    END IF;

END $$;

-- Forcer le rechargement du cache de schéma
NOTIFY pgrst, 'reload schema';

-- Message de confirmation
SELECT 'Les colonnes account_code ont été vérifiées et ajoutées si nécessaire.' as status;
