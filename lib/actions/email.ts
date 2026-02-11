'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { EmailIntegration, SyncedEmail, EmailContact } from '@/lib/types/email'

// =====================================================
// RÉCUPÉRER LES INTÉGRATIONS EMAIL
// =====================================================
export async function getEmailIntegrations() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'Non authentifié', integrations: [] }
    }

    const { data, error } = await supabase
        .from('email_integrations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Erreur récupération intégrations:', error)
        return { error: error.message, integrations: [] }
    }

    return { integrations: data as EmailIntegration[], error: null }
}

// =====================================================
// AJOUTER UNE INTÉGRATION EMAIL (après OAuth)
// =====================================================
export async function addEmailIntegration(input: {
    provider: 'gmail' | 'outlook'
    email: string
    access_token: string
    refresh_token: string | null
    expires_in: number | null
}) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'Non authentifié', integration: null }
    }

    const token_expires_at = input.expires_in
        ? new Date(Date.now() + input.expires_in * 1000).toISOString()
        : null

    const { data, error } = await supabase
        .from('email_integrations')
        .upsert({
            user_id: user.id,
            provider: input.provider,
            email: input.email,
            access_token: input.access_token,
            refresh_token: input.refresh_token,
            token_expires_at,
            is_active: true,
            sync_status: 'pending'
        }, {
            onConflict: 'user_id,provider,email'
        })
        .select()
        .single()

    if (error) {
        console.error('Erreur ajout intégration:', error)
        return { error: error.message, integration: null }
    }

    revalidatePath('/dashboard/email')
    revalidatePath('/dashboard/integrations')

    return { integration: data as EmailIntegration, error: null }
}

// =====================================================
// SUPPRIMER UNE INTÉGRATION EMAIL
// =====================================================
export async function removeEmailIntegration(integrationId: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'Non authentifié' }
    }

    const { error } = await supabase
        .from('email_integrations')
        .delete()
        .eq('id', integrationId)
        .eq('user_id', user.id)

    if (error) {
        console.error('Erreur suppression intégration:', error)
        return { error: error.message }
    }

    revalidatePath('/dashboard/email')
    revalidatePath('/dashboard/integrations')

    return { error: null }
}

// =====================================================
// RÉCUPÉRER LES EMAILS SYNCHRONISÉS
// =====================================================
export async function getSyncedEmails(options?: {
    folder?: string
    limit?: number
    offset?: number
    unreadOnly?: boolean
}) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'Non authentifié', emails: [], total: 0 }
    }

    let query = supabase
        .from('synced_emails')
        .select('*, email_integrations!inner(provider, email)', { count: 'exact' })
        .eq('user_id', user.id)

    if (options?.folder) {
        query = query.eq('folder', options.folder)
    }

    if (options?.unreadOnly) {
        query = query.eq('is_read', false)
    }

    query = query
        .order('received_at', { ascending: false })
        .range(
            options?.offset || 0,
            (options?.offset || 0) + (options?.limit || 50) - 1
        )

    const { data, error, count } = await query

    if (error) {
        console.error('Erreur récupération emails:', error)
        return { error: error.message, emails: [], total: 0 }
    }

    return {
        emails: data as (SyncedEmail & { email_integrations: { provider: string, email: string } })[],
        total: count || 0,
        error: null
    }
}

// =====================================================
// MARQUER UN EMAIL COMME LU
// =====================================================
export async function markEmailAsRead(emailId: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'Non authentifié' }
    }

    const { error } = await supabase
        .from('synced_emails')
        .update({ is_read: true })
        .eq('id', emailId)
        .eq('user_id', user.id)

    if (error) {
        console.error('Erreur marquage email lu:', error)
        return { error: error.message }
    }

    revalidatePath('/dashboard/email')
    return { error: null }
}

// =====================================================
// TOGGLE STAR SUR UN EMAIL
// =====================================================
export async function toggleEmailStar(emailId: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'Non authentifié' }
    }

    // D'abord récupérer l'état actuel
    const { data: email } = await supabase
        .from('synced_emails')
        .select('is_starred')
        .eq('id', emailId)
        .eq('user_id', user.id)
        .single()

    if (!email) {
        return { error: 'Email non trouvé' }
    }

    const { error } = await supabase
        .from('synced_emails')
        .update({ is_starred: !email.is_starred })
        .eq('id', emailId)
        .eq('user_id', user.id)

    if (error) {
        console.error('Erreur toggle star:', error)
        return { error: error.message }
    }

    revalidatePath('/dashboard/email')
    return { error: null, isStarred: !email.is_starred }
}

// =====================================================
// RÉCUPÉRER LES CONTACTS EMAIL
// =====================================================
export async function getEmailContacts(options?: {
    limit?: number
    offset?: number
    search?: string
}) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'Non authentifié', contacts: [], total: 0 }
    }

    let query = supabase
        .from('email_contacts')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)

    if (options?.search) {
        query = query.or(`email.ilike.%${options.search}%,name.ilike.%${options.search}%`)
    }

    query = query
        .order('email_count', { ascending: false })
        .range(
            options?.offset || 0,
            (options?.offset || 0) + (options?.limit || 50) - 1
        )

    const { data, error, count } = await query

    if (error) {
        console.error('Erreur récupération contacts:', error)
        return { error: error.message, contacts: [], total: 0 }
    }

    return {
        contacts: data as EmailContact[],
        total: count || 0,
        error: null
    }
}

// =====================================================
// LIER UN CONTACT EMAIL À UN PROSPECT
// =====================================================
export async function linkContactToProspect(contactId: string, prospectId: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'Non authentifié' }
    }

    const { error } = await supabase
        .from('email_contacts')
        .update({ prospect_id: prospectId })
        .eq('id', contactId)
        .eq('user_id', user.id)

    if (error) {
        console.error('Erreur liaison contact-prospect:', error)
        return { error: error.message }
    }

    revalidatePath('/dashboard/email')
    return { error: null }
}

// =====================================================
// STATISTIQUES EMAIL
// =====================================================
export async function getEmailStats() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return {
            error: 'Non authentifié',
            stats: {
                totalEmails: 0,
                unreadEmails: 0,
                starredEmails: 0,
                opportunityEmails: 0,
                totalContacts: 0,
                activeIntegrations: 0
            }
        }
    }

    // Récupérer les stats en parallèle
    const [
        integrationsResult,
        emailsResult,
        unreadResult,
        starredResult,
        opportunityResult,
        contactsResult
    ] = await Promise.all([
        supabase.from('email_integrations').select('id', { count: 'exact' }).eq('user_id', user.id).eq('is_active', true),
        supabase.from('synced_emails').select('id', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('synced_emails').select('id', { count: 'exact' }).eq('user_id', user.id).eq('is_read', false),
        supabase.from('synced_emails').select('id', { count: 'exact' }).eq('user_id', user.id).eq('is_starred', true),
        supabase.from('synced_emails').select('id', { count: 'exact' }).eq('user_id', user.id).not('ai_opportunity_score', 'is', null).gte('ai_opportunity_score', 70),
        supabase.from('email_contacts').select('id', { count: 'exact' }).eq('user_id', user.id)
    ])

    return {
        error: null,
        stats: {
            activeIntegrations: integrationsResult.count || 0,
            totalEmails: emailsResult.count || 0,
            unreadEmails: unreadResult.count || 0,
            starredEmails: starredResult.count || 0,
            opportunityEmails: opportunityResult.count || 0,
            totalContacts: contactsResult.count || 0
        }
    }
}
