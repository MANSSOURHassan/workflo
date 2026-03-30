-- =============================================
-- TABLE: INTEGRATIONS
-- Stocke les connexions aux services tiers (OpenAI, Stripe, etc.)
-- =============================================

-- Suppression de la table si nécessaire (Attention: supprime les données)
-- DROP TABLE IF EXISTS public.integrations;

CREATE TABLE IF NOT EXISTS public.integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Identifiants techniques
    provider TEXT NOT NULL, -- ex: 'openai', 'stripe', 'slack'
    provider_category TEXT NOT NULL CHECK (provider_category IN (
        'ai', 
        'automation', 
        'communication', 
        'productivity', 
        'email', 
        'crm', 
        'payment', 
        'development', 
        'other'
    )),
    
    -- Informations d'affichage
    name TEXT NOT NULL,
    description TEXT,
    
    -- État et Secrets
    is_active BOOLEAN DEFAULT TRUE,
    api_key TEXT,
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMPTZ,
    
    -- Configurations spécifiques
    settings JSONB DEFAULT '{}',
    
    -- Métadonnées
    last_sync_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Contrainte d'unicité : un utilisateur ne peut avoir qu'une seule connexion par fournisseur
    UNIQUE(user_id, provider)
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_integrations_user_id ON public.integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_integrations_provider ON public.integrations(provider);

-- Activation de la sécurité (RLS)
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

-- Politiques de sécurité
DROP POLICY IF EXISTS "Users can view own integrations" ON public.integrations;
CREATE POLICY "Users can view own integrations" ON public.integrations 
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own integrations" ON public.integrations;
CREATE POLICY "Users can insert own integrations" ON public.integrations 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own integrations" ON public.integrations;
CREATE POLICY "Users can update own integrations" ON public.integrations 
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own integrations" ON public.integrations;
CREATE POLICY "Users can delete own integrations" ON public.integrations 
    FOR DELETE USING (auth.uid() = user_id);

-- Trigger pour la mise à jour automatique de updated_at
CREATE OR REPLACE FUNCTION public.update_integrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_integrations_updated_at ON public.integrations;
CREATE TRIGGER tr_integrations_updated_at
    BEFORE UPDATE ON public.integrations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_integrations_updated_at();

-- Message de succès
-- Table 'integrations' créée avec succès avec contraintes de catégorie en anglais.
