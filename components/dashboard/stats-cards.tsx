'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, TrendingUp, Mail, Target, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import type { DashboardStats } from '@/lib/types/database'

interface StatsCardsProps {
  stats?: DashboardStats
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: 'Total Prospects',
      value: stats?.totalProspects || 0,
      change: stats?.newProspectsThisMonth || 0,
      changeLabel: 'ce mois',
      icon: Users,
      trend: 'up' as const
    },
    {
      title: 'Pipeline Actif',
      value: new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(stats?.totalDealsValue || 0),
      change: stats?.totalDeals || 0,
      changeLabel: 'deals ouverts',
      icon: Target,
      trend: 'up' as const
    },
    {
      title: 'Taux de Conversion',
      value: `${stats?.conversionRate || 0}%`,
      change: stats?.wonDealsValue || 0,
      changeLabel: 'EUR gagnés',
      icon: TrendingUp,
      trend: (stats?.conversionRate || 0) > 5 ? 'up' as const : 'down' as const
    },
    {
      title: 'Campagnes Actives',
      value: stats?.activeCampaigns || 0,
      change: stats?.avgAiScore || 0,
      changeLabel: 'score IA moyen',
      icon: Mail,
      trend: 'up' as const
    }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <card.icon className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <div className="flex items-center gap-1 mt-1">
              {card.trend === 'up' ? (
                <ArrowUpRight className="h-4 w-4 text-accent" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-destructive" />
              )}
              <span className={`text-xs ${card.trend === 'up' ? 'text-accent' : 'text-destructive'}`}>
                {typeof card.change === 'number' && card.changeLabel.includes('EUR') 
                  ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(card.change)
                  : card.change}
              </span>
              <span className="text-xs text-muted-foreground">{card.changeLabel}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
