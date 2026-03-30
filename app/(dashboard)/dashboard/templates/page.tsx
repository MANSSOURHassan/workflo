'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  FileText,
  Plus,
  MoreHorizontal,
  Trash2,
  Edit2,
  Loader2,
  Search,
  Copy,
  Mail,
  MessageSquare,
  FileCheck
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { PageHeader } from '@/components/dashboard/page-header'

interface Template {
  id: string
  name: string
  subject: string
  content: string
  variables: string[]
  is_public: boolean
  created_at: string
  updated_at: string
}

const categoryConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  'prospection': { label: 'Prospection', color: 'bg-blue-100 text-blue-700', icon: Mail },
  'relance': { label: 'Relance', color: 'bg-orange-100 text-orange-700', icon: MessageSquare },
  'commercial': { label: 'Commercial', color: 'bg-green-100 text-green-700', icon: FileCheck },
  'reunion': { label: 'Réunion', color: 'bg-purple-100 text-purple-700', icon: FileText }
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    content: '',
    is_public: false
  })
  const supabase = createClient()

  useEffect(() => {
    loadTemplates()
  }, [])

  async function loadTemplates() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setTemplates(data || [])
    } catch (error: any) {
      console.error('Erreur:', error)
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  async function saveTemplate() {
    if (!formData.name.trim() || !formData.subject.trim() || !formData.content.trim()) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }

    setSaving(true)
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) throw new Error('Non authentifié')

      // Extract variables from content (format: {{variable}})
      const variableMatches = formData.content.match(/\{\{(\w+)\}\}/g) || []
      const variables = variableMatches.map(v => v.replace(/\{\{|\}\}/g, ''))

      const templateData = {
        name: formData.name.trim(),
        subject: formData.subject.trim(),
        content: formData.content.trim(),
        variables: [...new Set(variables)],
        is_public: formData.is_public,
        user_id: userData.user.id
      }

      if (editingTemplate) {
        const { data, error } = await supabase
          .from('email_templates')
          .update(templateData)
          .eq('id', editingTemplate.id)
          .select()
          .single()

        if (error) throw error
        setTemplates(templates.map(t => t.id === editingTemplate.id ? data : t))
        toast.success('Modèle modifié!')
      } else {
        const { data, error } = await supabase
          .from('email_templates')
          .insert(templateData)
          .select()
          .single()

        if (error) throw error
        setTemplates([data, ...templates])
        toast.success('Modèle créé!')
      }

      closeDialog()
    } catch (error: any) {
      console.error('Erreur:', error)
      toast.error(error.message || 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  async function duplicateTemplate(template: Template) {
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) throw new Error('Non authentifié')

      const { data, error } = await supabase
        .from('email_templates')
        .insert({
          name: `${template.name} (copie)`,
          subject: template.subject,
          content: template.content,
          variables: template.variables,
          is_public: false,
          user_id: userData.user.id
        })
        .select()
        .single()

      if (error) throw error
      setTemplates([data, ...templates])
      toast.success('Modèle dupliqué!')
    } catch (error: any) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la duplication')
    }
  }

  async function deleteTemplate(templateId: string) {
    if (!confirm('Supprimer ce modèle?')) return

    try {
      const { error } = await supabase
        .from('email_templates')
        .delete()
        .eq('id', templateId)

      if (error) throw error
      setTemplates(templates.filter(t => t.id !== templateId))
      toast.success('Modèle supprimé')
    } catch (error: any) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la suppression')
    }
  }

  function openCreateDialog() {
    setEditingTemplate(null)
    setFormData({
      name: '',
      subject: '',
      content: '',
      is_public: false
    })
    setIsDialogOpen(true)
  }

  function openEditDialog(template: Template) {
    setEditingTemplate(template)
    setFormData({
      name: template.name,
      subject: template.subject,
      content: template.content,
      is_public: template.is_public
    })
    setIsDialogOpen(true)
  }

  function closeDialog() {
    setIsDialogOpen(false)
    setEditingTemplate(null)
  }

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.subject.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Modèles d'Emails" 
        description="Créez et organisez vos modèles d'emails pour vos campagnes et vos réponses rapides. Utilisez des variables pour personnaliser vos messages."
      >
        <Button onClick={openCreateDialog} className="bg-primary hover:shadow-lg shadow-primary/20 transition-all font-semibold">
          <Plus className="mr-2 h-4 w-4" />
          Nouveau modèle
        </Button>
      </PageHeader>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher un modèle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              Aucun modèle trouvé.<br />
              Créez votre premier modèle pour commencer.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditDialog(template)}>
                        <Edit2 className="mr-2 h-4 w-4" />
                        Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => duplicateTemplate(template)}>
                        <Copy className="mr-2 h-4 w-4" />
                        Dupliquer
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => deleteTemplate(template.id)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardTitle className="text-lg mt-3">{template.name}</CardTitle>
                <CardDescription className="line-clamp-1">{template.subject}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                  {template.content}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {template.variables?.slice(0, 3).map((variable, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {`{{${variable}}}`}
                      </Badge>
                    ))}
                    {template.variables?.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{template.variables.length - 3}
                      </Badge>
                    )}
                  </div>
                  {template.is_public && (
                    <Badge variant="secondary">Public</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? 'Modifier le modèle' : 'Nouveau modèle'}</DialogTitle>
            <DialogDescription>
              {editingTemplate ? 'Modifiez les informations du modèle' : 'Créez un nouveau modèle d\'email'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nom du modèle *</Label>
              <Input
                id="name"
                placeholder="Ex: Email de bienvenue"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="subject">Objet de l'email *</Label>
              <Input
                id="subject"
                placeholder="Ex: Bienvenue chez {{company}}"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="content">Contenu *</Label>
              <Textarea
                id="content"
                placeholder="Bonjour {{first_name}},&#10;&#10;Merci de votre intérêt pour nos services...&#10;&#10;Utilisez {{variable}} pour les champs dynamiques."
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={8}
              />
              <p className="text-xs text-muted-foreground">
                Tip: Utilisez {"{{variable}}"} pour insérer des champs dynamiques comme {"{{first_name}}"}, {"{{company}}"}, etc.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_public"
                checked={formData.is_public}
                onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                className="rounded border-gray-300"
              />
              <Label htmlFor="is_public" className="text-sm">
                Rendre ce modèle public (visible par tous les membres de l'équipe)
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Annuler
            </Button>
            <Button onClick={saveTemplate} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingTemplate ? 'Modifier' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
