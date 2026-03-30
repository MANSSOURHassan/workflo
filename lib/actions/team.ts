'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidateTag } from 'next/cache'

export async function getTeamMembers() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { data: [], error: 'Non autorisé' }
    }

    try {
        const { data, error } = await supabase
            .from('team_members')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .order('first_name', { ascending: true })

        if (error) {
            console.error('Error fetching team members:', error)
            return { data: [], error: error.message }
        }

        return { data }
    } catch (err) {
        console.error('Exception in getTeamMembers:', err)
        return { data: [], error: 'Table team_members non trouvée' }
    }
}

export async function assignProspect(prospectId: string, memberId: string | null) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Non autorisé' }
    }

    try {
        const { error } = await supabase
            .from('prospects')
            .update({ assigned_to: memberId })
            .eq('id', prospectId)
            .eq('user_id', user.id)

        if (error) {
            return { error: error.message }
        }

        // Log activity
        if (memberId) {
            try {
                const { data: member } = await supabase
                    .from('team_members')
                    .select('first_name, last_name')
                    .eq('id', memberId)
                    .single()

                const memberName = member ? `${member.first_name} ${member.last_name}` : 'un membre'

                await supabase.from('audit_logs').insert({
                    user_id: user.id,
                    action_type: 'prospect_assigned',
                    entity_type: 'prospect',
                    entity_id: prospectId,
                    description: `Prospect assigné à ${memberName}`
                })
            } catch (innerErr) {
                console.warn('Logging assignment failed (likely missing audit_logs or team_members):', innerErr)
            }
        }

        revalidateTag('prospects', 'max')
        return { success: true }
    } catch (err) {
        console.error('Exception in assignProspect:', err)
        return { error: 'Erreur lors de l\'assignation' }
    }
}
