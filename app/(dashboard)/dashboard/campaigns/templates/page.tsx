"use client"

import React from "react"

import { useState } from "react"
import useSWR from "swr"
import { Plus, FileText, Copy, Trash2, MoreHorizontal } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { getEmailTemplates, createEmailTemplate, deleteEmailTemplate } from "@/lib/actions/campaigns"
import { toast } from "sonner"
import type { EmailTemplate } from "@/lib/types/database"

export default function EmailTemplatesPage() {
  const { data: templates, isLoading, mutate } = useSWR<EmailTemplate[]>(
    "email-templates",
    () => getEmailTemplates()
  )
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    content: "",
    category: "general",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const result = await createEmailTemplate(formData)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Template cree avec succes")
        setOpen(false)
        setFormData({ name: "", subject: "", content: "", category: "general" })
        mutate()
      }
    } catch {
      toast.error("Erreur lors de la creation du template")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Etes-vous sur de vouloir supprimer ce template ?")) return
    
    try {
      const result = await deleteEmailTemplate(id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Template supprime")
        mutate()
      }
    } catch {
      toast.error("Erreur lors de la suppression")
    }
  }

  const handleCopy = (template: EmailTemplate) => {
    navigator.clipboard.writeText(template.content)
    toast.success("Contenu copie dans le presse-papier")
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Templates d'emails</h1>
          <p className="text-muted-foreground">
            Gerez vos modeles de courriels pour vos campagnes
          </p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau template
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Creer un template</DialogTitle>
              <DialogDescription>
                Creez un nouveau modele d'email reutilisable pour vos campagnes.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom du template</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Email de bienvenue"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="subject">Objet de l'email</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Objet du mail"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="content">Contenu</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Utilisez {{prenom}}, {{nom}}, {{entreprise}} comme variables..."
                  rows={8}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Variables disponibles : {"{{prenom}}"}, {"{{nom}}"}, {"{{entreprise}}"}, {"{{email}}"}
                </p>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creation..." : "Creer le template"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : templates && templates.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div className="space-y-1">
                  <CardTitle className="text-base">{template.name}</CardTitle>
                  <CardDescription className="line-clamp-1">
                    {template.subject}
                  </CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleCopy(template)}>
                      <Copy className="mr-2 h-4 w-4" />
                      Copier le contenu
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-destructive"
                      onClick={() => handleDelete(template.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent>
                <div className="rounded-md bg-muted p-3">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {template.content}
                  </p>
                </div>
                {template.category && (
                  <Badge variant="secondary" className="mt-3">
                    {template.category}
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground">Aucun template</h3>
            <p className="text-muted-foreground text-center mt-1">
              Creez votre premier template d'email pour accelerer vos campagnes.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
