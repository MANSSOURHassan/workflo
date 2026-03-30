-- Table for external integrations (AI, Automation, etc.)
CREATE TABLE IF NOT EXISTS integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    provider TEXT NOT NULL,
    provider_category TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}'::jsonb,
    api_key TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Ensure one provider per user
    UNIQUE(user_id, provider)
);

-- Table for AI activity logs
CREATE TABLE IF NOT EXISTS ai_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    action_type TEXT NOT NULL, -- 'scoring', 'email_suggestion', 'copilot_chat'
    input_data JSONB DEFAULT '{}'::jsonb,
    output_data JSONB DEFAULT '{}'::jsonb,
    tokens_used INTEGER DEFAULT 0,
    model_used TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_logs ENABLE ROW LEVEL SECURITY;

-- Policies for integrations
CREATE POLICY "Users can view their own integrations"
    ON integrations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own integrations"
    ON integrations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own integrations"
    ON integrations FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own integrations"
    ON integrations FOR DELETE
    USING (auth.uid() = user_id);

-- Policies for ai_logs
CREATE POLICY "Users can view their own ai_logs"
    ON ai_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ai_logs"
    ON ai_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_integrations_updated_at ON integrations;
CREATE TRIGGER update_integrations_updated_at
    BEFORE UPDATE ON integrations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Table for email automation rules
CREATE TABLE IF NOT EXISTS autopilot_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    trigger_type TEXT NOT NULL, -- 'event', 'schedule', 'condition'
    trigger_config JSONB DEFAULT '{}'::jsonb,
    conditions JSONB DEFAULT '[]'::jsonb,
    actions JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    stats JSONB DEFAULT '{"sent": 0, "opened": 0, "clicked": 0, "triggered": 0, "success": 0, "failed": 0}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for autopilot_rules
ALTER TABLE autopilot_rules ENABLE ROW LEVEL SECURITY;

-- Policies for autopilot_rules
CREATE POLICY "Users can view their own autopilot_rules"
    ON autopilot_rules FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own autopilot_rules"
    ON autopilot_rules FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own autopilot_rules"
    ON autopilot_rules FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own autopilot_rules"
    ON autopilot_rules FOR DELETE
    USING (auth.uid() = user_id);

-- Trigger for update_at on autopilot_rules
DROP TRIGGER IF EXISTS update_autopilot_rules_updated_at ON autopilot_rules;
CREATE TRIGGER update_autopilot_rules_updated_at
    BEFORE UPDATE ON autopilot_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Table for outgoing webhooks
CREATE TABLE IF NOT EXISTS webhooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    events TEXT[] DEFAULT '{}'::text[],
    secret TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_triggered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for user-generated API keys
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    key TEXT UNIQUE NOT NULL,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Policies for webhooks
CREATE POLICY "Users can view their own webhooks"
    ON webhooks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own webhooks"
    ON webhooks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own webhooks"
    ON webhooks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own webhooks"
    ON webhooks FOR DELETE USING (auth.uid() = user_id);

-- Policies for api_keys
CREATE POLICY "Users can view their own api_keys"
    ON api_keys FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own api_keys"
    ON api_keys FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own api_keys"
    ON api_keys FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at on webhooks
DROP TRIGGER IF EXISTS update_webhooks_updated_at ON webhooks;
CREATE TRIGGER update_webhooks_updated_at
    BEFORE UPDATE ON webhooks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
