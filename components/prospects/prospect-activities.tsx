'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Phone, 
  Mail, 
  Calendar, 
  MessageSquare, 
  Video, 
  FileText, 
  Clock, 
  Activity as ActivityIcon 
} from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import type { Activity } from '@/lib/types/database'

const activityIcons: Record<string, React.ElementType> = {
  call: Phone,
  email: Mail,
  meeting: Calendar,
  note: MessageSquare,
  video: Video,
  document: FileText,
  status_change: ActivityIcon,
  deal_update: ActivityIcon,
}

const activityColors: Record<string, string> = {
  call: 'bg-green-100 text-green-600',
  email: 'bg-blue-100 text-blue-600',
  meeting: 'bg-purple-100 text-purple-600',
  note: 'bg-yellow-100 text-yellow-600',
  video: 'bg-pink-100 text-pink-600',
  document: 'bg-slate-100 text-slate-600',
  status_change: 'bg-orange-100 text-orange-600',
  deal_update: 'bg-indigo-100 text-indigo-600',
}

const typeLabels: Record<string, string> = {
  call: 'Appel',
  email: 'Email',
  meeting: 'Réunion',
  note: 'Note',
  video: 'Vidéo',
  document: 'Document',
  status_change: 'Changement de statut',
  deal_update: 'Mise à jour opportunité',
}

interface ProspectActivitiesProps {
  activities: Activity[]
}

export function ProspectActivities({ activities }: ProspectActivitiesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Historique des activités</CardTitle>
        <CardDescription>
          {activities.length} interaction{activities.length > 1 ? 's' : ''} avec ce prospect
        </CardDescription>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ActivityIcon className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
            <h3 className="text-lg font-semibold">Aucune activité</h3>
            <p className="text-sm text-muted-foreground">
              Commencez à interagir avec ce prospect pour voir les activités ici
            </p>
          </div>
        ) : (
          <div className="space-y-6 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-0.5 before:bg-muted">
            {activities.map((activity) => {
              const Icon = activityIcons[activity.type] || ActivityIcon
              const colorClass = activityColors[activity.type] || 'bg-slate-100 text-slate-600'

              return (
                <div key={activity.id} className="relative pl-12">
                  <div className={cn(
                    "absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-full border-4 border-background shadow-sm",
                    colorClass
                  )}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col gap-1 p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm">
                        {activity.title || typeLabels[activity.type]}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {(() => {
                          const date = new Date(activity.created_at)
                          return isNaN(date.getTime()) 
                            ? 'Date inconnue' 
                            : format(date, 'PPp', { locale: fr })
                        })()}
                      </span>
                    </div>
                    {activity.description && (
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {activity.description}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
