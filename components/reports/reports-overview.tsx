"use client"

import { Users, TrendingUp, DollarSign, Target, ArrowUp, ArrowDown } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface ReportsOverviewProps {
  stats: any
  isLoading: boolean
}

export function ReportsOverview({ stats, isLoading }: ReportsOverviewProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(value)
  }

  const metrics = [
    {
      title: "Prospects totaux",
      value: stats?.totalProspects || 0,
      change: "+12%",
      trend: "up",
      icon: Users,
    },
    {
      title: "Taux de conversion",
      value: `${stats?.conversionRate || 0}%`,
      change: "+3%",
      trend: "up",
      icon: Target,
    },
    {
      title: "Chiffre d'affaires",
      value: formatCurrency(stats?.totalRevenue || 0),
      change: "+18%",
      trend: "up",
      icon: DollarSign,
    },
    {
      title: "Affaires gagnées",
      value: stats?.wonDeals || 0,
      change: "-2%",
      trend: "down",
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
            <div className="flex items-center gap-1 mt-1">
              {metric.trend === "up" ? (
                <ArrowUp className="h-3 w-3 text-success" />
              ) : (
                <ArrowDown className="h-3 w-3 text-destructive" />
              )}
              <span className={`text-xs ${metric.trend === "up" ? "text-success" : "text-destructive"}`}>
                {metric.change}
              </span>
              <span className="text-xs text-muted-foreground">vs mois dernier</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
