'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidateTag } from 'next/cache'
import type { Prospect, ProspectStatus, ProspectSource } from '@/lib/types/database'
import { prospectSchema, isValidUUID } from '@/lib/security/validation'
import { logAuditAction } from '@/lib/security/audit'

export async function getProspects(params?: {
  search?: string
  status?: ProspectStatus
  source?: ProspectSource
  tags?: string[]
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: [], count: 0, error: 'Non autorisé' }
  }

  const page = params?.page || 1
  const limit = params?.limit || 25
  const offset = (page - 1) * limit

  try {
    let query = supabase
      .from('prospects')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)

    if (params?.search) {
      query = query.or(`email.ilike.%${params.search}%,first_name.ilike.%${params.search}%,last_name.ilike.%${params.search}%,company.ilike.%${params.search}%`)
    }

    if (params?.status) {
      query = query.eq('status', params.status)
    }

    if (params?.source) {
      query = query.eq('source', params.source)
    }

    if (params?.tags && params.tags.length > 0) {
      query = query.contains('tags', params.tags)
    }

    const sortBy = params?.sortBy || 'created_at'
    const sortOrder = params?.sortOrder || 'desc'
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    query = query.range(offset, offset + limit - 1)

    const { data: prospectsData, count, error } = await query

    if (error) {
      console.error('Error fetching prospects:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return { 
        data: [], 
        count: 0, 
        error: `Erreur base de données: ${error.message}.` 
      }
    }

    // Join with team members in memory to avoid "relationship not found" schema errors
    const prospects = (prospectsData as Prospect[]) || []
    
    try {
      const assignedIds = [...new Set(prospects.map(p => p.assigned_to).filter(Boolean))] as string[]
      
      if (assignedIds.length > 0) {
        const { data: members } = await supabase
          .from('team_members')
          .select('id, first_name, last_name')
          .in('id', assignedIds)

        if (members) {
          prospects.forEach(p => {
            if (p.assigned_to) {
              p.assigned_to_member = members.find(m => m.id === p.assigned_to)
            }
          })
        }
      }
    } catch (e) {
      console.warn('Could not join with team_members:', e)
      // We continue anyway, prospects will just not have worker names
    }

    return { data: prospects, count: count || 0 }
  } catch (err) {
    console.error('Exception in getProspects:', err)
    return { data: [], count: 0, error: 'Table prospects non trouvée ou erreur de connexion' }
  }
}

export async function getProspect(id: string) {
  // Validate UUID format to prevent injection
  if (!isValidUUID(id)) {
    return { data: null, error: 'ID invalide' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: 'Non autorisé' }
  }

  try {
    const { data, error } = await supabase
      .from('prospects')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error) {
      console.error('Error fetching prospect:', error)
      return { 
        data: null, 
        error: `Erreur base de données: ${error.message}. Assurez-vous que la table 'prospects' existe.` 
      }
    }

    return { data: data as Prospect | null }
  } catch (err) {
    console.error('Exception in getProspect:', err)
    return { data: null, error: 'Prospect non trouvé' }
  }
}

export async function createProspect(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Non autorisé' }
  }

  // Check subscription limits (Optimized: passing client & user)
  const { checkLimit } = await import('@/lib/utils/subscription')
  const limitCheck = await checkLimit('prospects', supabase, user)
  if (!limitCheck.allowed) {
    return { error: limitCheck.error }
  }

  // Validate input with Zod
  const rawData = Object.fromEntries(formData.entries())
  if (rawData.tags) {
    (rawData as any).tags = (rawData.tags as string).split(',').map(t => t.trim()).filter(Boolean)
  } else {
    (rawData as any).tags = []
  }

  const validation = prospectSchema.safeParse(rawData)
  if (!validation.success) {
    return { error: 'Validation échouée: ' + validation.error.errors.map(e => e.message).join(', ') }
  }

  const prospect = {
    ...validation.data,
    user_id: user.id,
    email: validation.data.email.toLowerCase(),
  }

  const { data, error } = await supabase
    .from('prospects')
    .insert(prospect)
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  // Log audit (Non-blocking for speed)
  logAuditAction({
    action: 'prospect.create',
    entityType: 'prospect',
    entityId: data.id,
    newData: data,
    supabaseClient: supabase,
    userObj: user
  })

  revalidateTag('prospects', 'max')
  return { data }
}

export async function updateProspect(id: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Non autorisé' }
  }

  const rawData = Object.fromEntries(formData.entries())
  if (rawData.tags) {
    (rawData as any).tags = (rawData.tags as string).split(',').map(t => t.trim()).filter(Boolean)
  }

  const validation = prospectSchema.partial().safeParse(rawData)
  if (!validation.success) {
    return { error: 'Validation échouée: ' + validation.error.errors.map(e => e.message).join(', ') }
  }

  // Get old data for audit
  const { data: oldData } = await supabase
    .from('prospects')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  const { data, error } = await supabase
    .from('prospects')
    .update(validation.data)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  // Log audit (Non-blocking for speed)
  logAuditAction({
    action: 'prospect.update',
    entityType: 'prospect',
    entityId: id,
    oldData,
    newData: data,
    supabaseClient: supabase,
    userObj: user
  })

  revalidateTag('prospects', 'max')
  return { data }
}

export async function deleteProspect(id: string) {
  // Validate UUID format
  if (!isValidUUID(id)) {
    return { error: 'ID invalide' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Non autorisé' }
  }

  // Get old data for audit
  const { data: oldData } = await supabase
    .from('prospects')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  const { error } = await supabase
    .from('prospects')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  // Log audit (Non-blocking for speed)
  logAuditAction({
    action: 'prospect.delete',
    entityType: 'prospect',
    entityId: id,
    oldData,
    supabaseClient: supabase,
    userObj: user
  })

  revalidateTag('prospects', 'max')
  return { success: true }
}

export async function deleteMultipleProspects(ids: string[]) {
  // Validate all UUIDs
  if (!ids.every(isValidUUID)) {
    return { error: 'IDs invalides' }
  }

  // Limit batch size
  if (ids.length > 100) {
    return { error: 'Maximum 100 prospects par suppression' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Non autorisé' }
  }

  const { error } = await supabase
    .from('prospects')
    .delete()
    .in('id', ids)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  // Log deletion action
  await logAuditAction({
    action: 'prospect.delete_bulk',
    entityType: 'prospect',
    entityId: ids.join(','),
    description: `Suppression de ${ids.length} prospect(s)`,
    metadata: { ids }
  })

  revalidateTag('prospects', 'max')
  return { success: true }
}

export async function exportProspects(format: 'csv' | 'excel') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Non autorisé' }
  }

  const { data, error } = await supabase
    .from('prospects')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return { error: error.message }
  }

  // Log export action
  await logAuditAction({
    action: 'prospect.export',
    entityType: 'prospect',
    entityId: 'bulk',
    description: `Export de prospects au format ${format}`,
    metadata: { format, count: data.length }
  })

  // Generate CSV content
  if (format === 'csv') {
    const headers = ['Email', 'Prénom', 'Nom', 'Entreprise', 'Poste', 'Téléphone', 'Status', 'Source', 'Score IA', 'Date création']
    const rows = (data as Prospect[]).map(p => [
      p.email,
      p.first_name || '',
      p.last_name || '',
      p.company || '',
      p.job_title || '',
      p.phone || '',
      p.status,
      p.source,
      p.ai_score?.toString() || '',
      new Date(p.created_at).toLocaleDateString('fr-FR')
    ])

    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
    return { data: csvContent, filename: `prospects_${new Date().toISOString().split('T')[0]}.csv` }
  }

  return { data, filename: `prospects_${new Date().toISOString().split('T')[0]}.json` }
}

export async function getProspectStats() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Non autorisé' }
  }

  try {
    const { data, error } = await supabase
      .from('prospects')
      .select('status, ai_score, created_at')
      .eq('user_id', user.id)

    if (error) {
      console.error('Error fetching prospect stats:', error)
      return { data: { total: 0, new: 0, contacted: 0, qualified: 0, converted: 0, lost: 0, thisMonth: 0, avgAiScore: 0 } }
    }

    const prospects = (data as Pick<Prospect, 'status' | 'ai_score' | 'created_at'>[]) || []
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const stats = {
      total: prospects.length,
      new: prospects.filter(p => p.status === 'new').length,
      contacted: prospects.filter(p => p.status === 'contacted').length,
      qualified: prospects.filter(p => p.status === 'qualified').length,
      converted: prospects.filter(p => p.status === 'converted').length,
      lost: prospects.filter(p => p.status === 'lost').length,
      thisMonth: prospects.filter(p => new Date(p.created_at) >= startOfMonth).length,
      avgAiScore: prospects.filter(p => p.ai_score !== null).length > 0 
        ? prospects.filter(p => p.ai_score !== null).reduce((acc, p) => acc + (p.ai_score || 0), 0) /
          (prospects.filter(p => p.ai_score !== null).length || 1)
        : 0
    }

    return { data: stats }
  } catch (err) {
    console.error('Exception in getProspectStats:', err)
    return { data: { total: 0, new: 0, contacted: 0, qualified: 0, converted: 0, lost: 0, thisMonth: 0, avgAiScore: 0 } }
  }
}
