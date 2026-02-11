'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Sparkles, Target, TrendingUp, Clock, Loader2 } from 'lucide-react'
import { batchCalculateAIScores } from '@/lib/actions/ai'
import { toast } from 'sonner'

interface LeadsHeaderProps {
  stats: {
    totalWithScore: number
    avgScore: number
    highScoreCount: number
    pendingScore: number
  }
}

export function LeadsHeader({ stats }: LeadsHeaderProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  async function handleBatchScore() {
    startTransition(async () => {
      const result = await batchCalculateAIScores()
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(`${result.data?.updated} prospects ont été scorés`)
        router.refresh()
      }
    })
  }

  const statCards = [
    { 
      label: 'Prospects scorés', 
      value: stats.totalWithScore, 
      icon: Target, 
      color: 'text-primary' 
    },
    { 
      label: 'Score moyen', 
      value: `${stats.avgScore}/100`, 
      icon: TrendingUp, 
      color: 'text-green-500' 
    },
    { 
      label: 'Haute priorité', 
      value: stats.highScoreCount, 
      icon: Sparkles, 
      color: 'text-yellow-500',
      description: 'Score >= 70'
    },
    { 
      label: 'En attente', 
      value: stats.pendingScore, 
      icon: Clock, 
      color: 'text-muted-foreground' 
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Leads IA
          </h1>
          <p className="text-muted-foreground">
            Scoring intelligent et recommandations basées sur l&apos;IA
          </p>
        </div>
        <Button onClick={handleBatchScore} disabled={isPending || stats.pendingScore === 0}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Calcul en cours...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Scorer les prospects ({stats.pendingScore})
            </>
          )}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-muted ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                {stat.description && (
                  <p className="text-xs text-muted-foreground">{stat.description}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
