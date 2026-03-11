'use server'

import { createClient } from '@/lib/supabase/server'
import { startOfMonth, subMonths, format, startOfWeek, addDays, endOfDay, startOfDay, subDays } from 'date-fns'
import { fr } from 'date-fns/locale'

export type AnalyticsData = {
    revenueData: { name: string; revenue: number; costs: number; target: number; deals: number }[]
    pipelineData: { name: string; value: number; color: string }[]
    activityData: { name: string; calls: number; emails: number; meetings: number }[]
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
    }
}

export async function getAnalyticsData(): Promise<{ data?: AnalyticsData; error?: string }> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Non autorisé' }

    // 1. Revenue & Costs Data (Last 6 months)
    const revenueData = []
    for (let i = 5; i >= 0; i--) {
        const date = subMonths(new Date(), i)
        const monthStart = startOfMonth(date).toISOString()
        const monthEnd = endOfDay(addDays(startOfMonth(subMonths(date, -1)), -1)).toISOString()

        // Fetch paid invoices for revenue
        const { data: monthlyInvoices } = await supabase
            .from('invoices')
            .select('total')
            .eq('user_id', user.id)
            .eq('status', 'paid')
            .gte('issue_date', monthStart)
            .lte('issue_date', monthEnd)

        // Fetch paid expenses for costs
        const { data: monthlyExpenses } = await supabase
            .from('expenses')
            .select('total_amount')
            .eq('user_id', user.id)
            .eq('status', 'paid')
            .gte('issue_date', monthStart)
            .lte('issue_date', monthEnd)

        const revenue = monthlyInvoices?.reduce((sum, d) => sum + (Number(d.total) || 0), 0) || 0
        const costs = monthlyExpenses?.reduce((sum, d) => sum + (Number(d.total_amount) || 0), 0) || 0
        const count = monthlyInvoices?.length || 0

        revenueData.push({
            name: format(date, 'MMM', { locale: fr }),
            revenue,
            costs,
            target: 50000, // Hardcoded target for now, or fetch from settings
            deals: count
        })
    }

    // 2. Pipeline Data
    const { data: stages } = await supabase
        .from('pipeline_stages')
        .select('id, name, color')
        .eq('user_id', user.id)
        .order('position')

    // If no stages, use default hardcoded for safety? prefer fetching.
    // We need to count deals in each stage
    const pipelineData = []
    if (stages) {
        for (const stage of stages) {
            const { count } = await supabase
                .from('deals')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('stage_id', stage.id)

            pipelineData.push({
                name: stage.name,
                value: count || 0,
                color: stage.color || '#cbd5e1'
            })
        }
    }

    // 3. Activity Data (Last 5 days)
    const activityData = []
    for (let i = 4; i >= 0; i--) {
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
            meetings: activities?.filter(a => a.type === 'meeting').length || 0
        })
    }

    // 4. KPIs
    // Current Month Revenue and Costs
    const currentMonthStart = startOfMonth(new Date()).toISOString()
    const { data: currentMonthInvoices } = await supabase
        .from('invoices')
        .select('total')
        .eq('user_id', user.id)
        .eq('status', 'paid')
        .gte('issue_date', currentMonthStart)

    const { data: currentMonthExpenses } = await supabase
        .from('expenses')
        .select('total_amount')
        .eq('user_id', user.id)
        .eq('status', 'paid')
        .gte('issue_date', currentMonthStart)

    const currentRevenue = currentMonthInvoices?.reduce((sum, d) => sum + (Number(d.total) || 0), 0) || 0
    const currentCosts = currentMonthExpenses?.reduce((sum, d) => sum + (Number(d.total_amount) || 0), 0) || 0

    // Last Month Revenue (for change)
    const lastMonthStart = startOfMonth(subMonths(new Date(), 1)).toISOString()
    const lastMonthEnd = endOfDay(subDays(startOfMonth(new Date()), 1)).toISOString()
    const { data: lastMonthInvoices } = await supabase
        .from('invoices')
        .select('total')
        .eq('user_id', user.id)
        .eq('status', 'paid')
        .gte('issue_date', lastMonthStart)
        .lte('issue_date', lastMonthEnd)
    const lastRevenue = lastMonthInvoices?.reduce((sum, d) => sum + (Number(d.total) || 0), 0) || 0
    const revenueChange = lastRevenue > 0 ? ((currentRevenue - lastRevenue) / lastRevenue) * 100 : 0

    // Prospects Count
    const { count: prospectsCount } = await supabase.from('prospects').select('*', { count: 'exact', head: true }).eq('user_id', user.id)

    // Deals Count
    const { count: activeDealsCount } = await supabase.from('deals').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'open')

    return {
        data: {
            revenueData,
            pipelineData,
            activityData,
            kpis: {
                revenue: currentRevenue,
                revenueChange,
                costs: currentCosts,
                profit: currentRevenue - currentCosts,
                prospects: prospectsCount || 0,
                prospectsChange: 0, // todo: history not tracked easily without snapshots
                conversionRate: 0, // todo: calculate
                conversionRateChange: 0,
                activeDeals: activeDealsCount || 0,
                activeDealsChange: 0
            }
        }
    }
}
