import { getProfile } from '@/lib/actions/settings'
import { getDashboardStats } from '@/lib/actions/dashboard'
import { BillingClient } from '@/components/billing/billing-client'
import { createClient } from '@/lib/supabase/server'

export default async function BillingPage() {
  const [{ data: profile }, { data: stats }] = await Promise.all([
    getProfile(),
    getDashboardStats()
  ])

  // Get additional stats like team members count and emails sent
  const supabase = await createClient()
  const { count: teamCount } = await supabase
    .from('team_members')
    .select('*', { count: 'exact', head: true })

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { count: emailsSentThisMonth } = await supabase
    .from('campaign_recipients')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startOfMonth.toISOString())

  const billingStats = {
    ...stats,
    teamCount: teamCount || 1,
    emailsSentThisMonth: emailsSentThisMonth || 0
  }

  return <BillingClient profile={profile} stats={billingStats} />
}
