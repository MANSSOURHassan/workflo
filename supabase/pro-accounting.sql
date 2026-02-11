-- =====================================================
-- COMPTABILITÉ PROFESSIONNELLE (PLAN COMPTABLE GÉNÉRAL - PCG)
-- =====================================================

-- 1. TABLE: ACCOUNTING_ACCOUNTS (Plan Comptable)
CREATE TABLE IF NOT EXISTS accounting_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code VARCHAR(10) NOT NULL, -- ex: '6061', '706', '512'
  label VARCHAR(255) NOT NULL, -- ex: 'Bâtiment', 'Prestations de services'
  class_number INTEGER NOT NULL, -- 1 à 7
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, code)
);

CREATE INDEX IF NOT EXISTS idx_accounting_accounts_user_id ON accounting_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounting_accounts_code ON accounting_accounts(code);

-- 2. AJOUT DU CODE COMPTABLE AUX FACTURES ET DÉPENSES
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS account_code VARCHAR(10) DEFAULT '706';
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS account_code VARCHAR(10) DEFAULT '606';

-- 3. TABLE: JOURNAL_ENTRIES (Grand Livre / Journal de saisie)
-- Pour une comptabilité en partie double
CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  label VARCHAR(255) NOT NULL,
  reference_type VARCHAR(50), -- 'invoice', 'expense', 'manual'
  reference_id UUID, -- ID de la facture ou dépense liée
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS journal_lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  account_code VARCHAR(10) NOT NULL,
  debit DECIMAL(15, 2) DEFAULT 0,
  credit DECIMAL(15, 2) DEFAULT 0,
  description TEXT
);

-- 4. RLS
ALTER TABLE accounting_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own accounting" ON accounting_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own journal" ON journal_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own journal lines" ON journal_lines FOR SELECT USING (
  EXISTS (SELECT 1 FROM journal_entries WHERE id = entry_id AND user_id = auth.uid())
);

-- 5. INITIALISATION DU PLAN COMPTABLE PAR DÉFAUT (PCG Simplifié)
-- Cette fonction pourra être appelée à la création d'un compte
CREATE OR REPLACE FUNCTION seed_default_accounts(target_user_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO accounting_accounts (user_id, code, label, class_number) VALUES
  -- Classe 1: Capitaux
  (target_user_id, '101', 'Capital', 1),
  -- Classe 2: Immobilisations
  (target_user_id, '218', 'Matériel informatique', 2),
  -- Classe 4: Tiers
  (target_user_id, '401', 'Fournisseurs', 4),
  (target_user_id, '411', 'Clients', 4),
  (target_user_id, '4457', 'TVA collectée', 4),
  (target_user_id, '4456', 'TVA déductible', 4),
  -- Classe 5: Comptes financiers
  (target_user_id, '512', 'Banque', 5),
  (target_user_id, '530', 'Caisse', 5),
  -- Classe 6: Charges
  (target_user_id, '606', 'Achats non stockés', 6),
  (target_user_id, '616', 'Primes d''assurance', 6),
  (target_user_id, '623', 'Publicité, relations publiques', 6),
  (target_user_id, '626', 'Frais postaux et télécoms', 6),
  (target_user_id, '641', 'Rémunérations du personnel', 6),
  -- Classe 7: Produits
  (target_user_id, '706', 'Prestations de services', 7),
  (target_user_id, '707', 'Ventes de marchandises', 7)
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;
