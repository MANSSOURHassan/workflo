'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidateTag } from 'next/cache'
import type { Campaign, CampaignStatus, CampaignType, EmailTemplate } from '@/lib/types/database'
import { validateCampaignInput, sanitizeForDb } from '@/lib/security/validation'

export async function getCampaigns(params?: {
  status?: CampaignStatus
  type?: CampaignType
  search?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: [], error: 'Non autorisé' }
  }

  let query = supabase
    .from('campaigns')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (params?.status) {
    query = query.eq('status', params.status)
  }

  if (params?.type) {
    query = query.eq('type', params.type)
  }

  if (params?.search) {
    query = query.ilike('name', `%${params.search}%`)
  }

  const { data, error } = await query

  return { data: data as Campaign[], error: error?.message }
}

export async function getCampaign(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: 'Non autorisé' }
  }

  const { data, error } = await supabase
    .from('campaigns')
    .select(`
      *,
      campaign_recipients (
        id,
        prospect_id,
        status,
        sent_at,
        opened_at,
        clicked_at,
        replied_at,
        prospect:prospects (
          id,
          email,
          first_name,
          last_name,
          company
        )
      )
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  return { data, error: error?.message }
}

export async function createCampaign(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Non autorisé' }
  }

  // Validate input
  const validation = validateCampaignInput(formData)
  if (!validation.valid) {
    return { error: validation.errors.join('. ') }
  }

  const campaign = {
    user_id: user.id,
    name: sanitizeForDb(formData.get('name') as string, 200),
    type: (formData.get('type') as CampaignType) || 'email',
    status: 'draft' as CampaignStatus,
    subject: sanitizeForDb(formData.get('subject') as string, 500),
    content: sanitizeForDb(formData.get('content') as string, 10000),
    scheduled_at: formData.get('scheduled_at') as string || null,
  }

  const { data, error } = await supabase
    .from('campaigns')
    .insert(campaign)
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidateTag('campaigns', 'max')
  return { data }
}

export async function updateCampaign(id: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Non autorisé' }
  }

  // Validate input
  const validation = validateCampaignInput(formData)
  if (!validation.valid) {
    return { error: validation.errors.join('. ') }
  }

  const updates = {
    name: sanitizeForDb(formData.get('name') as string, 200),
    type: formData.get('type') as CampaignType,
    subject: sanitizeForDb(formData.get('subject') as string, 500),
    content: sanitizeForDb(formData.get('content') as string, 10000),
    scheduled_at: formData.get('scheduled_at') as string || null,
  }

  const { data, error } = await supabase
    .from('campaigns')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidateTag('campaigns', 'max')
  return { data }
}

export async function updateCampaignStatus(id: string, status: CampaignStatus) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Non autorisé' }
  }

  const { error } = await supabase
    .from('campaigns')
    .update({ status })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidateTag('campaigns', 'max')
  return { success: true }
}

export async function deleteCampaign(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Non autorisé' }
  }

  const { error } = await supabase
    .from('campaigns')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidateTag('campaigns', 'max')
  return { success: true }
}

export async function addRecipientsToCompaign(campaignId: string, prospectIds: string[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Non autorisé' }
  }

  // Check subscription limits
  const { checkLimit } = await import('@/lib/utils/subscription')
  const limitCheck = await checkLimit('emails')
  if (!limitCheck.allowed) {
    return { error: limitCheck.error }
  }

  const recipients = prospectIds.map(prospectId => ({
    campaign_id: campaignId,
    prospect_id: prospectId,
    status: 'pending' as const,
  }))

  const { error } = await supabase
    .from('campaign_recipients')
    .insert(recipients)

  if (error) {
    return { error: error.message }
  }

  revalidateTag('campaigns', 'max')
  return { success: true }
}

// Email Templates
export async function getEmailTemplates() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: [], error: 'Non autorisé' }
  }

  const { data, error } = await supabase
    .from('email_templates')
    .select('*')
    .or(`user_id.eq.${user.id},is_public.eq.true`)
    .order('created_at', { ascending: false })

  return { data: data as EmailTemplate[], error: error?.message }
}

export async function createEmailTemplate(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Non autorisé' }
  }

  const variablesString = formData.get('variables') as string
  const variables = variablesString ? variablesString.split(',').map(v => v.trim()).filter(Boolean) : []

  const template = {
    user_id: user.id,
    name: formData.get('name') as string,
    subject: formData.get('subject') as string,
    content: formData.get('content') as string,
    variables,
    is_public: formData.get('is_public') === 'true',
  }

  const { data, error } = await supabase
    .from('email_templates')
    .insert(template)
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidateTag('templates', 'max')
  return { data }
}

export async function deleteEmailTemplate(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Non autorisé' }
  }

  const { error } = await supabase
    .from('email_templates')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidateTag('templates', 'max')
  return { success: true }
}
