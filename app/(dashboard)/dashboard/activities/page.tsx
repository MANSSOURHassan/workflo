'use client'

import React from "react"

import { useState } from 'react'
import useSWR from 'swr'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Activity,
  Phone,
  Mail,
  Calendar,
  MessageSquare,
  Video,
  FileText,
  Plus,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  XCircle,
  User
} from 'lucide-react'
import { getRecentActivity } from '@/lib/actions/dashboard'
import { Skeleton } from '@/components/ui/skeleton'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const activityTypes = [
  { value: 'all', label: 'Toutes', icon: Activity },
  { value: 'call', label: 'Appels', icon: Phone },
  { value: 'email', label: 'Emails', icon: Mail },
  { value: 'meeting', label: 'Reunions', icon: Calendar },
  { value: 'note', label: 'Notes', icon: MessageSquare },
]

const activityIcons: Record<string, React.ElementType> = {
  call: Phone,
  email: Mail,
  meeting: Calendar,
  note: MessageSquare,
  video: Video,
  document: FileText,
}

const activityColors: Record<string, string> = {
  call: 'bg-green-100 text-green-600',
  email: 'bg-blue-100 text-blue-600',
  meeting: 'bg-purple-100 text-purple-600',
  note: 'bg-yellow-100 text-yellow-600',
  video: 'bg-pink-100 text-pink-600',
  document: 'bg-slate-100 text-slate-600',
}

interface ActivityItem {
  id: string
  type: string
  description?: string
  created_at: string
  prospect?: {
    first_name?: string
    last_name?: string
  }
}

async function fetchActivities(): Promise<ActivityItem[]> {
  const result = await getRecentActivity()
  return (result.data as ActivityItem[]) || []
}

export default function ActivitiesPage() {
  const [filter, setFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const { data: activities = [], isLoading } = useSWR<ActivityItem[]>(
    'all-activities',
    fetchActivities
  )

  const filteredActivities = activities.filter((activity: ActivityItem) => {
    const matchesFilter = filter === 'all' || activity.type === filter
    const matchesSearch = !searchQuery ||
      activity.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.prospect?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.prospect?.last_name?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Activites</h1>
          <p className="text-muted-foreground">
            Suivez toutes les interactions avec vos prospects
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle activite
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
                <Phone className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">24</p>
                <p className="text-sm text-muted-foreground">Appels ce mois</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                <Mail className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">156</p>
                <p className="text-sm text-muted-foreground">Emails envoyes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">8</p>
                <p className="text-sm text-muted-foreground">Reunions planifiees</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-100">
                <MessageSquare className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">45</p>
                <p className="text-sm text-muted-foreground">Notes ajoutees</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-2">
              {activityTypes.map((type) => (
                <Button
                  key={type.value}
                  variant={filter === type.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter(type.value)}
                >
                  <type.icon className="mr-2 h-4 w-4" />
                  {type.label}
                </Button>
              ))}
            </div>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activities List */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des activites</CardTitle>
          <CardDescription>
            {filteredActivities.length} activites trouvees
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Activity className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">Aucune activite</h3>
              <p className="text-sm text-muted-foreground">
                Commencez a interagir avec vos prospects pour voir les activites ici
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredActivities.map((activity: ActivityItem) => {
                const Icon = activityIcons[activity.type] || Activity
                const colorClass = activityColors[activity.type] || 'bg-slate-100 text-slate-600'

                return (
                  <div
                    key={activity.id}
                    className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colorClass}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-foreground">
                          {activity.type === 'call' && 'Appel'}
                          {activity.type === 'email' && 'Email'}
                          {activity.type === 'meeting' && 'Reunion'}
                          {activity.type === 'note' && 'Note'}
                        </span>
                        {activity.prospect && (
                          <>
                            <span className="text-muted-foreground">avec</span>
                            <Badge variant="secondary" className="font-normal">
                              <User className="mr-1 h-3 w-3" />
                              {activity.prospect.first_name} {activity.prospect.last_name}
                            </Badge>
                          </>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {activity.description || 'Aucune description'}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(activity.created_at), 'PPp', { locale: fr })}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
