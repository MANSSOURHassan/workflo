-- =====================================================
-- TABLE: SOCIAL_ANALYTICS (Statistiques détaillées par jour)
-- =====================================================
CREATE TABLE IF NOT EXISTS social_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    followers_count INTEGER DEFAULT 0,
    impressions INTEGER DEFAULT 0,
    reach INTEGER DEFAULT 0,
    engagement_rate DECIMAL(5,2) DEFAULT 0,
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(account_id, date)
);

-- Index pour les statistiques
CREATE INDEX IF NOT EXISTS idx_social_analytics_account_id ON social_analytics(account_id);
CREATE INDEX IF NOT EXISTS idx_social_analytics_date ON social_analytics(date);

-- RLS
ALTER TABLE social_analytics ENABLE ROW LEVEL SECURITY;

-- Politique pour que l'utilisateur puisse voir ses propres stats (via la relation account -> user)
CREATE POLICY "Users can view own social analytics" ON social_analytics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM social_accounts
            WHERE social_accounts.id = social_analytics.account_id
            AND social_accounts.user_id = auth.uid()
        )
    );

-- Helper function to generate mock analytics data for new accounts (simulating historical data api fetch)
CREATE OR REPLACE FUNCTION generate_mock_social_analytics(p_account_id UUID)
RETURNS VOID AS $$
DECLARE
    v_date DATE;
    v_followers INTEGER := 100 + floor(random() * 900);
BEGIN
    -- Generate data for last 30 days
    FOR i IN 0..30 LOOP
        v_date := CURRENT_DATE - i;
        
        INSERT INTO social_analytics (
            account_id,
            date,
            followers_count,
            impressions,
            reach,
            engagement_rate,
            likes,
            comments,
            shares,
            clicks
        ) VALUES (
            p_account_id,
            v_date,
            v_followers - (i * floor(random() * 5)), -- simulation of growth backward
            floor(random() * 1000) + 100,
            floor(random() * 800) + 50,
            (random() * 5)::DECIMAL(5,2),
            floor(random() * 100),
            floor(random() * 20),
            floor(random() * 10),
            floor(random() * 50)
        )
        ON CONFLICT (account_id, date) DO NOTHING;
    END LOOP;
END;
$$ LANGUAGE plpgsql;
