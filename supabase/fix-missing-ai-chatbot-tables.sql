-- =====================================================
-- FIX: TABLES IA & CHATBOT MANQUANTES
-- =====================================================
-- Ce script crée les tables nécessaires pour l'Assistant IA 
-- et le Widget Chatbot qui n'étaient pas dans le schéma initial.
-- =====================================================

-- 1. TABLES POUR L'ASSISTANT IA (Dashboard Assistant)
-- -----------------------------------------------------

-- Table des conversations de l'assistant
CREATE TABLE IF NOT EXISTS public.assistant_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT DEFAULT 'Nouvelle conversation',
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des messages de l'assistant
CREATE TABLE IF NOT EXISTS public.assistant_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES assistant_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABLES POUR LE WIDGET CHATBOT (Site Web Externe)
-- -----------------------------------------------------

-- Table des conversations du chatbot (visiteurs externes)
CREATE TABLE IF NOT EXISTS public.chatbot_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    visitor_id TEXT, -- ID anonyme du visiteur
    visitor_email TEXT, -- Capturé si l'option est activée
    visitor_name TEXT,
    last_message TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'lead')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des messages du chatbot
CREATE TABLE IF NOT EXISTS public.chatbot_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES chatbot_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'bot')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABLE DE PERSONNALISATION (Settings)
-- -----------------------------------------------------

CREATE TABLE IF NOT EXISTS public.customizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    theme TEXT DEFAULT 'system',
    primary_color TEXT DEFAULT '#6366f1',
    accent_color TEXT DEFAULT '#8b5cf6',
    company_name TEXT DEFAULT 'Mon Entreprise',
    dashboard_layout JSONB DEFAULT '{}',
    widget_positions JSONB DEFAULT '[]',
    hidden_features TEXT[] DEFAULT '{}',
    default_currency TEXT DEFAULT 'EUR',
    date_format TEXT DEFAULT 'DD/MM/YYYY',
    time_format TEXT DEFAULT '24h',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 4. SÉCURITÉ (RLS)
-- -----------------------------------------------------

ALTER TABLE assistant_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistant_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE customizations ENABLE ROW LEVEL SECURITY;

-- Politiques pour Assistant
CREATE POLICY "Users can manage their own assistant conversations"
    ON assistant_conversations FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own assistant messages"
    ON assistant_messages FOR ALL
    USING (EXISTS (
        SELECT 1 FROM assistant_conversations 
        WHERE assistant_conversations.id = assistant_messages.conversation_id 
        AND assistant_conversations.user_id = auth.uid()
    ));

-- Politiques pour Chatbot
CREATE POLICY "Users can view their own chatbot data"
    ON chatbot_conversations FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own chatbot messages"
    ON chatbot_messages FOR ALL
    USING (EXISTS (
        SELECT 1 FROM chatbot_conversations 
        WHERE chatbot_conversations.id = chatbot_messages.conversation_id 
        AND chatbot_conversations.user_id = auth.uid()
    ));

-- Politiques pour Customizations
CREATE POLICY "Users can manage their own customizations"
    ON customizations FOR ALL USING (auth.uid() = user_id);

-- 5. TRIGGERS POUR UPDATED_AT
-- -----------------------------------------------------

DROP TRIGGER IF EXISTS update_assistant_conversations_updated_at ON assistant_conversations;
CREATE TRIGGER update_assistant_conversations_updated_at
    BEFORE UPDATE ON assistant_conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_chatbot_conversations_updated_at ON chatbot_conversations;
CREATE TRIGGER update_chatbot_conversations_updated_at
    BEFORE UPDATE ON chatbot_conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_customizations_updated_at ON customizations;
CREATE TRIGGER update_customizations_updated_at
    BEFORE UPDATE ON customizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Refresh cache
NOTIFY pgrst, 'reload schema';
