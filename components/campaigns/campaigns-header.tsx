"use client"

import React from "react"

import { useState } from "react"
import { Plus, Mail, Send } from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createCampaign } from "@/lib/actions/campaigns"
import { toast } from "sonner"

interface CampaignsHeaderProps {
  onCampaignCreated: () => void
}

export function CampaignsHeader({ onCampaignCreated }: CampaignsHeaderProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    type: "email" as "email" | "sms" | "linkedin",
    subject: "",
    content: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const payload = new FormData()
      payload.append("name", formData.name)
      payload.append("type", formData.type)
      payload.append("subject", formData.subject)
      payload.append("content", formData.content)

      const result = await createCampaign(payload)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Campagne créée avec succès")
        setOpen(false)
        setFormData({ name: "", type: "email", subject: "", content: "" })
        onCampaignCreated()
      }
    } catch {
      toast.error("Erreur lors de la création de la campagne")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle campagne
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Créer une campagne</DialogTitle>
            <DialogDescription>
              Configurez les paramètres de votre nouvelle campagne marketing.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom de la campagne</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Promotion Janvier 2024"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type de campagne</Label>
              <Select
                value={formData.type}
                onValueChange={(value: "email" | "sms" | "linkedin") =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </div>
                  </SelectItem>
                  <SelectItem value="sms">
                    <div className="flex items-center gap-2">
                      <Send className="h-4 w-4" />
                      SMS
                    </div>
                  </SelectItem>
                  <SelectItem value="linkedin">
                    <div className="flex items-center gap-2">
                      <Send className="h-4 w-4" />
                      LinkedIn
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Objet</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Objet de votre message"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Contenu</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Rédigez le contenu de votre campagne..."
                rows={5}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Création..." : "Créer la campagne"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
