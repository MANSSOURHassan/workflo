'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { TrendingUp, TrendingDown, Building2, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Prospect } from '@/lib/types/database'

interface LeadScoringProps {
  prospects: Prospect[]
}

const statusLabels: Record<string, string> = {
  new: 'Nouveau',
  contacted: 'Contacté',
  qualified: 'Qualifié',
  converted: 'Converti',
  lost: 'Perdu'
}

export function LeadScoring({ prospects }: LeadScoringProps) {
  const scoredProspects = prospects.filter(p => p.ai_score !== null)
    .sort((a, b) => (b.ai_score || 0) - (a.ai_score || 0))

  if (scoredProspects.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Classement des Leads</CardTitle>
          <CardDescription>Top prospects par score IA</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">Aucun prospect scoré</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Classement des Leads</CardTitle>
        <CardDescription>Top prospects par score IA</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {scoredProspects.slice(0, 10).map((prospect, index) => {
            const score = prospect.ai_score || 0
            const isHigh = score >= 70
            const isMedium = score >= 40 && score < 70

            return (
              <Link
                key={prospect.id}
                href={`/dashboard/prospects/${prospect.id}`}
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-bold">
                  {index + 1}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">
                      {prospect.first_name && prospect.last_name
                        ? `${prospect.first_name} ${prospect.last_name}`
                        : prospect.email}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {statusLabels[prospect.status]}
                    </Badge>
                  </div>
                  {prospect.company && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {prospect.company}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {isHigh ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : isMedium ? (
                    <TrendingUp className="h-4 w-4 text-yellow-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                  <div className="text-right w-20">
                    <p className={`text-sm font-bold ${
                      isHigh ? 'text-green-600' : isMedium ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {score}/100
                    </p>
                    <Progress 
                      value={score} 
                      className={`h-1.5 ${
                        isHigh ? '[&>div]:bg-green-500' : isMedium ? '[&>div]:bg-yellow-500' : '[&>div]:bg-red-500'
                      }`}
                    />
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-primary">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
