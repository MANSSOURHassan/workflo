-- Security verification and additional indexes for performance

-- Ensure RLS is enabled on all tables (idempotent)
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.campaign_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ai_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.imports ENABLE ROW LEVEL SECURITY;

-- Add performance indexes (IF NOT EXISTS for idempotency)
CREATE INDEX IF NOT EXISTS idx_prospects_user_status ON public.prospects(user_id, status);
CREATE INDEX IF NOT EXISTS idx_prospects_user_email ON public.prospects(user_id, email);
CREATE INDEX IF NOT EXISTS idx_prospects_user_created ON public.prospects(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prospects_ai_score ON public.prospects(user_id, ai_score DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_deals_user_status ON public.deals(user_id, status);
CREATE INDEX IF NOT EXISTS idx_deals_pipeline_stage ON public.deals(pipeline_id, stage_id);

CREATE INDEX IF NOT EXISTS idx_campaigns_user_status ON public.campaigns(user_id, status);

CREATE INDEX IF NOT EXISTS idx_activities_user_created ON public.activities(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_prospect ON public.activities(prospect_id);

-- Add text search index for prospects (for search functionality)
CREATE INDEX IF NOT EXISTS idx_prospects_search ON public.prospects USING gin(
  to_tsvector('french', 
    coalesce(first_name, '') || ' ' || 
    coalesce(last_name, '') || ' ' || 
    coalesce(company, '') || ' ' || 
    coalesce(email, '')
  )
);

-- Add constraint to prevent negative values
ALTER TABLE public.deals DROP CONSTRAINT IF EXISTS deals_value_positive;
ALTER TABLE public.deals ADD CONSTRAINT deals_value_positive CHECK (value >= 0);

ALTER TABLE public.prospects DROP CONSTRAINT IF EXISTS prospects_ai_score_range;
ALTER TABLE public.prospects ADD CONSTRAINT prospects_ai_score_range CHECK (ai_score IS NULL OR (ai_score >= 0 AND ai_score <= 100));

-- Verify all tables have RLS policies (should already exist from initial migration)
-- These are additional safety policies that use the same pattern

-- Additional email validation check
ALTER TABLE public.prospects DROP CONSTRAINT IF EXISTS prospects_email_format;
ALTER TABLE public.prospects ADD CONSTRAINT prospects_email_format 
  CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
