-- ============================================================
-- MODULE PAIE — Tables employees & payslips
-- Exécuter dans Supabase Dashboard → SQL Editor
-- ============================================================

-- Employés
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    -- Identité
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    employee_number VARCHAR(50),
    -- Poste
    job_title VARCHAR(200) NOT NULL,
    department VARCHAR(100),
    contract_type VARCHAR(20) DEFAULT 'CDI' CHECK (contract_type IN ('CDI', 'CDD', 'Stage', 'Apprentissage', 'Freelance')),
    -- Rémunération
    gross_salary DECIMAL(12,2) NOT NULL DEFAULT 0,
    -- Dates
    hire_date DATE,
    contract_end_date DATE,
    birth_date DATE,
    -- Contact
    email VARCHAR(254),
    phone VARCHAR(20),
    address TEXT,
    -- Social
    social_security_number VARCHAR(20),
    iban VARCHAR(34),
    -- Congés et temps de travail
    weekly_hours DECIMAL(5,2) DEFAULT 35,
    paid_leave_days INTEGER DEFAULT 25,
    -- Statuts
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_employees_user_id ON employees(user_id);
CREATE INDEX IF NOT EXISTS idx_employees_is_active ON employees(is_active);

-- Fiches de paie
CREATE TABLE IF NOT EXISTS payslips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    -- Période
    period_month INTEGER NOT NULL CHECK (period_month BETWEEN 1 AND 12),
    period_year INTEGER NOT NULL,
    -- Salaire brut
    gross_salary DECIMAL(12,2) NOT NULL,
    -- Heures
    worked_hours DECIMAL(6,2) DEFAULT 151.67,
    overtime_hours DECIMAL(6,2) DEFAULT 0,
    overtime_amount DECIMAL(12,2) DEFAULT 0,
    -- Primes & Indemnités
    bonus DECIMAL(12,2) DEFAULT 0,
    bonus_label VARCHAR(200),
    meal_allowance DECIMAL(12,2) DEFAULT 0,
    transport_allowance DECIMAL(12,2) DEFAULT 0,
    other_allowances DECIMAL(12,2) DEFAULT 0,
    -- Cotisations salariales (calculées auto)
    cotisation_retraite_base DECIMAL(12,2) DEFAULT 0,
    cotisation_retraite_comp DECIMAL(12,2) DEFAULT 0,
    cotisation_prevoyance DECIMAL(12,2) DEFAULT 0,
    cotisation_csg_deductible DECIMAL(12,2) DEFAULT 0,
    cotisation_csg_crds DECIMAL(12,2) DEFAULT 0,
    cotisation_other DECIMAL(12,2) DEFAULT 0,
    total_cotisations_salariales DECIMAL(12,2) DEFAULT 0,
    -- Cotisations patronales (info)
    total_cotisations_patronales DECIMAL(12,2) DEFAULT 0,
    -- Net
    net_before_tax DECIMAL(12,2) DEFAULT 0,
    impot_source DECIMAL(12,2) DEFAULT 0,
    net_to_pay DECIMAL(12,2) DEFAULT 0,
    -- Congés
    leave_taken INTEGER DEFAULT 0,
    leave_remaining INTEGER DEFAULT 25,
    -- Statut
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'issued', 'paid', 'archived')),
    payment_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(employee_id, period_month, period_year)
);

CREATE INDEX IF NOT EXISTS idx_payslips_user_id ON payslips(user_id);
CREATE INDEX IF NOT EXISTS idx_payslips_employee_id ON payslips(employee_id);
CREATE INDEX IF NOT EXISTS idx_payslips_period ON payslips(period_year, period_month);

-- RLS
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE payslips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_employees" ON employees USING (user_id = auth.uid());
CREATE POLICY "users_insert_employees" ON employees FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "users_update_employees" ON employees FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "users_delete_employees" ON employees FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "users_own_payslips" ON payslips USING (user_id = auth.uid());
CREATE POLICY "users_insert_payslips" ON payslips FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "users_update_payslips" ON payslips FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "users_delete_payslips" ON payslips FOR DELETE USING (user_id = auth.uid());

-- Trigger updated_at
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payslips_updated_at BEFORE UPDATE ON payslips FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
