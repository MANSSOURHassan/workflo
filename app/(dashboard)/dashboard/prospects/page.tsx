import { Suspense } from 'react'
import { getProspects, getProspectStats } from '@/lib/actions/prospects'
import { getTeamMembers } from '@/lib/actions/team'
import { ProspectsHeader } from '@/components/prospects/prospects-header'
import { ProspectsFilters } from '@/components/prospects/prospects-filters'
import { ProspectsTable } from '@/components/prospects/prospects-table'
import { ProspectsPagination } from '@/components/prospects/prospects-pagination'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/dashboard/page-header'
import type { ProspectStatus, ProspectSource } from '@/lib/types/database'

interface ProspectsPageProps {
  searchParams: Promise<{
    search?: string
    status?: ProspectStatus
    source?: ProspectSource
    page?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }>
}

export default async function ProspectsPage({ searchParams }: ProspectsPageProps) {
  const params = await searchParams
  const page = parseInt(params.page || '1')
  const limit = 25

  const [prospectsResult, statsResult, teamResult] = await Promise.all([
    getProspects({
      search: params.search,
      status: params.status,
      source: params.source,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
      page,
      limit
    }),
    getProspectStats(),
    getTeamMembers()
  ])

  const totalPages = Math.ceil((prospectsResult.count || 0) / limit)

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Prospects" 
        description="Gérez et suivez vos contacts commerciaux et clients potentiels en un coup d'œil."
      />
      <ProspectsHeader stats={statsResult.data} />

      <ProspectsFilters
        currentFilters={{
          search: params.search,
          status: params.status,
          source: params.source
        }}
      />

      <Suspense fallback={<Skeleton className="h-96" />}>
        <ProspectsTable
          prospects={prospectsResult.data || []}
          teamMembers={teamResult.data || []}
          sortBy={params.sortBy}
          sortOrder={params.sortOrder}
          error={prospectsResult.error}
        />
      </Suspense>

      {totalPages > 1 && (
        <ProspectsPagination
          currentPage={page}
          totalPages={totalPages}
          total={prospectsResult.count || 0}
        />
      )}

    </div>
  )
}
