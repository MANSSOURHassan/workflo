-- =====================================================
-- FIX: Supprimer et recréer les policies
-- =====================================================

-- Supprimer toutes les policies existantes
DROP POLICY IF EXISTS "Users can view own prospects" ON prospects;
DROP POLICY IF EXISTS "Users can insert own prospects" ON prospects;
DROP POLICY IF EXISTS "Users can update own prospects" ON prospects;
DROP POLICY IF EXISTS "Users can delete own prospects" ON prospects;

DROP POLICY IF EXISTS "Users can view own pipelines" ON pipelines;
DROP POLICY IF EXISTS "Users can insert own pipelines" ON pipelines;
DROP POLICY IF EXISTS "Users can update own pipelines" ON pipelines;
DROP POLICY IF EXISTS "Users can delete own pipelines" ON pipelines;

DROP POLICY IF EXISTS "Users can view own pipeline stages" ON pipeline_stages;
DROP POLICY IF EXISTS "Users can insert own pipeline stages" ON pipeline_stages;
DROP POLICY IF EXISTS "Users can update own pipeline stages" ON pipeline_stages;
DROP POLICY IF EXISTS "Users can delete own pipeline stages" ON pipeline_stages;

DROP POLICY IF EXISTS "Users can view own deals" ON deals;
DROP POLICY IF EXISTS "Users can insert own deals" ON deals;
DROP POLICY IF EXISTS "Users can update own deals" ON deals;
DROP POLICY IF EXISTS "Users can delete own deals" ON deals;

DROP POLICY IF EXISTS "Users can view own campaigns" ON campaigns;
DROP POLICY IF EXISTS "Users can insert own campaigns" ON campaigns;
DROP POLICY IF EXISTS "Users can update own campaigns" ON campaigns;
DROP POLICY IF EXISTS "Users can delete own campaigns" ON campaigns;

DROP POLICY IF EXISTS "Users can view own campaign recipients" ON campaign_recipients;
DROP POLICY IF EXISTS "Users can insert own campaign recipients" ON campaign_recipients;
DROP POLICY IF EXISTS "Users can delete own campaign recipients" ON campaign_recipients;

DROP POLICY IF EXISTS "Users can view own templates" ON email_templates;
DROP POLICY IF EXISTS "Users can insert own templates" ON email_templates;
DROP POLICY IF EXISTS "Users can update own templates" ON email_templates;
DROP POLICY IF EXISTS "Users can delete own templates" ON email_templates;

DROP POLICY IF EXISTS "Users can view own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can insert own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete own tasks" ON tasks;

DROP POLICY IF EXISTS "Users can view own activities" ON activities;
DROP POLICY IF EXISTS "Users can insert own activities" ON activities;

DROP POLICY IF EXISTS "Users can view own ai logs" ON ai_logs;
DROP POLICY IF EXISTS "Users can insert own ai logs" ON ai_logs;

DROP POLICY IF EXISTS "Users can view own webhooks" ON webhooks;
DROP POLICY IF EXISTS "Users can insert own webhooks" ON webhooks;
DROP POLICY IF EXISTS "Users can update own webhooks" ON webhooks;
DROP POLICY IF EXISTS "Users can delete own webhooks" ON webhooks;

DROP POLICY IF EXISTS "Users can view own api keys" ON api_keys;
DROP POLICY IF EXISTS "Users can insert own api keys" ON api_keys;
DROP POLICY IF EXISTS "Users can delete own api keys" ON api_keys;

DROP POLICY IF EXISTS "Users can view own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;

-- =====================================================
-- Recréer les policies
-- =====================================================

-- Policies for prospects
CREATE POLICY "Users can view own prospects" ON prospects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own prospects" ON prospects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own prospects" ON prospects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own prospects" ON prospects FOR DELETE USING (auth.uid() = user_id);

-- Policies for pipelines
CREATE POLICY "Users can view own pipelines" ON pipelines FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own pipelines" ON pipelines FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own pipelines" ON pipelines FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own pipelines" ON pipelines FOR DELETE USING (auth.uid() = user_id);

-- Policies for pipeline_stages
CREATE POLICY "Users can view own pipeline stages" ON pipeline_stages FOR SELECT 
  USING (EXISTS (SELECT 1 FROM pipelines WHERE pipelines.id = pipeline_stages.pipeline_id AND pipelines.user_id = auth.uid()));
CREATE POLICY "Users can insert own pipeline stages" ON pipeline_stages FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM pipelines WHERE pipelines.id = pipeline_stages.pipeline_id AND pipelines.user_id = auth.uid()));
CREATE POLICY "Users can update own pipeline stages" ON pipeline_stages FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM pipelines WHERE pipelines.id = pipeline_stages.pipeline_id AND pipelines.user_id = auth.uid()));
CREATE POLICY "Users can delete own pipeline stages" ON pipeline_stages FOR DELETE 
  USING (EXISTS (SELECT 1 FROM pipelines WHERE pipelines.id = pipeline_stages.pipeline_id AND pipelines.user_id = auth.uid()));

-- Policies for deals
CREATE POLICY "Users can view own deals" ON deals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own deals" ON deals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own deals" ON deals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own deals" ON deals FOR DELETE USING (auth.uid() = user_id);

-- Policies for campaigns
CREATE POLICY "Users can view own campaigns" ON campaigns FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own campaigns" ON campaigns FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own campaigns" ON campaigns FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own campaigns" ON campaigns FOR DELETE USING (auth.uid() = user_id);

-- Policies for campaign_recipients
CREATE POLICY "Users can view own campaign recipients" ON campaign_recipients FOR SELECT 
  USING (EXISTS (SELECT 1 FROM campaigns WHERE campaigns.id = campaign_recipients.campaign_id AND campaigns.user_id = auth.uid()));
CREATE POLICY "Users can insert own campaign recipients" ON campaign_recipients FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM campaigns WHERE campaigns.id = campaign_recipients.campaign_id AND campaigns.user_id = auth.uid()));
CREATE POLICY "Users can delete own campaign recipients" ON campaign_recipients FOR DELETE 
  USING (EXISTS (SELECT 1 FROM campaigns WHERE campaigns.id = campaign_recipients.campaign_id AND campaigns.user_id = auth.uid()));

-- Policies for email_templates
CREATE POLICY "Users can view own templates" ON email_templates FOR SELECT USING (auth.uid() = user_id OR is_public = TRUE);
CREATE POLICY "Users can insert own templates" ON email_templates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own templates" ON email_templates FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own templates" ON email_templates FOR DELETE USING (auth.uid() = user_id);

-- Policies for tasks
CREATE POLICY "Users can view own tasks" ON tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tasks" ON tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tasks" ON tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tasks" ON tasks FOR DELETE USING (auth.uid() = user_id);

-- Policies for activities
CREATE POLICY "Users can view own activities" ON activities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own activities" ON activities FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies for ai_logs
CREATE POLICY "Users can view own ai logs" ON ai_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own ai logs" ON ai_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies for webhooks
CREATE POLICY "Users can view own webhooks" ON webhooks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own webhooks" ON webhooks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own webhooks" ON webhooks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own webhooks" ON webhooks FOR DELETE USING (auth.uid() = user_id);

-- Policies for api_keys
CREATE POLICY "Users can view own api keys" ON api_keys FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own api keys" ON api_keys FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own api keys" ON api_keys FOR DELETE USING (auth.uid() = user_id);

-- Policies for user_settings
CREATE POLICY "Users can view own settings" ON user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON user_settings FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- DONE! Policies recréées avec succès
-- =====================================================
