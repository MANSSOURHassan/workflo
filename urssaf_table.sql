-- Run this script in the Supabase SQL Editor

CREATE TABLE urssaf_declarations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  sales_revenue NUMERIC(15,2) DEFAULT 0,
  services_revenue NUMERIC(15,2) DEFAULT 0,
  tax_amount NUMERIC(15,2) DEFAULT 0,
  status TEXT CHECK (status IN ('pending', 'declared', 'paid')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS (Row Level Security)
ALTER TABLE urssaf_declarations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own declarations" ON urssaf_declarations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own declarations" ON urssaf_declarations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own declarations" ON urssaf_declarations
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own declarations" ON urssaf_declarations
  FOR DELETE USING (auth.uid() = user_id);

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_urssaf_declarations_updated_at
BEFORE UPDATE ON urssaf_declarations
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
