"use client"

import { Users, TrendingUp, DollarSign, Target } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface ReportsOverviewProps {
  stats: any
  isLoading: boolean
}

export function ReportsOverview({ stats, isLoading }: ReportsOverviewProps) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value)

  const metrics = [
    {
      title: "Prospects totaux",
      value: stats?.data?.totalProspects ?? 0,
      sub: `${stats?.data?.newProspectsThisMonth ?? 0} ce mois`,
      icon: Users,
    },
    {
      title: "Taux de conversion",
      value: `${stats?.data?.conversionRate ?? 0}%`,
      sub: "Prospects convertis",
      icon: Target,
    },
    {
      title: "CA Deals gagnés",
      value: formatCurrency(stats?.data?.wonDealsValue ?? 0),
      sub: `${stats?.data?.totalDeals ?? 0} deals au total`,
      icon: DollarSign,
    },
    {
      title: "Deals actifs",
      value: stats?.data?.totalDeals ?? 0,
      sub: formatCurrency(stats?.data?.totalDealsValue ?? 0) + " en pipeline",
      icon: TrendingUp,
    },
  ]

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20 mb-1" />
              <Skeleton className="h-3 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => (
        <Card key={metric.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {metric.title}
            </CardTitle>
            <metric.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{metric.value}</div>
            <p className="text-xs text-muted-foreground mt-1">{metric.sub}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
