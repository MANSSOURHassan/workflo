'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidateTag } from 'next/cache'
import type { Prospect, ProspectStatus, ProspectSource } from '@/lib/types/database'
import { validateProspectInput, sanitizeForDb, isValidUUID } from '@/lib/security/validation'

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

  let query = supabase
    .from('prospects')
    .select('*, assigned_to_member:team_members(id, first_name, last_name)', { count: 'exact' })
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

  const { data, count, error } = await query

  return { data: data as Prospect[], count: count || 0, error: error?.message }
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

  const { data, error } = await supabase
    .from('prospects')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  return { data: data as Prospect | null, error: error?.message }
}

export async function createProspect(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Non autorisé' }
  }

  // Check subscription limits
  const { checkLimit } = await import('@/lib/utils/subscription')
  const limitCheck = await checkLimit('prospects')
  if (!limitCheck.allowed) {
    return { error: limitCheck.error }
  }

  // Validate input
  const validation = validateProspectInput(formData)
  if (!validation.valid) {
    return { error: validation.errors.join('. ') }
  }

  const tagsString = formData.get('tags') as string
  const tags = tagsString ? tagsString.split(',').map(t => sanitizeForDb(t.trim(), 50)).filter(Boolean) as string[] : []

  const prospect = {
    user_id: user.id,
    email: (formData.get('email') as string).trim().toLowerCase(),
    first_name: sanitizeForDb(formData.get('first_name') as string, 100),
    last_name: sanitizeForDb(formData.get('last_name') as string, 100),
    company: sanitizeForDb(formData.get('company') as string, 200),
    job_title: sanitizeForDb(formData.get('job_title') as string, 100),
    phone: sanitizeForDb(formData.get('phone') as string, 20),
    linkedin_url: sanitizeForDb(formData.get('linkedin_url') as string, 500),
    website: sanitizeForDb(formData.get('website') as string, 500),
    address: sanitizeForDb(formData.get('address') as string, 300),
    city: sanitizeForDb(formData.get('city') as string, 100),
    country: sanitizeForDb(formData.get('country') as string, 100),
    status: (formData.get('status') as ProspectStatus) || 'new',
    source: (formData.get('source') as ProspectSource) || 'manual',
    tags,
    notes: sanitizeForDb(formData.get('notes') as string, 5000),
  }

  const { data, error } = await supabase
    .from('prospects')
    .insert(prospect)
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidateTag('prospects', 'max')
  return { data }
}

export async function updateProspect(id: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Non autorisé' }
  }

  const tagsString = formData.get('tags') as string
  const tags = tagsString ? tagsString.split(',').map(t => t.trim()).filter(Boolean) : []

  const updates: Partial<Prospect> = {
    email: formData.get('email') as string,
    first_name: formData.get('first_name') as string || null,
    last_name: formData.get('last_name') as string || null,
    company: formData.get('company') as string || null,
    job_title: formData.get('job_title') as string || null,
    phone: formData.get('phone') as string || null,
    linkedin_url: formData.get('linkedin_url') as string || null,
    website: formData.get('website') as string || null,
    address: formData.get('address') as string || null,
    city: formData.get('city') as string || null,
    country: formData.get('country') as string || null,
    status: formData.get('status') as ProspectStatus,
    source: formData.get('source') as ProspectSource,
    tags,
    notes: formData.get('notes') as string || null,
  }

  const { data, error } = await supabase
    .from('prospects')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

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

  const { error } = await supabase
    .from('prospects')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

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

  const { data, error } = await supabase
    .from('prospects')
    .select('status, ai_score, created_at')
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  const prospects = data as Pick<Prospect, 'status' | 'ai_score' | 'created_at'>[]
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
    avgAiScore: prospects.filter(p => p.ai_score !== null).reduce((acc, p) => acc + (p.ai_score || 0), 0) /
      (prospects.filter(p => p.ai_score !== null).length || 1)
  }

  return { data: stats }
}
