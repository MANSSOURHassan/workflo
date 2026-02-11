'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ArrowRight, Lightbulb, Mail, Phone, Calendar, Building2 } from 'lucide-react'
import type { Prospect } from '@/lib/types/database'

interface LeadRecommendationsProps {
  recommendations: {
    prospect: Prospect
    reason: string
    suggestedAction: string
  }[]
}

const actionIcons: Record<string, typeof Mail> = {
  'Envoyer un email de présentation': Mail,
  'Planifier un appel de qualification': Phone,
  'Préparer une proposition commerciale': Calendar,
  'Mettre à jour les informations': Building2,
}

export function LeadRecommendations({ recommendations }: LeadRecommendationsProps) {
  if (recommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Recommandations IA
          </CardTitle>
          <CardDescription>
            Leads prioritaires suggérés par l&apos;intelligence artificielle
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <p className="text-muted-foreground mb-4">Aucune recommandation disponible</p>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            Ajoutez des prospects et calculez leurs scores IA pour recevoir des recommandations personnalisées
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              Recommandations IA
            </CardTitle>
            <CardDescription>
              Leads prioritaires suggérés par l&apos;intelligence artificielle
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/prospects" className="flex items-center gap-1">
              Voir tous
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recommendations.map(({ prospect, reason, suggestedAction }) => {
            const ActionIcon = actionIcons[suggestedAction] || Mail

            return (
              <div
                key={prospect.id}
                className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary text-lg font-medium shrink-0">
                  {prospect.first_name?.[0] || prospect.email[0].toUpperCase()}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Link
                      href={`/dashboard/prospects/${prospect.id}`}
                      className="font-medium hover:underline"
                    >
                      {prospect.first_name && prospect.last_name
                        ? `${prospect.first_name} ${prospect.last_name}`
                        : prospect.email}
                    </Link>
                    {prospect.ai_score && (
                      <Badge variant={prospect.ai_score >= 70 ? 'default' : 'secondary'}>
                        Score: {prospect.ai_score}
                      </Badge>
                    )}
                  </div>
                  
                  {prospect.company && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
                      <Building2 className="h-3 w-3" />
                      {prospect.company}
                      {prospect.job_title && ` - ${prospect.job_title}`}
                    </p>
                  )}

                  <div className="flex flex-col gap-2 mt-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Lightbulb className="h-4 w-4 text-yellow-500" />
                      <span className="text-muted-foreground">{reason}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ActionIcon className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">{suggestedAction}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <div className="text-right">
                    <p className="text-sm font-medium">{prospect.ai_score || 0}/100</p>
                    <Progress value={prospect.ai_score || 0} className="w-16 h-1.5" />
                  </div>
                  <Button size="sm" asChild>
                    <Link href={`/dashboard/prospects/${prospect.id}`}>
                      Voir
                    </Link>
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
