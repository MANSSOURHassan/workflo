"use client"

import React from "react"

import { useState } from "react"
import { MoreHorizontal, GripVertical, Trash2, Edit, Eye, Building2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { updateDealStage, deleteDeal } from "@/lib/actions/pipeline"
import { toast } from "sonner"
import type { Pipeline, PipelineStage, Deal } from "@/lib/types/database"

interface PipelineKanbanProps {
  pipeline: Pipeline | null | undefined
  stages: PipelineStage[]
  deals: Deal[]
  onDealsUpdated: () => void
  onStagesUpdated: () => void
}

const stageColors: Record<string, string> = {
  "Prospection": "bg-muted",
  "Qualification": "bg-chart-1/20",
  "Proposition": "bg-chart-2/20",
  "Negociation": "bg-warning/20",
  "Gagne": "bg-success/20",
  "Perdu": "bg-destructive/20",
}

export function PipelineKanban({
  pipeline,
  stages,
  deals,
  onDealsUpdated,
}: PipelineKanbanProps) {
  const [draggedDeal, setDraggedDeal] = useState<Deal | null>(null)
  const [loadingDealId, setLoadingDealId] = useState<string | null>(null)

  if (!pipeline || stages.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Building2 className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Pipeline non configuré</h3>
          <p className="text-muted-foreground text-center mt-1 max-w-sm">
            Créez votre pipeline pour commencer à gérer vos opportunités commerciales.
          </p>
        </CardContent>
      </Card>
    )
  }

  const getDealsByStage = (stageId: string) => {
    return deals.filter(deal => deal.stage_id === stageId)
  }

  const getStageValue = (stageId: string) => {
    return getDealsByStage(stageId).reduce((sum, deal) => sum + (deal.value || 0), 0)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(value)
  }

  const handleDragStart = (deal: Deal) => {
    setDraggedDeal(deal)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (stageId: string) => {
    if (!draggedDeal || draggedDeal.stage_id === stageId) {
      setDraggedDeal(null)
      return
    }

    setLoadingDealId(draggedDeal.id)
    try {
      const result = await updateDealStage(draggedDeal.id, stageId)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Affaire déplacée")
        onDealsUpdated()
      }
    } catch {
      toast.error("Erreur lors du déplacement")
    } finally {
      setLoadingDealId(null)
      setDraggedDeal(null)
    }
  }

  const handleDeleteDeal = async (dealId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette affaire ?")) return

    setLoadingDealId(dealId)
    try {
      const result = await deleteDeal(dealId)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Affaire supprimée")
        onDealsUpdated()
      }
    } catch {
      toast.error("Erreur lors de la suppression")
    } finally {
      setLoadingDealId(null)
    }
  }

  return (
    <ScrollArea className="w-full">
      <div className="flex gap-4 pb-4 min-w-max">
        {stages.map((stage) => {
          const stageDeals = getDealsByStage(stage.id)
          const stageValue = getStageValue(stage.id)
          const bgColor = stageColors[stage.name] || "bg-muted"

          return (
            <div
              key={stage.id}
              className="flex-shrink-0 w-[300px]"
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(stage.id)}
            >
              <div className={`rounded-lg ${bgColor} p-4`}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-foreground">{stage.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {stageDeals.length} affaire{stageDeals.length > 1 ? "s" : ""} - {formatCurrency(stageValue)}
                    </p>
                  </div>
                  <Badge variant="secondary">{stageDeals.length}</Badge>
                </div>

                <div className="space-y-3">
                  {stageDeals.map((deal) => (
                    <Card
                      key={deal.id}
                      draggable
                      onDragStart={() => handleDragStart(deal)}
                      className={`cursor-grab active:cursor-grabbing transition-all ${loadingDealId === deal.id ? "opacity-50" : ""
                        } ${draggedDeal?.id === deal.id ? "ring-2 ring-primary" : ""}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <div className="min-w-0">
                              <h4 className="font-medium text-foreground text-sm truncate">
                                {deal.name}
                              </h4>
                              {deal.prospect?.company && (
                                <p className="text-xs text-muted-foreground truncate">
                                  {deal.prospect?.company}
                                </p>
                              )}
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" />
                                Voir les détails
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Modifier
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDeleteDeal(deal.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {deal.value && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-sm font-semibold text-foreground">
                              {formatCurrency(deal.value)}
                            </p>
                          </div>
                        )}

                        {deal.prospect && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Contact: {deal.prospect.first_name} {deal.prospect.last_name}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}

                  {stageDeals.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-lg">
                      Déposez une affaire ici
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  )
}
