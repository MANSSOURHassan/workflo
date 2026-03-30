-- =====================================================
-- WORKFLOW CRM - Setup Synchronisation Calendrier
-- =====================================================

-- 1. Création de la table si elle n'existe pas (Sécurité)
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(300) NOT NULL,
  description TEXT,
  event_type VARCHAR(20) DEFAULT 'meeting',
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  all_day BOOLEAN DEFAULT FALSE,
  location TEXT,
  meeting_link TEXT,
  color VARCHAR(50),
  prospect_id UUID REFERENCES prospects(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'confirmed',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Ajout des colonnes pour la synchronisation
ALTER TABLE public.calendar_events 
ADD COLUMN IF NOT EXISTS external_id VARCHAR(500),
ADD COLUMN IF NOT EXISTS integration_id UUID REFERENCES public.email_integrations(id) ON DELETE CASCADE;

-- 3. Contrainte d'unicité pour éviter les doublons lors de la sync
-- On ne peut avoir qu'une seule fois le même événement Google pour une intégration donnée
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'idx_calendar_events_external_id_unique'
    ) THEN
        ALTER TABLE public.calendar_events 
        ADD CONSTRAINT idx_calendar_events_external_id_unique UNIQUE(integration_id, external_id);
    END IF;
END $$;

-- 4. Index pour les performances
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON public.calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_integration_id ON public.calendar_events(integration_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_external_id ON public.calendar_events(external_id);

-- 5. Activation RLS
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

-- 6. Politiques de sécurité (au cas où elles manquent)
DROP POLICY IF EXISTS "Users can perform all actions on own events" ON public.calendar_events;
CREATE POLICY "Users can perform all actions on own events" 
ON public.calendar_events 
FOR ALL 
USING (auth.uid() = user_id);

-- Message de succès
-- Table 'calendar_events' prête pour la synchronisation Google !
