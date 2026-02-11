'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidateTag } from 'next/cache'
import type { Profile, UserSettings, SupportTicket, TicketPriority } from '@/lib/types/database'

export async function getProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { data: null, error: 'Non autorisé' }
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return { data: data as Profile | null, error: error?.message }
}

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Non autorisé' }
  }

  const updates = {
    first_name: formData.get('first_name') as string || null,
    last_name: formData.get('last_name') as string || null,
    company_name: formData.get('company_name') as string || null,
  }

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidateTag('profile', 'max')
  return { success: true }
}

export async function getUserSettings() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { data: null, error: 'Non autorisé' }
  }

  let { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // Create default settings if not exist
  if (!data) {
    const { data: newSettings, error: createError } = await supabase
      .from('user_settings')
      .insert({
        user_id: user.id,
        email_notifications: true,
        sms_notifications: false,
        language: 'fr',
        timezone: 'Europe/Paris',
        gdpr_consent: false,
        data_retention_days: 365
      })
      .select()
      .single()

    if (createError) {
      return { data: null, error: createError.message }
    }

    data = newSettings
  }

  return { data: data as UserSettings, error: error?.message }
}

export async function updateUserSettings(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Non autorisé' }
  }

  const updates = {
    email_notifications: formData.get('email_notifications') === 'true',
    sms_notifications: formData.get('sms_notifications') === 'true',
    language: formData.get('language') as string || 'fr',
    timezone: formData.get('timezone') as string || 'Europe/Paris',
    data_retention_days: parseInt(formData.get('data_retention_days') as string) || 365
  }

  const { error } = await supabase
    .from('user_settings')
    .update(updates)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidateTag('settings', 'max')
  return { success: true }
}

export async function updateGDPRConsent(consent: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Non autorisé' }
  }

  const { error } = await supabase
    .from('user_settings')
    .update({
      gdpr_consent: consent,
      gdpr_consent_date: consent ? new Date().toISOString() : null
    })
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidateTag('settings', 'max')
  return { success: true }
}

export async function exportUserData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Non autorisé' }
  }

  // Fetch all user data for GDPR export
  const [profile, settings, prospects, deals, campaigns, activities] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('user_settings').select('*').eq('user_id', user.id).single(),
    supabase.from('prospects').select('*').eq('user_id', user.id),
    supabase.from('deals').select('*').eq('user_id', user.id),
    supabase.from('campaigns').select('*').eq('user_id', user.id),
    supabase.from('activities').select('*').eq('user_id', user.id)
  ])

  const exportData = {
    exportDate: new Date().toISOString(),
    profile: profile.data,
    settings: settings.data,
    prospects: prospects.data,
    deals: deals.data,
    campaigns: campaigns.data,
    activities: activities.data
  }

  return { data: JSON.stringify(exportData, null, 2) }
}

export async function deleteUserAccount() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Non autorisé' }
  }

  // Delete all user data (cascade should handle most of it)
  // The profile delete will cascade to other tables due to foreign key constraints
  const { error: deleteError } = await supabase
    .from('profiles')
    .delete()
    .eq('id', user.id)

  if (deleteError) {
    return { error: deleteError.message }
  }

  // Sign out and delete auth user
  await supabase.auth.signOut()

  return { success: true }
}

// Support Tickets
export async function getSupportTickets() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { data: [], error: 'Non autorisé' }
  }

  const { data, error } = await supabase
    .from('support_tickets')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return { data: data as SupportTicket[], error: error?.message }
}

export async function createSupportTicket(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Non autorisé' }
  }

  const ticket = {
    user_id: user.id,
    subject: formData.get('subject') as string,
    description: formData.get('description') as string,
    priority: (formData.get('priority') as TicketPriority) || 'medium',
    status: 'open' as const
  }

  const { data, error } = await supabase
    .from('support_tickets')
    .insert(ticket)
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidateTag('tickets', 'max')
  return { data }
}
