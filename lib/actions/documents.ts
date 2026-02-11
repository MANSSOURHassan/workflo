'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidateTag } from 'next/cache'

export async function getDocuments(params?: { prospectId?: string; dealId?: string; folderId?: string }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { data: [], error: 'Non autorisé' }
    }

    let query = supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id)

    if (params?.prospectId) {
        query = query.eq('prospect_id', params.prospectId)
    }
    if (params?.dealId) {
        query = query.eq('deal_id', params.dealId)
    }
    if (params?.folderId) {
        query = query.eq('folder_id', params.folderId)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
        return { data: [], error: error.message }
    }

    return { data }
}

export async function linkDocumentToEntity(documentId: string, entity: { type: 'prospect' | 'deal', id: string }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Non autorisé' }
    }

    const updateData: any = {}
    if (entity.type === 'prospect') updateData.prospect_id = entity.id
    if (entity.type === 'deal') updateData.deal_id = entity.id

    const { error } = await supabase
        .from('documents')
        .update(updateData)
        .eq('id', documentId)
        .eq('user_id', user.id)

    if (error) {
        return { error: error.message }
    }

    revalidateTag('documents', 'max')
    return { success: true }
}

export async function deleteDocument(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Non autorisé' }
    }

    // Also should delete from storage if applicable, but for now just DB
    const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

    if (error) {
        return { error: error.message }
    }

    revalidateTag('documents', 'max')
    return { success: true }
}
