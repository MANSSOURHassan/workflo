'use server'

import { createClient } from '@/lib/supabase/server'
import type { Prospect } from '@/lib/types/database'

// Check for duplicate prospects by email
export async function checkDuplicates(emails: string[]) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { duplicates: [], error: 'Non autorisé' }
    }

    const { data, error } = await supabase
        .from('prospects')
        .select('email')
        .eq('user_id', user.id)
        .in('email', emails.map(e => e.toLowerCase()))

    if (error) {
        return { duplicates: [], error: error.message }
    }

    const duplicates = data?.map(p => p.email) || []
    return { duplicates }
}

// Deduplicate prospects in database
export async function deduplicateProspects() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Non autorisé', merged: 0 }
    }

    // Find duplicates by email
    const { data: prospects, error: fetchError } = await supabase
        .from('prospects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

    if (fetchError) {
        return { error: fetchError.message, merged: 0 }
    }

    // Group by email
    const emailGroups = new Map<string, Prospect[]>()
    for (const prospect of prospects as Prospect[]) {
        const email = prospect.email.toLowerCase()
        if (!emailGroups.has(email)) {
            emailGroups.set(email, [])
        }
        emailGroups.get(email)!.push(prospect)
    }

    let merged = 0
    const duplicatesToDelete: string[] = []

    for (const [email, group] of emailGroups) {
        if (group.length > 1) {
            // Keep the first one (oldest), merge data from others
            const primary = group[0]
            const duplicates = group.slice(1)

            // Merge data - keep non-null values from newer records
            const mergedData: Partial<Prospect> = {}

            for (const dup of duplicates) {
                if (!primary.company && dup.company) mergedData.company = dup.company
                if (!primary.job_title && dup.job_title) mergedData.job_title = dup.job_title
                if (!primary.phone && dup.phone) mergedData.phone = dup.phone
                if (!primary.website && dup.website) mergedData.website = dup.website
                if (!primary.linkedin_url && dup.linkedin_url) mergedData.linkedin_url = dup.linkedin_url
                if (!primary.notes && dup.notes) mergedData.notes = dup.notes

                // Merge tags
                if (dup.tags && dup.tags.length > 0) {
                    const existingTags = primary.tags || []
                    mergedData.tags = [...new Set([...existingTags, ...dup.tags])]
                }

                // Keep higher AI score
                if (dup.ai_score && (!primary.ai_score || dup.ai_score > primary.ai_score)) {
                    mergedData.ai_score = dup.ai_score
                }

                duplicatesToDelete.push(dup.id)
            }

            // Update primary with merged data
            if (Object.keys(mergedData).length > 0) {
                await supabase
                    .from('prospects')
                    .update(mergedData)
                    .eq('id', primary.id)
            }

            merged += duplicates.length
        }
    }

    // Delete duplicates
    if (duplicatesToDelete.length > 0) {
        const { error: deleteError } = await supabase
            .from('prospects')
            .delete()
            .in('id', duplicatesToDelete)

        if (deleteError) {
            return { error: deleteError.message, merged: 0 }
        }
    }

    return { merged, duplicatesRemoved: duplicatesToDelete.length }
}

// Find similar prospects (potential duplicates)
export async function findSimilarProspects(prospectId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { similar: [], error: 'Non autorisé' }
    }

    // Get the prospect
    const { data: prospect, error: prospectError } = await supabase
        .from('prospects')
        .select('*')
        .eq('id', prospectId)
        .eq('user_id', user.id)
        .single()

    if (prospectError || !prospect) {
        return { similar: [], error: 'Prospect non trouvé' }
    }

    const p = prospect as Prospect
    const similar: Prospect[] = []

    // Find by similar email domain
    const emailDomain = p.email.split('@')[1]
    if (emailDomain) {
        const { data: domainMatches } = await supabase
            .from('prospects')
            .select('*')
            .eq('user_id', user.id)
            .neq('id', prospectId)
            .ilike('email', `%@${emailDomain}`)
            .limit(10)

        if (domainMatches) {
            similar.push(...(domainMatches as Prospect[]))
        }
    }

    // Find by company name
    if (p.company) {
        const { data: companyMatches } = await supabase
            .from('prospects')
            .select('*')
            .eq('user_id', user.id)
            .neq('id', prospectId)
            .ilike('company', `%${p.company}%`)
            .limit(10)

        if (companyMatches) {
            for (const match of companyMatches as Prospect[]) {
                if (!similar.find(s => s.id === match.id)) {
                    similar.push(match)
                }
            }
        }
    }

    return { similar: similar.slice(0, 10) }
}

// Merge two prospects
export async function mergeProspects(primaryId: string, secondaryId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Non autorisé' }
    }

    // Get both prospects
    const { data: prospects, error } = await supabase
        .from('prospects')
        .select('*')
        .eq('user_id', user.id)
        .in('id', [primaryId, secondaryId])

    if (error || !prospects || prospects.length !== 2) {
        return { error: 'Prospects non trouvés' }
    }

    const primary = prospects.find(p => p.id === primaryId) as Prospect
    const secondary = prospects.find(p => p.id === secondaryId) as Prospect

    if (!primary || !secondary) {
        return { error: 'Prospects non trouvés' }
    }

    // Merge secondary into primary
    const mergedData: Partial<Prospect> = {}

    if (!primary.company && secondary.company) mergedData.company = secondary.company
    if (!primary.job_title && secondary.job_title) mergedData.job_title = secondary.job_title
    if (!primary.phone && secondary.phone) mergedData.phone = secondary.phone
    if (!primary.website && secondary.website) mergedData.website = secondary.website
    if (!primary.linkedin_url && secondary.linkedin_url) mergedData.linkedin_url = secondary.linkedin_url

    // Merge notes
    if (secondary.notes) {
        mergedData.notes = primary.notes
            ? `${primary.notes}\n\n--- Fusionné depuis ${secondary.email} ---\n${secondary.notes}`
            : secondary.notes
    }

    // Merge tags
    const allTags = [...(primary.tags || []), ...(secondary.tags || [])]
    mergedData.tags = [...new Set(allTags)]

    // Keep higher AI score
    if (secondary.ai_score && (!primary.ai_score || secondary.ai_score > primary.ai_score)) {
        mergedData.ai_score = secondary.ai_score
    }

    // Update primary
    if (Object.keys(mergedData).length > 0) {
        await supabase
            .from('prospects')
            .update(mergedData)
            .eq('id', primaryId)
    }

    // Delete secondary
    await supabase
        .from('prospects')
        .delete()
        .eq('id', secondaryId)

    return { success: true, merged: primary.email }
}
