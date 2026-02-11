'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface SocialStats {
    id: string
    date: string
    account_id: string
    followers_count: number
    impressions: number
    reach: number
    engagement_rate: number
    likes: number
    comments: number
    shares: number
    clicks: number
}

// Récupérer les statistiques d'un compte sur une période
export async function getSocialStats(accountId: string, days: number = 30) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('social_analytics')
        .select('*')
        .eq('account_id', accountId)
        .gte('date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
        .order('date', { ascending: true })

    if (error) {
        console.error('Error fetching social stats:', error)
        return { error: error.message }
    }

    // Si pas de données, on génère des mocks pour la démo instantanée
    if (!data || data.length === 0) {
        await supabase.rpc('generate_mock_social_analytics', { p_account_id: accountId })
        // On refetch
        const { data: newData } = await supabase
            .from('social_analytics')
            .select('*')
            .eq('account_id', accountId)
            .order('date', { ascending: true })

        return { data: newData as SocialStats[] }
    }

    return { data: data as SocialStats[] }
}

// Récupérer les stats globales de tous les comptes
export async function getGlobalStats() {
    const supabase = await createClient()

    // On récupère tous les comptes de l'utilisateur
    const { data: accounts } = await supabase
        .from('social_accounts')
        .select('id')

    if (!accounts || accounts.length === 0) return { data: [] }

    const accountIds = accounts.map(a => a.id)

    // On récupère les stats pour ces comptes
    const { data, error } = await supabase
        .from('social_analytics')
        .select('*')
        .in('account_id', accountIds)
        .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('date', { ascending: true })

    if (error) return { error: error.message }

    return { data: data as SocialStats[] }
}

// Déclencher une mise à jour manuelle des stats (pour la démo)
export async function refreshStats(accountId: string) {
    const supabase = await createClient()
    await supabase.rpc('generate_mock_social_analytics', { p_account_id: accountId })
    revalidatePath('/dashboard/social')
    return { success: true }
}
