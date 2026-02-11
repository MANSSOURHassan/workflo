'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidateTag } from 'next/cache'

export async function getSequences() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { data: [], error: 'Non autorisé' }
    }

    const { data, error } = await supabase
        .from('automated_sequences')
        .select(`
            *,
            steps:sequence_steps(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    if (error) {
        return { data: [], error: error.message }
    }

    return { data }
}

export async function createSequence(name: string, description?: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Non autorisé' }
    }

    const { data, error } = await supabase
        .from('automated_sequences')
        .insert({
            user_id: user.id,
            name,
            description,
            is_active: false
        })
        .select()
        .single()

    if (error) {
        return { error: error.message }
    }

    revalidateTag('sequences', 'max')
    return { data }
}

export async function addSequenceStep(sequenceId: string, step: {
    step_type: 'email' | 'delay' | 'task'
    delay_days: number
    template_id?: string
    subject?: string
    content?: string
}) {
    const supabase = await createClient()

    // Get current steps to determine order
    const { data: steps } = await supabase
        .from('sequence_steps')
        .select('step_order')
        .eq('sequence_id', sequenceId)
        .order('step_order', { ascending: false })
        .limit(1)

    const nextOrder = (steps && steps.length > 0 ? steps[0].step_order : 0) + 1

    const { data, error } = await supabase
        .from('sequence_steps')
        .insert({
            sequence_id: sequenceId,
            step_order: nextOrder,
            ...step
        })
        .select()
        .single()

    if (error) {
        return { error: error.message }
    }

    revalidateTag('sequences', 'max')
    return { data }
}

export async function enrollProspect(sequenceId: string, prospectId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Non autorisé' }
    }

    const { data, error } = await supabase
        .from('sequence_enrollments')
        .insert({
            sequence_id: sequenceId,
            prospect_id: prospectId,
            status: 'active',
            current_step_order: 1
        })
        .select()
        .single()

    if (error) {
        return { error: error.message }
    }

    // Log activity
    await supabase.from('audit_logs').insert({
        user_id: user.id,
        action_type: 'sequence_enrolled',
        entity_type: 'prospect',
        entity_id: prospectId,
        description: `Prospect inscrit à une séquence automatisée`
    })

    revalidateTag('prospects', 'max')
    return { data }
}
