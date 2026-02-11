"use client"

import { TrendingUp, DollarSign, Target, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { PipelineStage, Deal } from "@/lib/types/database"

interface PipelineStatsProps {
  stages: PipelineStage[]
  deals: Deal[]
}

export function PipelineStats({ stages, deals }: PipelineStatsProps) {
  const totalDeals = deals.length
  const totalValue = deals.reduce((sum, deal) => sum + (deal.value || 0), 0)
  const wonDeals = deals.filter(deal => deal.status === "won")
  const wonValue = wonDeals.reduce((sum, deal) => sum + (deal.value || 0), 0)
  const avgDealValue = totalDeals > 0 ? totalValue / totalDeals : 0
  const winRate = totalDeals > 0 ? Math.round((wonDeals.length / totalDeals) * 100) : 0

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(value)
  }

  const stats = [
    {
      title: "Valeur du pipeline",
      value: formatCurrency(totalValue),
      description: `${totalDeals} affaires en cours`,
      icon: DollarSign,
    },
    {
      title: "Affaires gagnees",
      value: formatCurrency(wonValue),
      description: `${wonDeals.length} affaires gagnees`,
      icon: TrendingUp,
    },
    {
      title: "Taux de conversion",
      value: `${winRate}%`,
      description: "Affaires gagnees / total",
      icon: Target,
    },
    {
      title: "Valeur moyenne",
      value: formatCurrency(avgDealValue),
      description: "Par affaire",
      icon: Clock,
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
