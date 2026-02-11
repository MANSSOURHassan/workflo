"use client"

import { Mail, Send, MousePointer, Users } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Campaign } from "@/lib/types/database"

interface CampaignStatsProps {
  campaigns: Campaign[]
}

export function CampaignStats({ campaigns }: CampaignStatsProps) {
  const totalCampaigns = campaigns.length
  const activeCampaigns = campaigns.filter(c => c.status === "active").length
  const totalSent = campaigns.reduce((sum, c) => sum + (c.sent_count || 0), 0)
  const totalOpened = campaigns.reduce((sum, c) => sum + (c.open_count || 0), 0)
  const totalClicked = campaigns.reduce((sum, c) => sum + (c.click_count || 0), 0)

  const openRate = totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0
  const clickRate = totalOpened > 0 ? Math.round((totalClicked / totalOpened) * 100) : 0

  const stats = [
    {
      title: "Campagnes actives",
      value: activeCampaigns.toString(),
      description: `sur ${totalCampaigns} au total`,
      icon: Mail,
    },
    {
      title: "Messages envoyés",
      value: totalSent.toLocaleString("fr-FR"),
      description: "tous canaux confondus",
      icon: Send,
    },
    {
      title: "Taux d'ouverture",
      value: `${openRate}%`,
      description: `${totalOpened.toLocaleString("fr-FR")} ouvertures`,
      icon: Users,
    },
    {
      title: "Taux de clic",
      value: `${clickRate}%`,
      description: `${totalClicked.toLocaleString("fr-FR")} clics`,
      icon: MousePointer,
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
