-- =====================================================
-- GESTION BANCAIRE ET RAPPROCHEMENT
-- =====================================================

-- 1. TABLE: BANK_ACCOUNTS (Comptes Bancaires)
CREATE TABLE IF NOT EXISTS bank_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL, -- ex: 'Compte Courant BNP', 'Stripe', 'PayPal'
  bank_name VARCHAR(100),
  iban VARCHAR(34),
  bic VARCHAR(11),
  currency VARCHAR(3) DEFAULT 'EUR',
  initial_balance DECIMAL(15, 2) DEFAULT 0,
  current_balance DECIMAL(15, 2) DEFAULT 0,
  account_type VARCHAR(20) DEFAULT 'checking' CHECK (account_type IN ('checking', 'savings', 'credit', 'payment_processor')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, iban)
);

CREATE INDEX IF NOT EXISTS idx_bank_accounts_user_id ON bank_accounts(user_id);

-- 2. TABLE: BANK_TRANSACTIONS (Opérations Bancaires)
CREATE TABLE IF NOT EXISTS bank_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bank_account_id UUID NOT NULL REFERENCES bank_accounts(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT NOT NULL,
  amount DECIMAL(15, 2) NOT NULL, -- Positif pour les entrées, négatif pour les sorties
  category VARCHAR(50),
  external_id TEXT, -- ID pour la synchro bancaire
  
  -- Rapprochement
  status VARCHAR(20) DEFAULT 'unreconciled' CHECK (status IN ('unreconciled', 'reconciled', 'ignored')),
  linked_entity_type VARCHAR(20) CHECK (linked_entity_type IN ('invoice', 'expense', 'transfer', 'other')),
  linked_entity_id UUID, -- ID de la facture ou dépense liée
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bank_transactions_user_id ON bank_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_account_id ON bank_transactions(bank_account_id);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_status ON bank_transactions(status);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_date ON bank_transactions(date);

-- 3. RLS POLICIES
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bank accounts" ON bank_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own bank accounts" ON bank_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own bank accounts" ON bank_accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own bank accounts" ON bank_accounts FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own bank transactions" ON bank_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own bank transactions" ON bank_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own bank transactions" ON bank_transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own bank transactions" ON bank_transactions FOR DELETE USING (auth.uid() = user_id);

-- 4. TRIGGERS
CREATE TRIGGER update_bank_accounts_updated_at BEFORE UPDATE ON bank_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bank_transactions_updated_at BEFORE UPDATE ON bank_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. FUNCTION TO UPDATE BANK BALANCE AUTOMATICALLY
CREATE OR REPLACE FUNCTION update_bank_account_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE bank_accounts SET current_balance = current_balance + NEW.amount WHERE id = NEW.bank_account_id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE bank_accounts SET current_balance = current_balance - OLD.amount WHERE id = OLD.bank_account_id;
  ELSIF (TG_OP = 'UPDATE') THEN
    UPDATE bank_accounts SET current_balance = current_balance - OLD.amount + NEW.amount WHERE id = NEW.bank_account_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_bank_balance
AFTER INSERT OR UPDATE OR DELETE ON bank_transactions
FOR EACH ROW EXECUTE FUNCTION update_bank_account_balance();

-- 6. REFRESH CACHE
NOTIFY pgrst, 'reload schema';
