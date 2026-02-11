import { Suspense } from 'react'
import { getDashboardStats, getProspectsByStatusChart, getDealsValueChart, getTopProspects, getRecentActivity } from '@/lib/actions/dashboard'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { ProspectsChart } from '@/components/dashboard/prospects-chart'
import { DealsChart } from '@/components/dashboard/deals-chart'
import { TopProspects } from '@/components/dashboard/top-prospects'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { Skeleton } from '@/components/ui/skeleton'
import { AIAdvice } from '@/components/dashboard/ai-advice'

export default async function DashboardPage() {
  const [statsResult, prospectsChartResult, dealsChartResult, topProspectsResult, activityResult] = await Promise.all([
    getDashboardStats(),
    getProspectsByStatusChart(),
    getDealsValueChart(),
    getTopProspects(),
    getRecentActivity()
  ])

  return (
    <div className="space-y-6">
      <AIAdvice />

      {/* Stats Overview */}
      <Suspense fallback={<StatsCardsSkeleton />}>
        <StatsCards stats={statsResult.data} />
      </Suspense>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Suspense fallback={<ChartSkeleton />}>
          <ProspectsChart data={prospectsChartResult.data || []} />
        </Suspense>
        <Suspense fallback={<ChartSkeleton />}>
          <DealsChart data={dealsChartResult.data || []} />
        </Suspense>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Suspense fallback={<ListSkeleton />}>
          <TopProspects prospects={topProspectsResult.data || []} />
        </Suspense>
        <Suspense fallback={<ListSkeleton />}>
          <RecentActivity activities={activityResult.data || []} />
        </Suspense>
      </div>
    </div>
  )
}

function StatsCardsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Skeleton key={i} className="h-32" />
      ))}
    </div>
  )
}

function ChartSkeleton() {
  return <Skeleton className="h-80" />
}

function ListSkeleton() {
  return <Skeleton className="h-96" />
}
