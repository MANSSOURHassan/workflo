'use client'

import Link from 'next/link'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Mail,
  Phone,
  Building2,
  MapPin,
  Globe,
  Linkedin,
  Calendar,
  Sparkles,
  Pencil,
  ExternalLink,
  Tag,
  Info,
  User,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Prospect } from '@/lib/types/database'

interface ProspectSheetProps {
  prospect: Prospect | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const statusColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800',
  contacted: 'bg-yellow-100 text-yellow-800',
  qualified: 'bg-green-100 text-green-800',
  converted: 'bg-purple-100 text-purple-800',
  lost: 'bg-gray-100 text-gray-800',
}

const statusLabels: Record<string, string> = {
  new: 'Nouveau',
  contacted: 'Contacté',
  qualified: 'Qualifié',
  converted: 'Converti',
  lost: 'Perdu',
}

const sourceLabels: Record<string, string> = {
  manual: 'Manuel',
  import: 'Import',
  website: 'Site web',
  linkedin: 'LinkedIn',
  referral: 'Recommandation',
  api: 'API',
}

function InfoRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ElementType
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 mt-0.5">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="text-sm font-medium break-words">{children}</div>
      </div>
    </div>
  )
}

export function ProspectSheet({ prospect, open, onOpenChange }: ProspectSheetProps) {
  if (!prospect) return null

  const fullName =
    prospect.first_name && prospect.last_name
      ? `${prospect.first_name} ${prospect.last_name}`
      : prospect.email

  const initials =
    prospect.first_name && prospect.last_name
      ? `${prospect.first_name[0]}${prospect.last_name[0]}`
      : prospect.email.slice(0, 2).toUpperCase()

  const addressParts = [prospect.address, prospect.city, prospect.country].filter(Boolean)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0">
        {/* Header gradient */}
        <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background p-6 pb-4">
          <DialogHeader>
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-xl font-bold shadow-md">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <DialogTitle className="text-lg leading-tight text-left">{fullName}</DialogTitle>
                {prospect.job_title && prospect.company && (
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {prospect.job_title} · {prospect.company}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <Badge
                    variant="secondary"
                    className={cn('text-xs font-medium', statusColors[prospect.status])}
                  >
                    {statusLabels[prospect.status]}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {sourceLabels[prospect.source]}
                  </Badge>
                </div>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-5">
          {/* Action buttons */}
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm" className="flex-1">
              <Link href={`/dashboard/prospects/${prospect.id}/edit`}>
                <Pencil className="mr-2 h-3.5 w-3.5" />
                Modifier
              </Link>
            </Button>
            <Button asChild size="sm" className="flex-1">
              <Link href={`/dashboard/prospects/${prospect.id}`}>
                <ExternalLink className="mr-2 h-3.5 w-3.5" />
                Fiche complète
              </Link>
            </Button>
          </div>

          <Separator />

          {/* Contact Info */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Contact
            </h3>
            <div className="space-y-3">
              <InfoRow icon={Mail} label="Email">
                <a href={`mailto:${prospect.email}`} className="hover:underline text-primary">
                  {prospect.email}
                </a>
              </InfoRow>

              {prospect.phone && (
                <InfoRow icon={Phone} label="Téléphone">
                  <a href={`tel:${prospect.phone}`} className="hover:underline">
                    {prospect.phone}
                  </a>
                </InfoRow>
              )}

              {prospect.linkedin_url && (
                <InfoRow icon={Linkedin} label="LinkedIn">
                  <a
                    href={prospect.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline text-primary"
                  >
                    Voir le profil
                  </a>
                </InfoRow>
              )}

              {prospect.website && (
                <InfoRow icon={Globe} label="Site web">
                  <a
                    href={prospect.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline text-primary"
                  >
                    {prospect.website.replace(/^https?:\/\//, '')}
                  </a>
                </InfoRow>
              )}
            </div>
          </div>

          {/* Company / Address */}
          {(prospect.company || addressParts.length > 0) && (
            <>
              <Separator />
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Entreprise
                </h3>
                <div className="space-y-3">
                  {prospect.company && (
                    <InfoRow icon={Building2} label="Entreprise">
                      {prospect.company}
                      {prospect.job_title && (
                        <span className="text-muted-foreground text-xs ml-1">
                          · {prospect.job_title}
                        </span>
                      )}
                    </InfoRow>
                  )}
                  {addressParts.length > 0 && (
                    <InfoRow icon={MapPin} label="Adresse">
                      {addressParts.join(', ')}
                    </InfoRow>
                  )}
                </div>
              </div>
            </>
          )}

          {/* AI Score */}
          {prospect.ai_score !== null && (
            <>
              <Separator />
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  Score IA
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">{prospect.ai_score}</span>
                    <span className="text-sm text-muted-foreground">/100</span>
                  </div>
                  <Progress value={prospect.ai_score} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {prospect.ai_score >= 80
                      ? 'Excellent potentiel de conversion'
                      : prospect.ai_score >= 60
                      ? 'Bon potentiel'
                      : prospect.ai_score >= 40
                      ? 'Potentiel moyen'
                      : 'Potentiel faible'}
                  </p>
                  {prospect.ai_reasoning && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                            <Info className="h-3 w-3" />
                            Voir l&apos;analyse
                          </button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-[250px] p-3 text-xs" side="top">
                          {prospect.ai_reasoning}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Tags */}
          {prospect.tags && prospect.tags.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5" />
                  Tags
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {prospect.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Notes */}
          {prospect.notes && (
            <>
              <Separator />
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Notes
                </h3>
                <p className="text-sm whitespace-pre-wrap text-muted-foreground leading-relaxed">
                  {prospect.notes}
                </p>
              </div>
            </>
          )}

          {/* Dates */}
          <Separator />
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              Historique
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Créé le</span>
                <span className="font-medium">
                  {new Date(prospect.created_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
              {prospect.last_contacted_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dernier contact</span>
                  <span className="font-medium">
                    {new Date(prospect.last_contacted_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              )}
              {prospect.assigned_to_member && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Assigné à</span>
                  <div className="flex items-center gap-1.5">
                    <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center text-[9px] font-bold text-primary">
                      {prospect.assigned_to_member.first_name?.[0] || <User className="h-3 w-3" />}
                    </div>
                    <span className="font-medium">
                      {prospect.assigned_to_member.first_name} {prospect.assigned_to_member.last_name}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
