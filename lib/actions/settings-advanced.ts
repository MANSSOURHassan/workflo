'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidateTag } from 'next/cache'

// API Keys Actions

export async function getApiKeys() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { data: [], error: 'Non autorisé' }
    }

    const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    if (error && error.code === '42P01') {
        // Table doesn't exist yet, return empty list
        return { data: [], error: null }
    }

    return { data: data || [], error: error?.message }
}

export async function createApiKey(name: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Non autorisé' }
    }

    // Generate a random key
    const randomPart = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    const key = `wcrm_live_${randomPart}`

    const { data, error } = await supabase
        .from('api_keys')
        .insert({
            user_id: user.id,
            name,
            key
        })
        .select()
        .single()

    if (error) return { error: error.message }

    revalidateTag('api-keys')
    return { data }
}

export async function deleteApiKey(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Non autorisé' }

    const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

    if (error) return { error: error.message }

    revalidateTag('api-keys')
    return { success: true }
}

// Webhooks Actions

export async function getWebhooks() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { data: [], error: 'Non autorisé' }
    }

    const { data, error } = await supabase
        .from('webhooks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    if (error && error.code === '42P01') {
        return { data: [], error: null }
    }

    return { data: data || [], error: error?.message }
}

export async function createWebhook(data: { name: string, url: string, events: string[] }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Non autorisé' }

    // Generate secret
    const secret = `whsec_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`

    const { data: webhook, error } = await supabase
        .from('webhooks')
        .insert({
            user_id: user.id,
            name: data.name,
            url: data.url,
            events: data.events,
            secret
        })
        .select()
        .single()

    if (error) return { error: error.message }

    revalidateTag('webhooks')
    return { data: webhook }
}

export async function deleteWebhook(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Non autorisé' }

    const { error } = await supabase
        .from('webhooks')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

    if (error) return { error: error.message }

    revalidateTag('webhooks')
    return { success: true }
}

export async function toggleWebhook(id: string, isActive: boolean) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Non autorisé' }

    const { error } = await supabase
        .from('webhooks')
        .update({ is_active: isActive })
        .eq('id', id)
        .eq('user_id', user.id)

    if (error) return { error: error.message }

    revalidateTag('webhooks')
    return { success: true }
}
