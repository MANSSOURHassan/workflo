'use server'

import { createClient } from '@/lib/supabase/server'

export type SearchResult = {
    type: 'prospect' | 'deal' | 'campaign'
    id: string
    title: string
    subtitle?: string
    status?: string
    url: string
}

export async function globalSearch(query: string): Promise<{ data?: SearchResult[]; error?: string }> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Non autorisé' }
    }

    if (!query || query.length < 2) {
        return { data: [] }
    }

    const searchTerm = `%${query}%`

    // Parallel search queries
    const [prospectsResult, dealsResult, campaignsResult] = await Promise.all([
        supabase
            .from('prospects')
            .select('id, first_name, last_name, company, email, status')
            .or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},company.ilike.${searchTerm},email.ilike.${searchTerm}`)
            .eq('user_id', user.id)
            .limit(5),

        supabase
            .from('deals')
            .select('id, name, value, status') // Assuming 'name' describes the deal, adjust if it's 'title'
            .ilike('name', searchTerm)
            .eq('user_id', user.id)
            .limit(5),

        supabase
            .from('campaigns')
            .select('id, name, status')
            .ilike('name', searchTerm)
            .eq('user_id', user.id)
            .limit(5)
    ])

    const results: SearchResult[] = []

    // Process Prospects
    if (prospectsResult.data) {
        prospectsResult.data.forEach(p => {
            const name = p.first_name && p.last_name
                ? `${p.first_name} ${p.last_name}`
                : p.company || p.email || 'Prospect sans nom'

            results.push({
                type: 'prospect',
                id: p.id,
                title: name,
                subtitle: p.email || p.company,
                status: p.status,
                url: `/dashboard/prospects/${p.id}`
            })
        })
    }

    // Process Deals
    if (dealsResult.data) {
        dealsResult.data.forEach(d => {
            results.push({
                type: 'deal',
                id: d.id,
                title: d.name || 'Opportunité',
                subtitle: d.value ? `${d.value} €` : undefined,
                status: d.status,
                url: `/dashboard/pipeline?deal=${d.id}` // Adjust URL as needed
            })
        })
    }

    // Process Campaigns
    if (campaignsResult.data) {
        campaignsResult.data.forEach(c => {
            results.push({
                type: 'campaign',
                id: c.id,
                title: c.name,
                status: c.status,
                url: `/dashboard/campaigns/${c.id}`
            })
        })
    }

    return { data: results }
}
