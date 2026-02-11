'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidateTag } from 'next/cache'

// Types
export type WebhookEvent =
    | 'prospect.created'
    | 'prospect.updated'
    | 'prospect.deleted'
    | 'deal.created'
    | 'deal.updated'
    | 'deal.won'
    | 'deal.lost'
    | 'campaign.sent'
    | 'campaign.opened'
    | 'campaign.clicked'

export interface Webhook {
    id: string
    user_id: string
    name: string
    url: string
    events: WebhookEvent[]
    secret: string
    is_active: boolean
    created_at: string
    last_triggered_at: string | null
}

// Get all webhooks for user
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

    return { data: data as Webhook[], error: error?.message }
}

// Create a new webhook
export async function createWebhook(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Non autorisé' }
    }

    const eventsString = formData.get('events') as string
    const events = eventsString ? eventsString.split(',') as WebhookEvent[] : []

    // Generate a random secret
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    const secret = 'whsec_' + Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')

    const webhook = {
        user_id: user.id,
        name: formData.get('name') as string,
        url: formData.get('url') as string,
        events,
        secret,
        is_active: true
    }

    const { data, error } = await supabase
        .from('webhooks')
        .insert(webhook)
        .select()
        .single()

    if (error) {
        return { error: error.message }
    }

    revalidateTag('webhooks')
    return { data }
}

// Update webhook
export async function updateWebhook(id: string, formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Non autorisé' }
    }

    const eventsString = formData.get('events') as string
    const events = eventsString ? eventsString.split(',') as WebhookEvent[] : []

    const updates = {
        name: formData.get('name') as string,
        url: formData.get('url') as string,
        events,
        is_active: formData.get('is_active') === 'true'
    }

    const { data, error } = await supabase
        .from('webhooks')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

    if (error) {
        return { error: error.message }
    }

    revalidateTag('webhooks')
    return { data }
}

// Delete webhook
export async function deleteWebhook(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Non autorisé' }
    }

    const { error } = await supabase
        .from('webhooks')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

    if (error) {
        return { error: error.message }
    }

    revalidateTag('webhooks')
    return { success: true }
}

// Trigger webhook (internal use)
export async function triggerWebhook(userId: string, event: WebhookEvent, payload: Record<string, unknown>) {
    const supabase = await createClient()

    // Get all active webhooks for this user that listen to this event
    const { data: webhooks } = await supabase
        .from('webhooks')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .contains('events', [event])

    if (!webhooks || webhooks.length === 0) {
        return { triggered: 0 }
    }

    let triggered = 0

    for (const webhook of webhooks) {
        try {
            // Create signature
            const timestamp = Date.now()
            const signaturePayload = `${timestamp}.${JSON.stringify(payload)}`
            const encoder = new TextEncoder()
            const key = await crypto.subtle.importKey(
                'raw',
                encoder.encode(webhook.secret),
                { name: 'HMAC', hash: 'SHA-256' },
                false,
                ['sign']
            )
            const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(signaturePayload))
            const signatureHex = Array.from(new Uint8Array(signature), b => b.toString(16).padStart(2, '0')).join('')

            // Send webhook
            await fetch(webhook.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Webhook-Signature': `t=${timestamp},v1=${signatureHex}`,
                    'X-Webhook-Event': event
                },
                body: JSON.stringify({
                    event,
                    timestamp: new Date().toISOString(),
                    data: payload
                })
            })

            // Update last triggered
            await supabase
                .from('webhooks')
                .update({ last_triggered_at: new Date().toISOString() })
                .eq('id', webhook.id)

            triggered++
        } catch (error) {
            console.error(`Failed to trigger webhook ${webhook.id}:`, error)
        }
    }

    return { triggered }
}

// Regenerate webhook secret
export async function regenerateWebhookSecret(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Non autorisé' }
    }

    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    const secret = 'whsec_' + Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')

    const { data, error } = await supabase
        .from('webhooks')
        .update({ secret })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

    if (error) {
        return { error: error.message }
    }

    revalidateTag('webhooks')
    return { data }
}
