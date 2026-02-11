-- Add missing columns to prospects table to match TypeScript types
-- This fixes the "column does not exist" errors

-- Add first_name if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prospects' AND column_name = 'first_name') THEN
    ALTER TABLE public.prospects ADD COLUMN first_name TEXT;
  END IF;
END $$;

-- Add last_name if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prospects' AND column_name = 'last_name') THEN
    ALTER TABLE public.prospects ADD COLUMN last_name TEXT;
  END IF;
END $$;

-- Add company if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prospects' AND column_name = 'company') THEN
    ALTER TABLE public.prospects ADD COLUMN company TEXT;
  END IF;
END $$;

-- Add job_title if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prospects' AND column_name = 'job_title') THEN
    ALTER TABLE public.prospects ADD COLUMN job_title TEXT;
  END IF;
END $$;

-- Add linkedin_url if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prospects' AND column_name = 'linkedin_url') THEN
    ALTER TABLE public.prospects ADD COLUMN linkedin_url TEXT;
  END IF;
END $$;

-- Add last_contacted_at if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prospects' AND column_name = 'last_contacted_at') THEN
    ALTER TABLE public.prospects ADD COLUMN last_contacted_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Copy existing data from old columns to new columns if old columns exist
DO $$ 
BEGIN
  -- Copy contact_name to first_name if contact_name exists
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prospects' AND column_name = 'contact_name') THEN
    UPDATE public.prospects SET first_name = contact_name WHERE first_name IS NULL AND contact_name IS NOT NULL;
  END IF;
  
  -- Copy company_name to company if company_name exists
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prospects' AND column_name = 'company_name') THEN
    UPDATE public.prospects SET company = company_name WHERE company IS NULL AND company_name IS NOT NULL;
  END IF;
END $$;

-- Update status constraint to match TypeScript types
ALTER TABLE public.prospects DROP CONSTRAINT IF EXISTS prospects_status_check;
ALTER TABLE public.prospects ADD CONSTRAINT prospects_status_check 
  CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'lost', 'proposal', 'negotiation', 'won'));

-- Update source constraint to match TypeScript types
ALTER TABLE public.prospects DROP CONSTRAINT IF EXISTS prospects_source_check;
ALTER TABLE public.prospects ADD CONSTRAINT prospects_source_check 
  CHECK (source IN ('manual', 'import', 'api', 'website', 'linkedin', 'referral', 'ai_generated'));

-- Create index on new columns
CREATE INDEX IF NOT EXISTS idx_prospects_first_name ON public.prospects(first_name);
CREATE INDEX IF NOT EXISTS idx_prospects_last_name ON public.prospects(last_name);
CREATE INDEX IF NOT EXISTS idx_prospects_company ON public.prospects(company);
