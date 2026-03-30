'use server'

import { createClient } from '@/lib/supabase/server'

// ── Helpers ────────────────────────────────────────────────────────────────

async function getUserAIConfig(supabase: any, userId: string) {
  // Priority order: openai → anthropic → google-ai → env fallback
  const providers = ['openai', 'anthropic', 'google-ai']

  for (const provider of providers) {
    const { data } = await supabase
      .from('integrations')
      .select('api_key, settings')
      .eq('user_id', userId)
      .eq('provider', provider)
      .eq('is_active', true)
      .maybeSingle()

    if (data?.api_key) {
      return { provider, apiKey: data.api_key, settings: data.settings || {} }
    }
  }

  // Fallback to server env key (OpenAI)
  if (process.env.OPENAI_API_KEY) {
    return { provider: 'openai', apiKey: process.env.OPENAI_API_KEY, settings: {} }
  }

  return null
}

async function callOpenAI(apiKey: string, systemPrompt: string, history: { role: string; content: string }[], message: string) {
  const { default: OpenAI } = await import('openai')
  const openai = new OpenAI({ apiKey })
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      ...history.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user', content: message }
    ],
    temperature: 0.7,
    max_tokens: 1000,
  })
  return response.choices[0].message.content || ''
}

async function callAnthropic(apiKey: string, systemPrompt: string, history: { role: string; content: string }[], message: string) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1000,
      system: systemPrompt,
      messages: [
        ...history.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: message }
      ]
    })
  })
  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.error?.message || `Anthropic API error ${response.status}`)
  }
  const data = await response.json()
  return data.content?.[0]?.text || ''
}

async function callGemini(apiKey: string, systemPrompt: string, history: { role: string; content: string }[], message: string) {
  const contents = [
    ...history.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    })),
    { role: 'user', parts: [{ text: message }] }
  ]

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: { maxOutputTokens: 1000, temperature: 0.7 }
      })
    }
  )
  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.error?.message || `Gemini API error ${response.status}`)
  }
  const data = await response.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

// ── Main actions ───────────────────────────────────────────────────────────

export async function askCopilot(
  message: string,
  history: { role: 'user' | 'assistant'; content: string }[],
  currentPage?: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non autorisé' }

  const aiConfig = await getUserAIConfig(supabase, user.id)

  if (!aiConfig) {
    return {
      error: `⚠️ Aucun modèle IA configuré. Allez dans **Intégrations** et connectez OpenAI, Claude (Anthropic) ou Gemini avec votre clé API personnelle.`
    }
  }

  try {
    let stats = { prospects: 0, deals: 0, campaigns: 0 }
    try {
      const [p, d, c] = await Promise.all([
        supabase.from('prospects').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('deals').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('campaigns').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      ])
      stats = { prospects: p.count || 0, deals: d.count || 0, campaigns: c.count || 0 }
    } catch { }

    const systemPrompt = `Tu es l'assistant IA (Copilot) de Workflow CRM.
Ta mission est d'aider l'utilisateur à réaliser ses tâches quotidiennes dans le CRM.

L'utilisateur est actuellement sur la page : ${currentPage || 'Inconnue'}

Contexte actuel du compte :
- Nombre de prospects : ${stats.prospects}
- Nombre d'opportunités : ${stats.deals}
- Nombre de campagnes : ${stats.campaigns}

Fonctionnalités disponibles :
1. Prospects : Import, scoring, segmentation.
2. Pipeline : Suivi des deals.
3. Campagnes : Emailing/LinkedIn.
4. Calendrier : Rendez-vous.
5. IA : Scoring, génération d'emails, posts réseaux sociaux.

Directives :
- Sois bref, professionnel et utile.
- Réponds toujours en français.`

    let aiMessage = ''

    if (aiConfig.provider === 'openai') {
      aiMessage = await callOpenAI(aiConfig.apiKey, systemPrompt, history, message)
    } else if (aiConfig.provider === 'anthropic') {
      aiMessage = await callAnthropic(aiConfig.apiKey, systemPrompt, history, message)
    } else if (aiConfig.provider === 'google-ai') {
      aiMessage = await callGemini(aiConfig.apiKey, systemPrompt, history, message)
    }

    // Log interaction
    try {
      await supabase.from('ai_logs').insert({
        user_id: user.id,
        action_type: 'copilot_chat',
        input_data: { message, history_length: history.length, page: currentPage, provider: aiConfig.provider },
        output_data: { response: aiMessage },
        model_used: aiConfig.provider
      })
    } catch { }

    return { data: aiMessage }
  } catch (error: any) {
    console.error('Copilot Error:', error)
    
    let userFriendlyMessage = error.message
    
    // Détection spécifique des erreurs de quota (429)
    if (error.message?.includes('429') || 
        error.message?.toLowerCase().includes('quota exceeded') || 
        error.message?.toLowerCase().includes('insufficient_quota') ||
        error.status === 429) {
      userFriendlyMessage = `Votre quota ${aiConfig.provider} est épuisé ou votre limite est atteinte. Veuillez vérifier votre abonnement et vos crédits sur le tableau de bord ${aiConfig.provider === 'openai' ? 'OpenAI' : aiConfig.provider === 'anthropic' ? 'Anthropic' : 'Google Cloud'}.`
    } else if (error.message?.toLowerCase().includes('api key') || error.status === 401) {
      userFriendlyMessage = `Votre clé API ${aiConfig.provider} semble invalide. Veuillez la vérifier dans les paramètres d'intégration.`
    }

    return { error: `Erreur IA (${aiConfig.provider}) : ${userFriendlyMessage}` }
  }
}

export async function getAIAdvice() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non autorisé' }

  const aiConfig = await getUserAIConfig(supabase, user.id)
  if (!aiConfig) return { data: '💡 Conseil : Configurez un modèle IA dans Intégrations pour recevoir des conseils personnalisés.' }

  try {
    let prospectsCount = 0
    try {
      const { count } = await supabase.from('prospects').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
      prospectsCount = count || 0
    } catch { }

    const systemPrompt = `Tu es un expert en CRM. Donne un conseil très court (un tweet maximum) à un utilisateur de CRM pour améliorer sa productivité. Réponds en français.`
    const message = `L'utilisateur a ${prospectsCount} prospects.`

    let advice = ''
    if (aiConfig.provider === 'openai') advice = await callOpenAI(aiConfig.apiKey, systemPrompt, [], message)
    else if (aiConfig.provider === 'anthropic') advice = await callAnthropic(aiConfig.apiKey, systemPrompt, [], message)
    else if (aiConfig.provider === 'google-ai') advice = await callGemini(aiConfig.apiKey, systemPrompt, [], message)

    return { data: advice }
  } catch (error: any) {
    return { data: '💡 Conseil : Prenez le temps de qualifier vos nouveaux prospects chaque matin.' }
  }
}
