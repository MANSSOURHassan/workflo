'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { actionIcons, actionLabels, formatRelativeTime } from './activity-constants'

export interface MergedActivity {
  id: string
  type: 'activity' | 'audit'
  action: string
  title: string
  description: string | null
  created_at: string
  metadata: {
    prospect?: {
      first_name?: string | null
      last_name?: string | null
      company?: string | null
    }
  }
}

interface RecentActivityProps {
  activities: MergedActivity[]
}



export function RecentActivity({ activities }: RecentActivityProps) {
  if (activities.length === 0) {
    return (
      <Card className="shadow-sm border-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-bold">Flux d'Activité</CardTitle>
          <CardDescription>Dernières actions de l'équipe</CardDescription>
        </CardHeader>
        <CardContent className="flex h-[320px] items-center justify-center">
          <p className="text-muted-foreground text-sm italic">Aucune activité récente</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-sm border-primary/5">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold">Flux d'Activité</CardTitle>
            <CardDescription>Temps réel</CardDescription>
          </div>
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-4 before:absolute before:inset-y-0 before:left-[17px] before:w-[2px] before:bg-muted/50">
          {activities.map((item) => {
            const Icon = actionIcons[item.action] || FileText
            const prospectName = item.metadata?.prospect
              ? item.metadata.prospect.first_name && item.metadata.prospect.last_name
                ? `${item.metadata.prospect.first_name} ${item.metadata.prospect.last_name}`
                : item.metadata.prospect.company || 'un prospect'
              : null

            return (
              <div key={item.id} className="relative flex items-start gap-4 pl-0 group">
                <div className={cn(
                  "relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-background shadow-sm transition-colors group-hover:border-primary/30",
                  item.type === 'audit' ? "border-primary/10" : "border-muted"
                )}>
                  <Icon className={cn(
                    "h-4 w-4",
                    item.type === 'audit' ? "text-primary" : "text-muted-foreground"
                  )} />
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground line-clamp-1">
                      {item.title}
                    </p>
                    <span className="text-[10px] text-muted-foreground shrink-0 font-medium whitespace-nowrap">
                      {formatRelativeTime(item.created_at)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider",
                      item.type === 'audit' ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    )}>
                      {actionLabels[item.action] || item.action}
                    </span>
                    {item.description && item.type === 'audit' && (
                      <span className="text-[10px] text-muted-foreground italic">
                        {item.description}
                      </span>
                    )}
                    {prospectName && item.type === 'activity' && (
                      <span className="text-[10px] text-primary hover:underline cursor-pointer font-medium">
                        {prospectName}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
