'use server'

import { createClient } from '@/lib/supabase/server'
import { startOfMonth, subMonths, format, endOfDay, addDays, startOfDay, subDays } from 'date-fns'
import { fr } from 'date-fns/locale'

export type AnalyticsData = {
    revenueData: { name: string; revenue: number; costs: number; target: number; deals: number }[]
    pipelineData: { name: string; value: number; color: string }[]
    activityData: { name: string; calls: number; emails: number; meetings: number }[]
    topProspects: { id: string; name: string; company: string | null; deals: number; revenue: number }[]
    recentDeals: { id: string; title: string; amount: number; stage: string; color: string; prospect: string | null; updated_at: string }[]
    kpis: {
        revenue: number
        revenueChange: number
        costs: number
        profit: number
        prospects: number
        prospectsChange: number
        conversionRate: number
        conversionRateChange: number
        activeDeals: number
        activeDealsChange: number
        totalActivities: number
        emailsSent: number
        callsMade: number
        meetingsDone: number
    }
}

export async function getAnalyticsData(): Promise<{ data?: AnalyticsData; error?: string }> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Non autorisé' }

    // ─── 1. Revenue & Costs (Last 6 months) ───────────────────────────────────
    const revenueData = []
    for (let i = 5; i >= 0; i--) {
        const date = subMonths(new Date(), i)
        const monthStart = startOfMonth(date).toISOString()
        const monthEnd = endOfDay(addDays(startOfMonth(subMonths(date, -1)), -1)).toISOString()

        const { data: monthlyInvoices } = await supabase
            .from('invoices')
            .select('total')
            .eq('user_id', user.id)
            .eq('status', 'paid')
            .gte('issue_date', monthStart)
            .lte('issue_date', monthEnd)

        const { data: monthlyExpenses } = await supabase
            .from('expenses')
            .select('total_amount')
            .eq('user_id', user.id)
            .eq('status', 'paid')
            .gte('issue_date', monthStart)
            .lte('issue_date', monthEnd)

        const revenue = monthlyInvoices?.reduce((sum, d) => sum + (Number(d.total) || 0), 0) || 0
        const costs = monthlyExpenses?.reduce((sum, d) => sum + (Number(d.total_amount) || 0), 0) || 0

        revenueData.push({
            name: format(date, 'MMM', { locale: fr }),
            revenue,
            costs,
            target: 50000,
            deals: monthlyInvoices?.length || 0
        })
    }

    // ─── 2. Pipeline Distribution ──────────────────────────────────────────────
    const { data: stages } = await supabase
        .from('pipeline_stages')
        .select('id, name, color')
        .eq('user_id', user.id)
        .order('position')

    const pipelineData = []
    if (stages) {
        for (const stage of stages) {
            const { count } = await supabase
                .from('deals')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('stage_id', stage.id)
            pipelineData.push({ name: stage.name, value: count || 0, color: stage.color || '#cbd5e1' })
        }
    }

    // ─── 3. Activity Tracking (Last 7 days) ───────────────────────────────────
    const activityData = []
    for (let i = 6; i >= 0; i--) {
        const date = subDays(new Date(), i)
        const dayStart = startOfDay(date).toISOString()
        const dayEnd = endOfDay(date).toISOString()

        const { data: activities } = await supabase
            .from('activities')
            .select('type')
            .eq('user_id', user.id)
            .gte('created_at', dayStart)
            .lte('created_at', dayEnd)

        activityData.push({
            name: format(date, 'eee', { locale: fr }),
            calls: activities?.filter(a => a.type === 'call').length || 0,
            emails: activities?.filter(a => a.type === 'email').length || 0,
            meetings: activities?.filter(a => a.type === 'meeting').length || 0,
        })
    }

    // ─── 4. KPIs ─────────────────────────────────────────────────────────────
    const currentMonthStart = startOfMonth(new Date()).toISOString()
    const lastMonthStart = startOfMonth(subMonths(new Date(), 1)).toISOString()
    const lastMonthEnd = endOfDay(addDays(startOfMonth(new Date()), -1)).toISOString()
    const twoMonthsAgoStart = startOfMonth(subMonths(new Date(), 2)).toISOString()

    // Revenue current month
    const { data: currentMonthInvoices } = await supabase.from('invoices').select('total')
        .eq('user_id', user.id).eq('status', 'paid').gte('issue_date', currentMonthStart)
    const { data: lastMonthInvoices } = await supabase.from('invoices').select('total')
        .eq('user_id', user.id).eq('status', 'paid').gte('issue_date', lastMonthStart).lte('issue_date', lastMonthEnd)

    const currentRevenue = currentMonthInvoices?.reduce((s, d) => s + (Number(d.total) || 0), 0) || 0
    const lastRevenue = lastMonthInvoices?.reduce((s, d) => s + (Number(d.total) || 0), 0) || 0
    const revenueChange = lastRevenue > 0 ? ((currentRevenue - lastRevenue) / lastRevenue) * 100 : 0

    // Costs current month
    const { data: currentMonthExpenses } = await supabase.from('expenses').select('total_amount')
        .eq('user_id', user.id).eq('status', 'paid').gte('issue_date', currentMonthStart)
    const currentCosts = currentMonthExpenses?.reduce((s, d) => s + (Number(d.total_amount) || 0), 0) || 0

    // Prospects
    const { count: prospectsCount } = await supabase.from('prospects')
        .select('*', { count: 'exact', head: true }).eq('user_id', user.id)
    const { count: lastMonthProspectsCount } = await supabase.from('prospects')
        .select('*', { count: 'exact', head: true }).eq('user_id', user.id).lte('created_at', lastMonthEnd)
    const prospectsChange = (lastMonthProspectsCount || 0) > 0
        ? (((prospectsCount || 0) - (lastMonthProspectsCount || 0)) / (lastMonthProspectsCount || 1)) * 100
        : 0

    // Active deals
    const { count: activeDealsCount } = await supabase.from('deals')
        .select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'open')
    const { count: lastMonthDealsCount } = await supabase.from('deals')
        .select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'open').lte('created_at', lastMonthEnd)
    const activeDealsChange = (lastMonthDealsCount || 0) > 0
        ? (((activeDealsCount || 0) - (lastMonthDealsCount || 0)) / (lastMonthDealsCount || 1)) * 100
        : 0

    // Conversion rate: deals won / total prospects this month
    const { count: wonDeals } = await supabase.from('deals')
        .select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'won')
    const { count: totalDeals } = await supabase.from('deals')
        .select('*', { count: 'exact', head: true }).eq('user_id', user.id)
    const conversionRate = (totalDeals || 0) > 0 ? ((wonDeals || 0) / (totalDeals || 1)) * 100 : 0

    // Activities totals
    const { data: allActivities } = await supabase.from('activities').select('type').eq('user_id', user.id)
    const totalActivities = allActivities?.length || 0
    const emailsSent = allActivities?.filter(a => a.type === 'email').length || 0
    const callsMade = allActivities?.filter(a => a.type === 'call').length || 0
    const meetingsDone = allActivities?.filter(a => a.type === 'meeting').length || 0

    // ─── 5. Top Prospects ─────────────────────────────────────────────────────
    // Fetch Top Prospects without join
    const { data: topDealsRaw, error: topDealsError } = await supabase
        .from('deals')
        .select('prospect_id, amount')
        .eq('user_id', user.id)
        .not('prospect_id', 'is', null)
        .order('amount', { ascending: false })
        .limit(20)

    if (topDealsError) {
        console.error('Error fetching top deals:', topDealsError)
    }

    const topDeals = topDealsRaw || []
    const topProspectIds = [...new Set(topDeals.map(d => d.prospect_id).filter(Boolean))] as string[]
    
    let topProspectsObjects: any[] = []
    if (topProspectIds.length > 0) {
        const { data: pData } = await supabase
            .from('prospects')
            .select('id, first_name, last_name, company')
            .in('id', topProspectIds)
        topProspectsObjects = pData || []
    }

    const prospectMap: Record<string, { id: string; name: string; company: string | null; deals: number; revenue: number }> = {}
    for (const deal of topDeals) {
        const pid = deal.prospect_id as string
        if (!pid) continue
        const p = topProspectsObjects.find(pro => pro.id === pid)
        if (!prospectMap[pid]) {
            prospectMap[pid] = {
                id: pid,
                name: p ? `${p.first_name} ${p.last_name}` : 'Inconnu',
                company: p?.company || null,
                deals: 0,
                revenue: 0
            }
        }
        prospectMap[pid].deals += 1
        prospectMap[pid].revenue += Number(deal.amount) || 0
    }
    const topProspects = Object.values(prospectMap)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)

    // ─── 6. Recent Deals ──────────────────────────────────────────────────────
    // Fetch Recent Deals without join
    const { data: recentDealsRaw, error: recentDealsError } = await supabase
        .from('deals')
        .select('id, title, amount, updated_at, stage_id, prospect_id')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(5)

    if (recentDealsError) {
        console.error('Error fetching recent deals:', recentDealsError)
    }

    const rdData = recentDealsRaw || []
    const rdProspectIds = [...new Set(rdData.map(d => d.prospect_id).filter(Boolean))] as string[]
    const rdStageIds = [...new Set(rdData.map(d => d.stage_id).filter(Boolean))] as string[]

    const [rdProspects, rdStages] = await Promise.all([
        rdProspectIds.length > 0 ? supabase.from('prospects').select('id, first_name, last_name').in('id', rdProspectIds) : { data: [] },
        rdStageIds.length > 0 ? supabase.from('pipeline_stages').select('id, name, color').in('id', rdStageIds) : { data: [] }
    ])

    const recentDeals = rdData.map(d => {
        const p = rdProspects.data?.find(pro => pro.id === d.prospect_id)
        const s = rdStages.data?.find(sta => sta.id === d.stage_id)
        return {
            id: d.id,
            title: d.title,
            amount: Number(d.amount) || 0,
            stage: s?.name || 'Inconnu',
            color: s?.color || '#cbd5e1',
            prospect: p ? `${p.first_name} ${p.last_name}` : null,
            updated_at: d.updated_at
        }
    })

    return {
        data: {
            revenueData,
            pipelineData,
            activityData,
            topProspects,
            recentDeals,
            kpis: {
                revenue: currentRevenue,
                revenueChange,
                costs: currentCosts,
                profit: currentRevenue - currentCosts,
                prospects: prospectsCount || 0,
                prospectsChange,
                conversionRate: Math.round(conversionRate * 10) / 10,
                conversionRateChange: 0,
                activeDeals: activeDealsCount || 0,
                activeDealsChange,
                totalActivities,
                emailsSent,
                callsMade,
                meetingsDone,
            }
        }
    }
}
