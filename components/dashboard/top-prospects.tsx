'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ArrowRight, Building2, Mail, Eye } from 'lucide-react'
import type { Prospect } from '@/lib/types/database'

interface TopProspectsProps {
  prospects: Prospect[]
}

const statusColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800',
  contacted: 'bg-yellow-100 text-yellow-800',
  qualified: 'bg-green-100 text-green-800',
  converted: 'bg-purple-100 text-purple-800',
  lost: 'bg-gray-100 text-gray-800'
}

const statusLabels: Record<string, string> = {
  new: 'Nouveau',
  contacted: 'Contacté',
  qualified: 'Qualifié',
  converted: 'Converti',
  lost: 'Perdu'
}

export function TopProspects({ prospects }: TopProspectsProps) {
  if (prospects.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Prospects</CardTitle>
          <CardDescription>Meilleurs scores IA</CardDescription>
        </CardHeader>
        <CardContent className="flex h-64 items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Aucun prospect avec score IA</p>
            <Button asChild>
              <Link href="/dashboard/prospects/new">Ajouter un prospect</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Top Prospects</CardTitle>
          <CardDescription>Meilleurs scores IA</CardDescription>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/prospects" className="flex items-center gap-1">
            Voir tous
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {prospects.map((prospect) => (
            <Link
              key={prospect.id}
              href={`/dashboard/prospects/${prospect.id}`}
              className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
                {prospect.first_name?.[0] || prospect.email[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium truncate">
                    {prospect.first_name && prospect.last_name
                      ? `${prospect.first_name} ${prospect.last_name}`
                      : prospect.email}
                  </p>
                  <Badge variant="secondary" className={statusColors[prospect.status]}>
                    {statusLabels[prospect.status]}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                  {prospect.company && (
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {prospect.company}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {prospect.email}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">{prospect.ai_score}/100</div>
                <Progress value={prospect.ai_score || 0} className="w-16 h-1.5 mt-1" />
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-primary">
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
