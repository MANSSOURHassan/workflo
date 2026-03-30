'use client'

import { useMemo } from 'react'
import useSWR from 'swr'
import { getLeadRecommendations } from '@/lib/actions/ai'
import { getProspects } from '@/lib/actions/prospects'
import { LeadsHeader } from '@/components/leads/leads-header'
import { LeadRecommendations } from '@/components/leads/lead-recommendations'
import { LeadScoring } from '@/components/leads/lead-scoring'
import { AIInsights } from '@/components/leads/ai-insights'
import type { Prospect } from '@/lib/types/database'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/dashboard/page-header'

async function fetchRecommendations() {
  const result = await getLeadRecommendations()
  return result.data || []
}

async function fetchProspects() {
  const result = await getProspects({ sortBy: 'ai_score', sortOrder: 'desc', limit: 20 })
  return result.data || []
}

export default function LeadsPage() {
  const { data: recommendations = [], isLoading: loadingRecs } = useSWR(
    'lead-recommendations',
    fetchRecommendations
  )

  const { data: prospects = [], isLoading: loadingProspects } = useSWR<Prospect[]>(
    'leads-prospects',
    fetchProspects
  )

  // Calculate stats
  const stats = useMemo(() => {
    const withScore = prospects.filter(p => p.ai_score !== null)
    const avgScore = withScore.length > 0
      ? Math.round(withScore.reduce((acc, p) => acc + (p.ai_score || 0), 0) / withScore.length)
      : 0
    const highScore = withScore.filter(p => (p.ai_score || 0) >= 70).length
    const withoutScore = prospects.length - withScore.length

    return {
      totalWithScore: withScore.length,
      avgScore,
      highScoreCount: highScore,
      pendingScore: withoutScore
    }
  }, [prospects])

  const isLoading = loadingRecs || loadingProspects

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-96 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
          <Skeleton className="h-80 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Leads IA" 
        description="Identifiez vos meilleures opportunités grâce au scoring prédictif et aux recommandations basées sur l'intelligence artificielle."
      />
      <LeadsHeader stats={stats} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <LeadRecommendations recommendations={recommendations} />
          <LeadScoring prospects={prospects} />
        </div>
        <div>
          <AIInsights 
            avgScore={stats.avgScore}
            highScoreCount={stats.highScoreCount}
            totalProspects={prospects.length}
          />
        </div>
      </div>
    </div>
  )
}
