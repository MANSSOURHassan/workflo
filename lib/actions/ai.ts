'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidateTag } from 'next/cache'
import OpenAI from 'openai'
import type { Prospect } from '@/lib/types/database'

// Helper to get OpenAI client
async function getOpenAIClient(supabase: any, userId: string) {
  try {
    const { data: integration } = await supabase
      .from('integrations')
      .select('api_key')
      .eq('user_id', userId)
      .eq('provider', 'openai')
      .eq('is_active', true)
      .single()

    if (integration?.api_key) {
      return new OpenAI({ apiKey: integration.api_key })
    }

    // Fallback to environment variable
    if (process.env.OPENAI_API_KEY) {
      return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    }

    return null
  } catch (error) {
    console.error('Error fetching OpenAI integration:', error)
    if (process.env.OPENAI_API_KEY) {
      return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    }
    return null
  }
}

// AI Scoring algorithm based on prospect data completeness and engagement
export async function calculateAIScore(prospectId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Non autorisé' }
  }

  // Check subscription plan
  const { getUserPlan } = await import('@/lib/utils/subscription')
  const plan = await getUserPlan()

  if (plan && plan.name === 'Starter') {
    return { error: "Le scoring IA n'est pas disponible avec votre plan actuel. Veuillez passer au plan Pro." }
  }

  const { data: prospect, error } = await supabase
    .from('prospects')
    .select('*')
    .eq('id', prospectId)
    .eq('user_id', user.id)
    .single()

  if (error || !prospect) {
    return { error: error?.message || 'Prospect non trouvé' }
  }

  // Calculate score based on various factors
  let score = 0
  const p = prospect as Prospect

  // Data completeness (max 30 points)
  if (p.email) score += 5
  if (p.first_name && p.last_name) score += 5
  if (p.company) score += 5
  if (p.job_title) score += 5
  if (p.phone) score += 3
  if (p.linkedin_url) score += 4
  if (p.website) score += 3

  // Source quality (max 20 points)
  const sourceScores: Record<string, number> = {
    referral: 20,
    linkedin: 15,
    website: 12,
    manual: 10,
    import: 8,
    api: 5
  }
  score += sourceScores[p.source] || 5

  // Status progression (max 25 points)
  const statusScores: Record<string, number> = {
    converted: 25,
    qualified: 20,
    contacted: 12,
    new: 5,
    lost: 0
  }
  score += statusScores[p.status] || 0

  // Engagement (max 15 points)
  if (p.last_contacted_at) {
    const daysSinceContact = Math.floor((Date.now() - new Date(p.last_contacted_at).getTime()) / (1000 * 60 * 60 * 24))
    if (daysSinceContact <= 7) score += 15
    else if (daysSinceContact <= 14) score += 10
    else if (daysSinceContact <= 30) score += 5
  }

  // Tags and notes (max 10 points)
  if (p.tags && p.tags.length > 0) score += Math.min(p.tags.length * 2, 5)
  if (p.notes && p.notes.length > 50) score += 5

  // Ensure score is between 0 and 100
  score = Math.min(Math.max(score, 0), 100)

  // Update prospect with new AI score
  await supabase
    .from('prospects')
    .update({ ai_score: score })
    .eq('id', prospectId)
    .eq('user_id', user.id)

  // Log AI action
  await supabase
    .from('ai_logs')
    .insert({
      user_id: user.id,
      action_type: 'scoring',
      input_data: { prospect_id: prospectId },
      output_data: { score },
      tokens_used: 0,
      model_used: 'internal_scoring'
    })

  revalidateTag('prospects', 'max')
  return { data: { score } }
}

export async function batchCalculateAIScores() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Non autorisé' }
  }

  const { data: prospects, error } = await supabase
    .from('prospects')
    .select('id')
    .eq('user_id', user.id)
    .is('ai_score', null)
    .limit(100)

  if (error) {
    return { error: error.message }
  }

  let updated = 0
  for (const prospect of prospects || []) {
    const result = await calculateAIScore(prospect.id)
    if (!result.error) updated++
  }

  return { data: { updated } }
}

export async function generateEmailSuggestion(prospectId: string, context: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Non autorisé' }
  }

  const { data: prospect } = await supabase
    .from('prospects')
    .select('*')
    .eq('id', prospectId)
    .eq('user_id', user.id)
    .single()

  if (!prospect) {
    return { error: 'Prospect non trouvé' }
  }

  const p = prospect as Prospect
  const firstName = p.first_name || 'Madame, Monsieur'
  const company = p.company || 'votre entreprise'

  let suggestion = { subject: '', content: '' }
  let modelUsed = 'template_engine'

  // Try to use OpenAI if available
  const openai = await getOpenAIClient(supabase, user.id)

  if (openai) {
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `Tu es un assistant commercial expert qui rédige des emails de prospection personnalisés et professionnels. 
            Ton but est d'obtenir un rendez-vous. Sois concis, persuasif et poli.
            Retourne la réponse au format JSON avec deux champs: "subject" et "content".`
          },
          {
            role: "user",
            content: `Rédige un email pour un prospect avec les infos suivantes:
            Prénom: ${firstName}
            Entreprise: ${company}
            Contexte/Type d'email: ${context}
            
            Informations sur notre produit: Workflow CRM est une solution tout-en-un pour gérer les ventes, le marketing et le service client.`
          }
        ],
        response_format: { type: "json_object" }
      });

      const content = completion.choices[0].message.content
      if (content) {
        suggestion = JSON.parse(content)
        modelUsed = 'gpt-4o'
      }
    } catch (error) {
      console.error('OpenAI Error:', error)
      // Fallback to templates below
    }
  }

  // Fallback templates if OpenAI failed or not available
  if (!suggestion.content) {
    const templates = {
      introduction: {
        subject: `${company} - Opportunité de collaboration`,
        content: `Bonjour ${firstName},

Je me permets de vous contacter car je pense que nos solutions pourraient répondre aux besoins de ${company}.

[Personnalisez votre message ici en fonction du contexte]

Seriez-vous disponible pour un échange de 15 minutes cette semaine ?

Cordialement,`
      },
      followup: {
        subject: `Suite à notre échange - ${company}`,
        content: `Bonjour ${firstName},

Je fais suite à notre précédent échange concernant ${company}.

[Ajoutez les points discutés et les prochaines étapes]

N'hésitez pas à me faire part de vos questions.

Cordialement,`
      },
      proposal: {
        subject: `Proposition commerciale - ${company}`,
        content: `Bonjour ${firstName},

Suite à notre conversation, veuillez trouver ci-joint notre proposition adaptée aux besoins de ${company}.

[Points clés de la proposition]

Je reste à votre disposition pour en discuter.

Cordialement,`
      }
    }
    suggestion = templates[context as keyof typeof templates] || templates.introduction
  }

  // Log AI action
  await supabase
    .from('ai_logs')
    .insert({
      user_id: user.id,
      action_type: 'email_suggestion',
      input_data: { prospect_id: prospectId, context },
      output_data: suggestion,
      tokens_used: 0,
      model_used: modelUsed
    })

  return { data: suggestion }
}

export async function getLeadRecommendations() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: [], error: 'Non autorisé' }
  }

  // Check subscription plan
  const { getUserPlan } = await import('@/lib/utils/subscription')
  const plan = await getUserPlan()

  if (plan && plan.name === 'Starter') {
    return { data: [], error: "Les recommandations d'IA ne sont pas disponibles avec votre plan actuel." }
  }

  // Get high-scoring prospects that haven't been contacted recently
  const { data, error } = await supabase
    .from('prospects')
    .select('*')
    .eq('user_id', user.id)
    .in('status', ['new', 'contacted', 'qualified'])
    .gte('ai_score', 50)
    .order('ai_score', { ascending: false })
    .limit(10)

  if (error) {
    return { data: [], error: error.message }
  }

  const recommendations = (data as Prospect[]).map(p => ({
    prospect: p,
    reason: getRecommendationReason(p),
    suggestedAction: getSuggestedAction(p)
  }))

  return { data: recommendations }
}

function getRecommendationReason(prospect: Prospect): string {
  if (prospect.ai_score && prospect.ai_score >= 80) {
    return 'Score IA élevé - Lead très qualifié'
  }
  if (prospect.source === 'referral') {
    return 'Recommandation - Taux de conversion plus élevé'
  }
  if (prospect.status === 'qualified') {
    return 'Prospect qualifié en attente de proposition'
  }
  if (!prospect.last_contacted_at) {
    return 'Nouveau prospect à contacter'
  }
  return 'Prospect prometteur à relancer'
}

function getSuggestedAction(prospect: Prospect): string {
  switch (prospect.status) {
    case 'new':
      return 'Envoyer un email de présentation'
    case 'contacted':
      return 'Planifier un appel de qualification'
    case 'qualified':
      return 'Préparer une proposition commerciale'
    default:
      return 'Mettre à jour les informations'
  }
}

export async function generateSocialPost(platform: string, topic: string, tone: 'professional' | 'funny' | 'educational' | 'aggressive') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Non autorisé' }

  let content = ''
  let modelUsed = 'social_gpt_4' // keeping the original log name or updating? let's stick to what we use.

  // Try OpenAI
  const openai = await getOpenAIClient(supabase, user.id)

  if (openai) {
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `Tu es un expert en réseaux sociaux. Rédige un post viral pour ${platform}.
            Ton style doit être ${tone}.
            Utilise des emojis appropriés et des hashtags pertinents.
            Le post doit être engageant et inciter à l'action.
            Ne mets pas de guillemets autour du post.`
          },
          {
            role: "user",
            content: `Sujet du post: ${topic}`
          }
        ]
      });

      content = completion.choices[0].message.content || ''
      modelUsed = 'gpt-4o'
    } catch (error) {
      console.error('OpenAI Error:', error)
      // Fallback
    }
  }

  // Fallback Mock Logic
  if (!content) {
    modelUsed = 'mock_template'
    const drafts: Record<string, string[]> = {
      linkedin: [
        `Heureux de partager nos dernières avancées sur ${topic} ! Notre équipe a travaillé dur pour apporter de la valeur à nos clients. 🚀 #Business #Innovation`,
        `Pourquoi ${topic} est essentiel en 2026 ? Voici 3 points clés à retenir... 👇 #Expertise #${topic.replace(/\s/g, '')}`,
        `Retour d'expérience sur ${topic} : ce que nous avons appris en accompagnant nos partenaires. 💼`
      ],
      twitter: [
        `Thread : Tout ce que vous devez savoir sur ${topic} en 30 secondes. 🧵✨ #${topic.replace(/\s/g, '')} #Tech`,
        `Alerte innovation : ${topic} change la donne. Prêt pour la suite ? 🔥`,
        `${topic} + Workflow CRM = Le duo gagnant pour votre productivité. 💪`
      ],
      instagram: [
        `Derrière les coulisses : Comment nous gérons ${topic} au quotidien. 📸✨ #Lifestyle #Work`,
        `Focus du jour : ${topic}. Dites-nous en commentaire ce que vous en pensez ! 💬❤️`,
        `Inspiré par ${topic} aujourd'hui. Quelle est votre prochaine étape ? 🚀`
      ],
      facebook: [
        `Saviez-vous que ${topic} peut vous aider à gagner 2h par jour ? On vous explique tout dans notre dernier article ! 📖`,
        `Aujourd'hui, on parle de ${topic}. Rejoignez la discussion dans notre groupe communautaire ! 👥`,
        `Petite victoire d'équipe sur ${topic} ! Bravo à tous. 🎉`
      ]
    }

    const platformDrafts = drafts[platform.toLowerCase()] || drafts.linkedin
    content = platformDrafts[Math.floor(Math.random() * platformDrafts.length)]
  }

  // Log AI action
  await supabase
    .from('ai_logs')
    .insert({
      user_id: user.id,
      action_type: 'social_generation',
      input_data: { platform, topic, tone },
      output_data: { content },
      model_used: modelUsed
    })

  return { data: { content } }
}
