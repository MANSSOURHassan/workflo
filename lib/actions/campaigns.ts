'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidateTag } from 'next/cache'
import type { Campaign, CampaignStatus, CampaignType, EmailTemplate } from '@/lib/types/database'
import { campaignSchema, emailTemplateSchema, isValidUUID } from '@/lib/security/validation'
import { logAuditAction } from '@/lib/security/audit'

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

  // Validate input with Zod
  const rawData = Object.fromEntries(formData.entries())
  const validation = campaignSchema.safeParse(rawData)
  if (!validation.success) {
    return { error: 'Validation échouée: ' + validation.error.errors.map(e => e.message).join(', ') }
  }

  const campaign = {
    ...validation.data,
    user_id: user.id,
    status: 'draft' as CampaignStatus,
  }

  const { data, error } = await supabase
    .from('campaigns')
    .insert(campaign)
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  // Log audit
  await logAuditAction({
    action: 'campaign.create',
    entityType: 'campaign',
    entityId: data.id,
    newData: data
  })

  revalidateTag('campaigns', 'max')
  return { data }
}

export async function updateCampaign(id: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Non autorisé' }
  }

  // Validate input with Zod (partial update)
  const rawData = Object.fromEntries(formData.entries())
  const validation = campaignSchema.partial().safeParse(rawData)
  if (!validation.success) {
    return { error: 'Validation échouée: ' + validation.error.errors.map(e => e.message).join(', ') }
  }

  // Get old data for audit
  const { data: oldData } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  const { data, error } = await supabase
    .from('campaigns')
    .update(validation.data)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  // Log audit
  await logAuditAction({
    action: 'campaign.update',
    entityType: 'campaign',
    entityId: id,
    oldData,
    newData: data
  })

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

  // Log audit
  await logAuditAction({
    action: 'campaign.update', // Or 'campaign.status_change'
    entityType: 'campaign',
    entityId: id,
    newData: { status }
  })

  revalidateTag('campaigns', 'max')
  return { success: true }
}

export async function deleteCampaign(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Non autorisé' }
  }

  // Get old data
  const { data: oldData } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  const { error } = await supabase
    .from('campaigns')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  // Log audit
  await logAuditAction({
    action: 'campaign.delete',
    entityType: 'campaign',
    entityId: id,
    oldData
  })

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

  const rawData = Object.fromEntries(formData.entries())
  if (rawData.variables) {
    (rawData as any).variables = (rawData.variables as string).split(',').map(v => v.trim()).filter(Boolean)
  } else {
    (rawData as any).variables = []
  }
  
  // Transform is_public to boolean if it's a string
  if (rawData.is_public === 'true') (rawData as any).is_public = true
  if (rawData.is_public === 'false') (rawData as any).is_public = false

  const validation = emailTemplateSchema.safeParse(rawData)
  if (!validation.success) {
    return { error: 'Validation échouée: ' + validation.error.errors.map(e => e.message).join(', ') }
  }

  const template = {
    ...validation.data,
    user_id: user.id,
    is_public: !!validation.data.is_public
  }

  const { data, error } = await supabase
    .from('email_templates')
    .insert(template)
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  // Log audit
  await logAuditAction({
    action: 'campaign.create', // template.create ? let's use a consistent prefix or specific ones
    entityType: 'email_template',
    entityId: data.id,
    newData: data
  })

  revalidateTag('templates', 'max')
  return { data }
}

export async function deleteEmailTemplate(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Non autorisé' }
  }

  // Get old data
  const { data: oldData } = await supabase
    .from('email_templates')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  const { error } = await supabase
    .from('email_templates')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  // Log audit
  await logAuditAction({
    action: 'campaign.delete',
    entityType: 'email_template',
    entityId: id,
    oldData
  })

  revalidateTag('templates', 'max')
  return { success: true }
}
