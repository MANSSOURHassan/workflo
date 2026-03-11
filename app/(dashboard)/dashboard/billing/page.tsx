import { Suspense } from 'react'
import { getProfile } from '@/lib/actions/settings'
import { getDashboardStats } from '@/lib/actions/dashboard'
import { BillingClient } from '@/components/billing/billing-client'
import { createClient } from '@/lib/supabase/server'
import { Skeleton } from '@/components/ui/skeleton'

export default function BillingPage() {
  return (
    <Suspense fallback={<BillingSkeleton />}>
      <BillingWrapper />
    </Suspense>
  )
}

async function BillingWrapper() {
  const supabase = await createClient()
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const [{ data: profile }, { data: stats }, teamRes, emailRes] = await Promise.all([
    getProfile(),
    getDashboardStats(),
    supabase
      .from('team_members')
      .select('*', { count: 'exact', head: true }),
    supabase
      .from('campaign_recipients')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfMonth.toISOString())
  ])

  const billingStats = {
    ...stats,
    teamCount: teamRes.count || 1,
    emailsSentThisMonth: emailRes.count || 0
  }

  return <BillingClient profile={profile} stats={billingStats} />
}

function BillingSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-48" />
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
      <Skeleton className="h-[400px] w-full" />
    </div>
  )
}
