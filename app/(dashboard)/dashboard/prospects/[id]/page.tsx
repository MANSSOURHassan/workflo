import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getProspect } from '@/lib/actions/prospects'
import { getProspectActivities } from '@/lib/actions/activities'
import { ProspectActivities } from '@/components/prospects/prospect-activities'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  ArrowLeft, 
  Pencil, 
  Mail, 
  Phone, 
  Building2, 
  MapPin, 
  Globe, 
  Linkedin,
  Calendar,
  Sparkles
} from 'lucide-react'
import { ProspectActions } from '@/components/prospects/prospect-actions'

interface ProspectPageProps {
  params: Promise<{ id: string }>
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

const sourceLabels: Record<string, string> = {
  manual: 'Manuel',
  import: 'Import',
  website: 'Site web',
  linkedin: 'LinkedIn',
  referral: 'Recommandation',
  api: 'API'
}

export default async function ProspectPage({ params }: ProspectPageProps) {
  const { id } = await params
  const [prospectResult, activitiesResult] = await Promise.all([
    getProspect(id),
    getProspectActivities(id)
  ])

  const { data: prospect, error: prospectError } = prospectResult
  const activities = activitiesResult.data || []

  if (prospectError) {
    throw new Error(prospectError)
  }

  if (!prospect) {
    notFound()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/prospects">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <ProspectActions prospectId={prospect.id} />
          <Button asChild>
            <Link href={`/dashboard/prospects/${prospect.id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Modifier
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Card */}
          <Card>
            <CardHeader>
              <CardTitle>Informations de contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <a href={`mailto:${prospect.email}`} className="font-medium hover:underline">
                      {prospect.email}
                    </a>
                  </div>
                </div>
                
                {prospect.phone && (
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Phone className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Téléphone</p>
                      <a href={`tel:${prospect.phone}`} className="font-medium hover:underline">
                        {prospect.phone}
                      </a>
                    </div>
                  </div>
                )}

                {prospect.linkedin_url && (
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Linkedin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">LinkedIn</p>
                      <a 
                        href={prospect.linkedin_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="font-medium hover:underline"
                      >
                        Voir le profil
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Company Card */}
          {(prospect.company || prospect.website) && (
            <Card>
              <CardHeader>
                <CardTitle>Entreprise</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  {prospect.company && (
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Entreprise</p>
                        <p className="font-medium">{prospect.company}</p>
                      </div>
                    </div>
                  )}

                  {prospect.website && (
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Globe className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Site web</p>
                        <a 
                          href={prospect.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="font-medium hover:underline"
                        >
                          {prospect.website.replace(/^https?:\/\//, '')}
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {(prospect.address || prospect.city || prospect.country) && (
                  <div className="flex items-start gap-3 pt-2 border-t">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Adresse</p>
                      <p className="font-medium">
                        {[prospect.address, prospect.city, prospect.country].filter(Boolean).join(', ')}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

            {prospect.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{prospect.notes}</p>
                </CardContent>
              </Card>
            )}

            {/* Activities Section */}
            <div className="pt-4">
              <ProspectActivities activities={activities} />
            </div>
          </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle>Statut</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Statut actuel</span>
                <Badge variant="secondary" className={statusColors[prospect.status]}>
                  {statusLabels[prospect.status]}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Source</span>
                <span className="text-sm font-medium">{sourceLabels[prospect.source]}</span>
              </div>
            </CardContent>
          </Card>

          {/* AI Score Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Score IA
              </CardTitle>
              <CardDescription>
                Estimation de la probabilité de conversion
              </CardDescription>
            </CardHeader>
            <CardContent>
              {prospect.ai_score !== null ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-bold">{prospect.ai_score}</span>
                    <span className="text-muted-foreground">/100</span>
                  </div>
                  <Progress value={prospect.ai_score} className="h-2" />
                  <p className="text-sm text-muted-foreground">
                    {prospect.ai_score >= 80 ? 'Excellent potentiel de conversion' :
                     prospect.ai_score >= 60 ? 'Bon potentiel' :
                     prospect.ai_score >= 40 ? 'Potentiel moyen' :
                     'Potentiel faible'}
                  </p>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground mb-2">Score non calculé</p>
                  <Button size="sm" variant="outline">
                    Calculer le score
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tags */}
          {prospect.tags && prospect.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {prospect.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Dates */}
          <Card>
            <CardHeader>
              <CardTitle>Historique</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Créé le</p>
                  <p className="text-sm font-medium">
                    {new Date(prospect.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
              {prospect.last_contacted_at && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Dernier contact</p>
                    <p className="text-sm font-medium">
                      {new Date(prospect.last_contacted_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
