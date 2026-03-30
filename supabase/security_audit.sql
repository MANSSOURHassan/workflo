-- =============================================
-- SECURITY AUDIT & RLS REINFORCEMENT
-- =============================================

-- 1. INTEGRATIONS
ALTER TABLE IF EXISTS public.integrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "integrations_select_own" ON public.integrations;
CREATE POLICY "integrations_select_own" ON public.integrations 
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "integrations_insert_own" ON public.integrations;
CREATE POLICY "integrations_insert_own" ON public.integrations 
FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "integrations_update_own" ON public.integrations;
CREATE POLICY "integrations_update_own" ON public.integrations 
FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "integrations_delete_own" ON public.integrations;
CREATE POLICY "integrations_delete_own" ON public.integrations 
FOR DELETE USING (auth.uid() = user_id);


-- 2. CHATBOT CONVERSATIONS
ALTER TABLE IF EXISTS public.chatbot_conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chatbot_conv_select_own" ON public.chatbot_conversations;
CREATE POLICY "chatbot_conv_select_own" ON public.chatbot_conversations 
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "chatbot_conv_insert_own" ON public.chatbot_conversations;
CREATE POLICY "chatbot_conv_insert_own" ON public.chatbot_conversations 
FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "chatbot_conv_update_own" ON public.chatbot_conversations;
CREATE POLICY "chatbot_conv_update_own" ON public.chatbot_conversations 
FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "chatbot_conv_delete_own" ON public.chatbot_conversations;
CREATE POLICY "chatbot_conv_delete_own" ON public.chatbot_conversations 
FOR DELETE USING (auth.uid() = user_id);


-- 3. ASSISTANT CONVERSATIONS
ALTER TABLE IF EXISTS public.assistant_conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "assistant_conv_select_own" ON public.assistant_conversations;
CREATE POLICY "assistant_conv_select_own" ON public.assistant_conversations 
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "assistant_conv_insert_own" ON public.assistant_conversations;
CREATE POLICY "assistant_conv_insert_own" ON public.assistant_conversations 
FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "assistant_conv_update_own" ON public.assistant_conversations;
CREATE POLICY "assistant_conv_update_own" ON public.assistant_conversations 
FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "assistant_conv_delete_own" ON public.assistant_conversations;
CREATE POLICY "assistant_conv_delete_own" ON public.assistant_conversations 
FOR DELETE USING (auth.uid() = user_id);


-- 4. ASSISTANT MESSAGES
-- Note: Messages are linked via conversation_id. 
-- We ensure the user owns the conversation.
ALTER TABLE IF EXISTS public.assistant_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "assistant_msg_select_own" ON public.assistant_messages;
CREATE POLICY "assistant_msg_select_own" ON public.assistant_messages 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.assistant_conversations 
    WHERE id = conversation_id AND user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "assistant_msg_insert_own" ON public.assistant_messages;
CREATE POLICY "assistant_msg_insert_own" ON public.assistant_messages 
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.assistant_conversations 
    WHERE id = conversation_id AND user_id = auth.uid()
  )
);


-- 5. AUDIT LOGS REINFORCEMENT
ALTER TABLE IF EXISTS public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_logs_select_own" ON public.audit_logs;
CREATE POLICY "audit_logs_select_own" ON public.audit_logs 
FOR SELECT USING (auth.uid() = user_id);

-- Only system/authenticated actions should insert logs, tied to user
DROP POLICY IF EXISTS "audit_logs_insert_own" ON public.audit_logs;
CREATE POLICY "audit_logs_insert_own" ON public.audit_logs 
FOR INSERT WITH CHECK (auth.uid() = user_id);
