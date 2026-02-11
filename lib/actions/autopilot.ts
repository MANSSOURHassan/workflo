'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface AutopilotRule {
    id: string
    name: string
    description: string | null
    trigger_type: 'event' | 'schedule' | 'condition' | 'webhook'
    trigger_config: any
    conditions: any[]
    actions: any[]
    is_active: boolean
    stats: {
        sent: number
        opened: number
        clicked: number
        triggered: number
        success: number
        failed: number
    }
}

export async function getAutomations() {
    const supabase = await createClient()

    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: 'Non authentifié' }

        const { data, error } = await supabase
            .from('autopilot_rules')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

        if (error) throw error

        return { data: data as AutopilotRule[] }
    } catch (error: any) {
        console.error('Error fetching automations:', error)
        return { error: error.message }
    }
}

export async function createAutomation(data: {
    name: string
    description?: string
    trigger_type: string
    trigger_config?: any
    conditions?: any[]
    actions?: any[]
    is_active?: boolean
}) {
    const supabase = await createClient()

    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: 'Non authentifié' }

        const { data: newRule, error } = await supabase
            .from('autopilot_rules')
            .insert({
                user_id: user.id,
                name: data.name,
                description: data.description,
                trigger_type: data.trigger_type,
                trigger_config: data.trigger_config || {},
                conditions: data.conditions || [],
                actions: data.actions || [],
                is_active: data.is_active ?? true,
                stats: { sent: 0, opened: 0, clicked: 0, triggered: 0, success: 0, failed: 0 }
            })
            .select()
            .single()

        if (error) throw error

        revalidatePath('/dashboard/autopilot')
        return { data: newRule }
    } catch (error: any) {
        console.error('Error creating automation:', error)
        return { error: error.message }
    }
}

export async function updateAutomation(id: string, data: Partial<AutopilotRule>) {
    const supabase = await createClient()

    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: 'Non authentifié' }

        const { error } = await supabase
            .from('autopilot_rules')
            .update(data)
            .eq('id', id)
            .eq('user_id', user.id)

        if (error) throw error

        revalidatePath('/dashboard/autopilot')
        return { success: true }
    } catch (error: any) {
        console.error('Error updating automation:', error)
        return { error: error.message }
    }
}

export async function deleteAutomation(id: string) {
    const supabase = await createClient()

    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: 'Non authentifié' }

        const { error } = await supabase
            .from('autopilot_rules')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id)

        if (error) throw error

        revalidatePath('/dashboard/autopilot')
        return { success: true }
    } catch (error: any) {
        console.error('Error deleting automation:', error)
        return { error: error.message }
    }
}
