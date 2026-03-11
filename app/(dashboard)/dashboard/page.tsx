import { Suspense } from 'react'
import { getDashboardStats, getProspectsByStatusChart, getDealsValueChart, getTopProspects, getRecentActivity } from '@/lib/actions/dashboard'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { ProspectsChart } from '@/components/dashboard/prospects-chart'
import { DealsChart } from '@/components/dashboard/deals-chart'
import { TopProspects } from '@/components/dashboard/top-prospects'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { Skeleton } from '@/components/ui/skeleton'
import { AIAdvice } from '@/components/dashboard/ai-advice'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <AIAdvice />

      {/* Stats Overview */}
      <Suspense fallback={<StatsCardsSkeleton />}>
        <StatsWrapper />
      </Suspense>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Suspense fallback={<ChartSkeleton />}>
          <ProspectsChartWrapper />
        </Suspense>
        <Suspense fallback={<ChartSkeleton />}>
          <DealsChartWrapper />
        </Suspense>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Suspense fallback={<ListSkeleton />}>
          <TopProspectsWrapper />
        </Suspense>
        <Suspense fallback={<ListSkeleton />}>
          <RecentActivityWrapper />
        </Suspense>
      </div>
    </div>
  )
}

async function StatsWrapper() {
  const result = await getDashboardStats()
  return <StatsCards stats={result.data} />
}

async function ProspectsChartWrapper() {
  const result = await getProspectsByStatusChart()
  return <ProspectsChart data={result.data || []} />
}

async function DealsChartWrapper() {
  const result = await getDealsValueChart()
  return <DealsChart data={result.data || []} />
}

async function TopProspectsWrapper() {
  const result = await getTopProspects()
  return <TopProspects prospects={result.data || []} />
}

async function RecentActivityWrapper() {
  const result = await getRecentActivity()
  return <RecentActivity activities={result.data || []} />
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
