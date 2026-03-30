'use server'

import { createClient } from '@/lib/supabase/server'
import type { Activity } from '@/lib/types/database'

export interface ActivityStats {
  callsThisMonth: number
  emailsThisMonth: number
  meetingsThisMonth: number
  notesThisMonth: number
}

export async function getAllActivities(): Promise<{ data?: any[]; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Non autorisé' }
  }

  try {
    const { data: activitiesData, error } = await supabase
      .from('activities')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error in getAllActivities:', error)
      return { data: [], error: error.message }
    }

    const activities = activitiesData || []
    
    // Optional Join in memory
    try {
      const prospectIds = [...new Set(activities.map(a => a.prospect_id).filter(Boolean))] as string[]
      if (prospectIds.length > 0) {
        const { data: prospects } = await supabase
          .from('prospects')
          .select('id, first_name, last_name, company')
          .in('id', prospectIds)
        
        if (prospects) {
          activities.forEach(a => {
            if (a.prospect_id) {
              a.prospect = prospects.find(p => p.id === a.prospect_id)
            }
          })
        }
      }
    } catch (e) {
      console.warn('Could not join activities with prospects:', e)
    }

    return { data: activities }
  } catch (err) {
    console.error('Exception in getAllActivities:', err)
    return { data: [], error: 'Table activities non trouvée' }
  }
}

export async function getActivityStats(): Promise<{ data?: ActivityStats; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Non autorisé' }
  }

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  try {
    const { data, error } = await supabase
      .from('activities')
      .select('type, created_at')
      .eq('user_id', user.id)
      .gte('created_at', startOfMonth.toISOString())

    if (error) {
      console.error('Error in getActivityStats:', error)
      return { data: { callsThisMonth: 0, emailsThisMonth: 0, meetingsThisMonth: 0, notesThisMonth: 0 } }
    }

    const stats: ActivityStats = {
      callsThisMonth: 0,
      emailsThisMonth: 0,
      meetingsThisMonth: 0,
      notesThisMonth: 0,
    }

    data?.forEach((activity) => {
      if (activity.type === 'call') stats.callsThisMonth++
      else if (activity.type === 'email') stats.emailsThisMonth++
      else if (activity.type === 'meeting') stats.meetingsThisMonth++
      else if (activity.type === 'note') stats.notesThisMonth++
    })

    return { data: stats }
  } catch (err) {
    console.error('Exception in getActivityStats:', err)
    return { data: { callsThisMonth: 0, emailsThisMonth: 0, meetingsThisMonth: 0, notesThisMonth: 0 } }
  }
}

export async function getProspectsList(): Promise<{ data?: any[]; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Non autorisé' }

  const { data, error } = await supabase
    .from('prospects')
    .select('id, first_name, last_name, company')
    .eq('user_id', user.id)
    .order('first_name', { ascending: true })

  if (error) return { error: error.message }
  return { data }
}

export async function createActivity(payload: {
  prospect_id?: string
  type: string
  title: string
  description?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non autorisé' }

  const { error } = await supabase
    .from('activities')
    .insert({
      user_id: user.id,
      ...payload
    })

  if (error) return { error: error.message }
  return { success: true }
}

export async function getProspectActivities(prospectId: string): Promise<{ data?: Activity[]; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non autorisé' }

  try {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('prospect_id', prospectId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error in getProspectActivities:', error)
      return { data: [], error: error.message }
    }

    return { data: (data as Activity[]) || [] }
  } catch (err) {
    console.error('Exception in getProspectActivities:', err)
    return { data: [], error: 'Table activities non trouvée' }
  }
}
