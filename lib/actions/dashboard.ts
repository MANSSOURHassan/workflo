'use server'

import { createClient } from '@/lib/supabase/server'
import type { DashboardStats, ChartData } from '@/lib/types/database'

export async function getDashboardStats(): Promise<{ data?: DashboardStats; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Non autorisé' }
  }

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  try {
    // Fetch all data in parallel
    const [prospectsResult, dealsResult, campaignsResult] = await Promise.all([
      supabase
        .from('prospects')
        .select('id, status, ai_score, created_at')
        .eq('user_id', user.id),
      supabase
        .from('deals')
        .select('id, value, status, created_at')
        .eq('user_id', user.id),
      supabase
        .from('campaigns')
        .select('id, status')
        .eq('user_id', user.id)
    ])

    const prospects = prospectsResult.data || []
    const deals = dealsResult.data || []
    const campaigns = campaignsResult.data || []

    const totalProspects = prospects.length
    const newProspectsThisMonth = prospects.filter(p => new Date(p.created_at) >= startOfMonth).length
    const totalDeals = deals.length
    const openDeals = deals.filter(d => d.status === 'open')
    const wonDeals = deals.filter(d => d.status === 'won')
    const totalDealsValue = openDeals.reduce((acc, d) => acc + (d.value || 0), 0)
    const wonDealsValue = wonDeals.reduce((acc, d) => acc + (d.value || 0), 0)
    const conversionRate = totalProspects > 0
      ? (prospects.filter(p => p.status === 'converted').length / totalProspects) * 100
      : 0
    const activeCampaigns = campaigns.filter(c => c.status === 'active').length
    const prospectsWithScore = prospects.filter(p => p.ai_score !== null)
    const avgAiScore = prospectsWithScore.length > 0
      ? prospectsWithScore.reduce((acc, p) => acc + (p.ai_score || 0), 0) / prospectsWithScore.length
      : 0

    return {
      data: {
        totalProspects,
        newProspectsThisMonth,
        totalDeals,
        totalDealsValue,
        wonDealsValue,
        conversionRate: Math.round(conversionRate * 10) / 10,
        activeCampaigns,
        avgAiScore: Math.round(avgAiScore)
      }
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return { 
      data: {
        totalProspects: 0,
        newProspectsThisMonth: 0,
        totalDeals: 0,
        totalDealsValue: 0,
        wonDealsValue: 0,
        conversionRate: 0,
        activeCampaigns: 0,
        avgAiScore: 0
      }
    }
  }
}

export async function getProspectsByStatusChart(): Promise<{ data?: ChartData[]; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Non autorisé' }
  }

  try {
    const { data, error } = await supabase
      .from('prospects')
      .select('status')
      .eq('user_id', user.id)

    if (error) {
      console.error('Error fetching prospects chart:', error)
      return { data: [] }
    }

    const statusLabels: Record<string, string> = {
      new: 'Nouveaux',
      contacted: 'Contactés',
      qualified: 'Qualifiés',
      converted: 'Convertis',
      lost: 'Perdus'
    }

    const counts: Record<string, number> = {}
    data?.forEach(p => {
      counts[p.status] = (counts[p.status] || 0) + 1
    })

    const chartData: ChartData[] = Object.entries(statusLabels).map(([key, name]) => ({
      name,
      value: counts[key] || 0
    }))

    return { data: chartData }
  } catch (err) {
    console.error('Exception fetching prospects chart:', err)
    return { data: [] }
  }
}

export async function getDealsValueChart(): Promise<{ data?: ChartData[]; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Non autorisé' }
  }

  // Get deals from last 6 months
  const now = new Date()
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)

  const { data, error } = await supabase
    .from('deals')
    .select('value, status, created_at')
    .eq('user_id', user.id)
    .gte('created_at', sixMonthsAgo.toISOString())

  if (error) {
    return { error: error.message }
  }

  // Group by month
  const monthlyData: Record<string, number> = {}
  const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']

  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${months[date.getMonth()]} ${date.getFullYear()}`
    monthlyData[key] = 0
  }

  data?.forEach(deal => {
    const date = new Date(deal.created_at)
    const key = `${months[date.getMonth()]} ${date.getFullYear()}`
    if (monthlyData[key] !== undefined) {
      monthlyData[key] += deal.value || 0
    }
  })

  const chartData: ChartData[] = Object.entries(monthlyData).map(([name, value]) => ({
    name,
    value
  }))

  return { data: chartData }
}

export async function getRecentActivity(limit: number = 10) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: [], error: 'Non autorisé' }
  }

  try {
    // Fetch from both tables separately without joins to avoid schema cache errors
    const [activitiesRaw, auditRaw] = await Promise.all([
      supabase
        .from('activities')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit),
      supabase
        .from('audit_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit)
    ])

    const activitiesData = activitiesRaw.data || []
    const auditData = auditRaw.data || []

    // Optional joins in memory
    try {
      const prospectIds = [...new Set(activitiesData.map(a => a.prospect_id).filter(Boolean))] as string[]
      const memberIds = [...new Set(auditData.map(a => a.user_id).filter(Boolean))] as string[]

      const [prospectsRes, membersRes] = await Promise.all([
        prospectIds.length > 0 ? supabase.from('prospects').select('id, first_name, last_name, company').in('id', prospectIds) : { data: [] },
        memberIds.length > 0 ? supabase.from('team_members').select('id, first_name, last_name').in('id', memberIds) : { data: [] }
      ])

      const prospects = prospectsRes.data || []
      const members = membersRes.data || []

      // Merge and sort
      const activities = activitiesData.map(a => ({
        id: a.id,
        type: 'activity' as const,
        action: a.type,
        title: a.title,
        description: a.description,
        created_at: a.created_at,
        metadata: { prospect: prospects.find(p => p.id === a.prospect_id) }
      }))

      const audits = auditData.map(a => ({
        id: a.id,
        type: 'audit' as const,
        action: a.action_type || a.action,
        title: a.description || 'Action système',
        description: members.find(m => m.id === a.user_id) 
          ? `Par ${members.find(m => m.id === a.user_id)?.first_name}` 
          : (a.details?.actor_name ? `Par ${a.details.actor_name}` : 'Système'),
        created_at: a.created_at,
        metadata: { prospect: undefined }
      }))

      const merged = [...activities, ...audits]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, limit)

      return { data: merged }
    } catch (joinErr) {
      console.warn('In-memory join failed in getRecentActivity:', joinErr)
      // Return raw data if join fails
      return { data: activitiesData.map(a => ({ 
        id: a.id, type: 'activity' as const, action: a.type, title: a.title, description: a.description, created_at: a.created_at, metadata: {} 
      }))}
    }
  } catch (err) {
    console.error('Error in getRecentActivity:', err)
    return { data: [] }
  }
}

export async function getTopProspects() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: [], error: 'Non autorisé' }
  }

  const { data, error } = await supabase
    .from('prospects')
    .select('*')
    .eq('user_id', user.id)
    .not('ai_score', 'is', null)
    .order('ai_score', { ascending: false })
    .limit(5)

  if (error) {
    return { data: [], error: error.message }
  }

  return { data }
}
