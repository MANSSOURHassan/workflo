'use server'

import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

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
            console.log('OpenAI: Using API key from user integrations')
            return new OpenAI({ apiKey: integration.api_key })
        }

        // Fallback to environment variable
        if (process.env.OPENAI_API_KEY) {
            console.log('OpenAI: Using API key from process.env (starts with ' + process.env.OPENAI_API_KEY.substring(0, 7) + '...)')
            return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
        }

        console.warn('OpenAI: No API key found anywhere')
        return null
    } catch (error) {
        console.error('Error fetching OpenAI integration:', error)
        if (process.env.OPENAI_API_KEY) {
            return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
        }
        return null
    }
}

export async function askCopilot(
    message: string,
    history: { role: 'user' | 'assistant', content: string }[],
    currentPage?: string
) {
    console.log('--- Copilot Action Start ---')
    console.log('Message:', message)
    console.log('Page:', currentPage)

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        console.error('Copilot Error: No user authenticated')
        return { error: 'Non autorisé' }
    }

    const openai = await getOpenAIClient(supabase, user.id)

    if (!openai) {
        console.error('Copilot Error: OpenAI client could not be initialized')
        return { error: 'OpenAI n\'est pas configuré. Veuillez vérifier votre clé API.' }
    }

    try {
        // Fetch statistics for context - with safe defaults if tables fail
        let stats = { prospects: 0, deals: 0, campaigns: 0 }
        try {
            const [p, d, c] = await Promise.all([
                supabase.from('prospects').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
                supabase.from('deals').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
                supabase.from('campaigns').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
            ])
            stats = {
                prospects: p.count || 0,
                deals: d.count || 0,
                campaigns: c.count || 0
            }
        } catch (err) {
            console.warn('Copilot: Could not fetch stats context (tables might be missing)', err)
        }

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

        console.log('Copilot: Calling OpenAI Chat Completion...')
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                ...history.map(m => ({ role: m.role, content: m.content })),
                { role: "user", content: message }
            ],
            temperature: 0.7,
            max_tokens: 1000,
        })

        const aiMessage = response.choices[0].message.content
        console.log('Copilot: Success! Response received.')

        // Log the interaction - ignore failures if log table is missing
        try {
            await supabase.from('ai_logs').insert({
                user_id: user.id,
                action_type: 'copilot_chat',
                input_data: { message, history_length: history.length, page: currentPage },
                output_data: { response: aiMessage },
                model_used: 'gpt-4o-mini'
            })
        } catch (e) { }

        return { data: aiMessage }
    } catch (error: any) {
        console.error('Copilot Execution Error:', error)
        return { error: `Erreur IA : ${error.message || 'La communication avec OpenAI a échoué.'}` }
    }
}

export async function getAIAdvice() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Non autorisé' }

    const openai = await getOpenAIClient(supabase, user.id)

    if (!openai) {
        return { data: "💡 Conseil : Vérifiez que votre clé OpenAI est bien configurée pour obtenir des conseils." }
    }

    try {
        let prospectsCount = 0
        try {
            const { count } = await supabase.from('prospects').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
            prospectsCount = count || 0
        } catch (e) { }

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: "Tu es un expert en CRM. Donne un conseil très court (un tweet maximum) à un utilisateur de CRM pour améliorer sa productivité. Réponds en français."
                },
                {
                    role: "user",
                    content: `L'utilisateur a ${prospectsCount} prospects.`
                }
            ],
            max_tokens: 100,
        })

        return { data: response.choices[0].message.content }
    } catch (error) {
        console.error('AIAdvice Error:', error)
        return { data: "💡 Conseil : Prenez le temps de qualifier vos nouveaux prospects chaque matin." }
    }
}
