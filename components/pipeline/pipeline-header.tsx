"use client"

import React from "react"

import { useState } from "react"
import { Plus, Settings, LayoutGrid } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createDeal, createPipeline, createDefaultPipelineWithStages } from "@/lib/actions/pipeline"
import { toast } from "sonner"
import type { Pipeline, PipelineStage } from "@/lib/types/database"

interface PipelineHeaderProps {
  pipeline: (Pipeline & { stages: PipelineStage[] }) | null | undefined
  onPipelineUpdated: () => void
}

export function PipelineHeader({ pipeline, onPipelineUpdated }: PipelineHeaderProps) {
  const [openDeal, setOpenDeal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [dealData, setDealData] = useState({
    title: "",
    value: "",
    currency: "EUR",
    company: "",
    contact_name: "",
    contact_email: "",
  })

  const handleCreatePipeline = async () => {
    setIsLoading(true)
    try {
      const result = await createDefaultPipelineWithStages()
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Pipeline cree avec succes")
        onPipelineUpdated()
      }
    } catch {
      toast.error("Erreur lors de la creation du pipeline")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pipeline) return
    
    setIsLoading(true)
    try {
      const result = await createDeal({
        ...dealData,
        pipeline_id: pipeline.id,
        value: dealData.value ? parseFloat(dealData.value) : 0,
        stage_id: pipeline.stages?.[0]?.id || "", // Default to first stage
      })
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Affaire creee avec succes")
        setOpenDeal(false)
        setDealData({
          title: "",
          value: "",
          currency: "EUR",
          company: "",
          contact_name: "",
          contact_email: "",
        })
        onPipelineUpdated()
      }
    } catch {
      toast.error("Erreur lors de la creation de l'affaire")
    } finally {
      setIsLoading(false)
    }
  }

  if (!pipeline) {
    return (
      <div className="flex justify-end w-full">
        <Button onClick={handleCreatePipeline} disabled={isLoading}>
          <LayoutGrid className="mr-2 h-4 w-4" />
          {isLoading ? "Creation..." : "Creer mon pipeline"}
        </Button>
      </div>
    )
  }

  return (
    <div className="flex justify-end w-full">
      
      <div className="flex items-center gap-2">
        <Dialog open={openDeal} onOpenChange={setOpenDeal}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle affaire
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Creer une affaire</DialogTitle>
              <DialogDescription>
                Ajoutez une nouvelle opportunite commerciale a votre pipeline.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateDeal} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titre de l'affaire</Label>
                <Input
                  id="title"
                  value={dealData.title}
                  onChange={(e) => setDealData({ ...dealData, title: e.target.value })}
                  placeholder="Ex: Contrat annuel Entreprise X"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="value">Valeur</Label>
                  <Input
                    id="value"
                    type="number"
                    value={dealData.value}
                    onChange={(e) => setDealData({ ...dealData, value: e.target.value })}
                    placeholder="10000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Devise</Label>
                  <Select
                    value={dealData.currency}
                    onValueChange={(value) => setDealData({ ...dealData, currency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="company">Entreprise</Label>
                <Input
                  id="company"
                  value={dealData.company}
                  onChange={(e) => setDealData({ ...dealData, company: e.target.value })}
                  placeholder="Nom de l'entreprise"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact_name">Contact</Label>
                  <Input
                    id="contact_name"
                    value={dealData.contact_name}
                    onChange={(e) => setDealData({ ...dealData, contact_name: e.target.value })}
                    placeholder="Nom du contact"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_email">Email</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={dealData.contact_email}
                    onChange={(e) => setDealData({ ...dealData, contact_email: e.target.value })}
                    placeholder="email@exemple.com"
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpenDeal(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Creation..." : "Creer l'affaire"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
