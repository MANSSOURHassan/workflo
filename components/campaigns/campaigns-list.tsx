"use client"

import { useState } from "react"
import { Mail, Send, MoreHorizontal, Play, Pause, Trash2, Edit, Users } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { updateCampaignStatus, deleteCampaign } from "@/lib/actions/campaigns"
import { toast } from "sonner"
import type { Campaign } from "@/lib/types/database"

interface CampaignsListProps {
  campaigns: Campaign[]
  isLoading: boolean
  onCampaignUpdated: () => void
}

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  scheduled: "bg-warning/10 text-warning",
  active: "bg-success/10 text-success",
  paused: "bg-muted text-muted-foreground",
  completed: "bg-primary/10 text-primary",
}

const statusLabels: Record<string, string> = {
  draft: "Brouillon",
  scheduled: "Planifiée",
  active: "Active",
  paused: "En pause",
  completed: "Terminée",
}

const typeIcons: Record<string, typeof Mail> = {
  email: Mail,
  sms: Send,
  linkedin: Send,
}

export function CampaignsList({ campaigns, isLoading, onCampaignUpdated }: CampaignsListProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleStatusChange = async (id: string, status: Campaign["status"]) => {
    setLoadingId(id)
    try {
      const result = await updateCampaignStatus(id, status)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Statut mis à jour")
        onCampaignUpdated()
      }
    } catch {
      toast.error("Erreur lors de la mise à jour")
    } finally {
      setLoadingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette campagne ?")) return

    setLoadingId(id)
    try {
      const result = await deleteCampaign(id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Campagne supprimée")
        onCampaignUpdated()
      }
    } catch {
      toast.error("Erreur lors de la suppression")
    } finally {
      setLoadingId(null)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Liste des campagnes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (campaigns.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Mail className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground">Aucune campagne</h3>
          <p className="text-muted-foreground text-center mt-1">
            Créez votre première campagne pour commencer à engager vos prospects.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Liste des campagnes</CardTitle>
        <CardDescription>
          {campaigns.length} campagne{campaigns.length > 1 ? "s" : ""} au total
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campagne</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Destinataires</TableHead>
              <TableHead className="text-right">Taux d'ouverture</TableHead>
              <TableHead className="text-right">Taux de clic</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaigns.map((campaign) => {
              const TypeIcon = typeIcons[campaign.type] || Mail
              return (
                <TableRow key={campaign.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">{campaign.name}</span>
                      {campaign.subject && (
                        <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                          {campaign.subject}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <TypeIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="capitalize">{campaign.type}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[campaign.status]}>
                      {statusLabels[campaign.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      {campaign.total_recipients || 0}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {campaign.total_recipients && campaign.total_recipients > 0
                      ? `${Math.round((campaign.opened_count || 0) / campaign.total_recipients * 100)}%`
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    {campaign.total_recipients && campaign.total_recipients > 0
                      ? `${Math.round((campaign.clicked_count || 0) / campaign.total_recipients * 100)}%`
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={loadingId === campaign.id}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Modifier
                        </DropdownMenuItem>
                        {campaign.status === "draft" && (
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(campaign.id, "active")}
                          >
                            <Play className="mr-2 h-4 w-4" />
                            Lancer
                          </DropdownMenuItem>
                        )}
                        {campaign.status === "active" && (
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(campaign.id, "paused")}
                          >
                            <Pause className="mr-2 h-4 w-4" />
                            Mettre en pause
                          </DropdownMenuItem>
                        )}
                        {campaign.status === "paused" && (
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(campaign.id, "active")}
                          >
                            <Play className="mr-2 h-4 w-4" />
                            Reprendre
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDelete(campaign.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
