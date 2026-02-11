'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidateTag } from 'next/cache'

export async function getTeamMembers() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { data: [], error: 'Non autorisé' }
    }

    const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('first_name', { ascending: true })

    if (error) {
        return { data: [], error: error.message }
    }

    return { data }
}

export async function assignProspect(prospectId: string, memberId: string | null) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Non autorisé' }
    }

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
    }

    revalidateTag('prospects', 'max')
    return { success: true }
}
