-- =====================================================
-- FIX: RENOMMAGE DE LA COLONNE CODE_DE_COMPTE -> ACCOUNT_CODE
-- =====================================================
-- Ce script renomme la colonne 'code_de_compte' en 'account_code' pour correspondre au code de l'application.
-- Exécutez ce script dans Supabase Dashboard > SQL Editor
-- =====================================================

DO $$
BEGIN
    -- 1. Table INVOICES
    -- Vérifier si 'code_de_compte' existe et 'account_code' n'existe pas
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'code_de_compte') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'account_code') THEN
        
        ALTER TABLE invoices RENAME COLUMN code_de_compte TO account_code;
    
    -- Si 'account_code' n'existe pas du tout (ni l'un ni l'autre), on le crée
    ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'account_code') THEN
        ALTER TABLE invoices ADD COLUMN account_code VARCHAR(10) DEFAULT '706';
    END IF;

    -- 2. Table EXPENSES
    -- Vérifier si 'code_de_compte' existe et 'account_code' n'existe pas
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'code_de_compte') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'account_code') THEN
        
        ALTER TABLE expenses RENAME COLUMN code_de_compte TO account_code;
    
    -- Si 'account_code' n'existe pas du tout, on le crée
    ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'account_code') THEN
        ALTER TABLE expenses ADD COLUMN account_code VARCHAR(10) DEFAULT '606';
    END IF;

END $$;

-- Forcer le rechargement du cache de schéma
NOTIFY pgrst, 'reload schema';

-- Message de confirmation
SELECT 'Correction effectuée : Les colonnes sont maintenant standardisées sur account_code.' as status;
