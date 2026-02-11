-- =====================================================
-- WORKFLOW CRM - Mise à jour des contraintes
-- =====================================================
-- Ce script met à jour les contraintes pour permettre 
-- plus de plateformes sociales
-- =====================================================

-- Supprimer l'ancienne contrainte de platforme
ALTER TABLE social_accounts DROP CONSTRAINT IF EXISTS social_accounts_platform_check;

-- Ajouter la nouvelle contrainte avec toutes les plateformes
ALTER TABLE social_accounts ADD CONSTRAINT social_accounts_platform_check 
  CHECK (platform IN (
    'linkedin', 
    'twitter', 
    'facebook', 
    'instagram',
    'youtube',
    'tiktok',
    'pinterest',
    'snapchat',
    'threads',
    'bluesky',
    'mastodon',
    'reddit',
    'twitch',
    'discord',
    'telegram',
    'whatsapp'
  ));

-- Refresh du cache PostgREST
NOTIFY pgrst, 'reload schema';

-- =====================================================
-- SUCCESS!
-- =====================================================
-- Plateformes maintenant supportées:
-- ✅ LinkedIn
-- ✅ Twitter / X
-- ✅ Facebook
-- ✅ Instagram
-- ✅ YouTube
-- ✅ TikTok
-- ✅ Pinterest
-- ✅ Snapchat
-- ✅ Threads
-- ✅ Bluesky
-- ✅ Mastodon
-- ✅ Reddit
-- ✅ Twitch
-- ✅ Discord
-- ✅ Telegram
-- ✅ WhatsApp Business
