'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useMemo } from 'react'
import useSWR, { mutate } from 'swr'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Bot,
  Mail,
  Clock,
  Zap,
  Play,
  Pause,
  Plus,
  Calendar,
  Users,
  MailOpen,
  MousePointerClick,
  Loader2,
  Trash2
} from 'lucide-react'
import { toast } from 'sonner'
import { getAutomations, createAutomation, deleteAutomation, updateAutomation, AutopilotRule } from '@/lib/actions/autopilot'
import { PageHeader } from '@/components/dashboard/page-header'

export default function AutopilotPage() {
  const { data: automations = [], isLoading: loading, error } = useSWR<AutopilotRule[]>(
    'autopilot-rules',
    async () => {
      const result = await getAutomations();
      if (result.error) throw new Error(result.error);
      return result.data || [];
    },
    {
      refreshInterval: 10000, // Raîchir toutes les 10 secondes
      revalidateOnFocus: true
    }
  )

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    trigger_type: 'event'
  })

  // Log for debugging
  useEffect(() => {
    if (error) {
      if (error.message.includes('relation "autopilot_rules" does not exist')) {
        toast.error('Table manquante: veuillez exécuter missing-tables.sql')
      } else {
        toast.error("Erreur de chargement: " + error.message)
      }
    }
  }, [error])


  async function handleCreate() {
    if (!formData.name) return toast.error("Le nom est requis")

    setCreating(true)
    const result = await createAutomation({
      name: formData.name,
      description: formData.description,
      trigger_type: formData.trigger_type,
      is_active: true
    })

    if (result.data) {
      mutate('autopilot-rules')
      setIsCreateOpen(false)
      setFormData({ name: '', description: '', trigger_type: 'event' })
      toast.success("Automatisation créée avec succès")
    } else {
      toast.error(result.error || "Erreur lors de la création")
    }
    setCreating(false)
  }

  async function handleQuickSetup(type: 'welcome' | 'followup' | 'demo') {
    const templates = {
      welcome: {
        name: 'Bienvenue Nouveaux Prospects',
        description: 'Séquence de bienvenue automatique pour tout nouveau prospect inscrit.',
        trigger_type: 'event'
      },
      followup: {
        name: 'Relance Inactifs',
        description: 'Relance automatique après 7 jours sans activité.',
        trigger_type: 'schedule'
      },
      demo: {
        name: 'Suivi Post-Démo',
        description: 'Email de remerciement et ressources après une démonstration.',
        trigger_type: 'event'
      }
    }

    const template = templates[type]
    const result = await createAutomation(template)

    if (result.data) {
      mutate('autopilot-rules')
      toast.success("Automatisation configurée depuis le modèle")
    } else {
      toast.error(result.error || "Erreur lors de la création")
    }
  }

  async function toggleStatus(id: string, currentStatus: boolean) {
    // Optimistic update using mutate
    mutate('autopilot-rules', automations.map(a => a.id === id ? { ...a, is_active: !currentStatus } : a), false)

    const result = await updateAutomation(id, { is_active: !currentStatus })
    if (result.success) {
      mutate('autopilot-rules')
      toast.success(currentStatus ? "Automation désactivée" : "Automation activée")
    } else {
      toast.error(result.error || "Erreur lors de la mise à jour")
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette automation ?")) return
    const result = await deleteAutomation(id)
    if (result.success) {
      mutate('autopilot-rules')
      toast.success("Automation supprimée")
    } else {
      toast.error(result.error || "Erreur lors de la suppression")
    }
  }

  const totalStats = useMemo(() => {
    const sent = automations.reduce((acc, a) => acc + (a.stats?.sent || 0), 0)
    const opened = automations.reduce((acc, a) => acc + (a.stats?.opened || 0), 0)
    const clicked = automations.reduce((acc, a) => acc + (a.stats?.clicked || 0), 0)
    const activeConfig = automations.filter(a => a.is_active).length

    return {
      sent,
      opened,
      clicked,
      activeConfig,
      openRate: sent > 0 ? Math.round((opened / sent) * 100) : 0,
      clickRate: sent > 0 ? Math.round((clicked / sent) * 100) : 0
    }
  }, [automations])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Autopilot" 
        description="Automatisez vos processus de vente et vos relances clients pour ne plus jamais manquer une opportunité."
      >
        <Button onClick={() => setIsCreateOpen(true)} className="bg-primary hover:shadow-lg shadow-primary/20 transition-all font-semibold">
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle automation
        </Button>
      </PageHeader>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalStats.sent}</p>
                <p className="text-sm text-muted-foreground">Emails envoyés</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
                <MailOpen className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalStats.openRate}%</p>
                <p className="text-sm text-muted-foreground">Taux d'ouverture</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                <MousePointerClick className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalStats.clickRate}%</p>
                <p className="text-sm text-muted-foreground">Taux de clic</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100">
                <Zap className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalStats.activeConfig}</p>
                <p className="text-sm text-muted-foreground">Automations actives</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Automations List */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Mes automations</CardTitle>
            <CardDescription>Gérez vos séquences d'emails automatiques</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {automations.map((automation) => (
                <div
                  key={automation.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${automation.is_active ? 'bg-green-100' : 'bg-slate-100'}`}>
                      <Bot className={`h-6 w-6 ${automation.is_active ? 'text-green-600' : 'text-slate-400'}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{automation.name}</h3>
                        <Badge variant={automation.is_active ? 'default' : 'secondary'}>
                          {automation.is_active ? 'Actif' : 'En pause'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{automation.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Zap className="h-3 w-3" />
                          {automation.trigger_type}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="hidden md:flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <p className="font-semibold">{automation.stats?.sent || 0}</p>
                        <p className="text-xs text-muted-foreground">Envoyés</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-green-600">{automation.stats?.opened || 0}</p>
                        <p className="text-xs text-muted-foreground">Ouverts</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-blue-600">{automation.stats?.clicked || 0}</p>
                        <p className="text-xs text-muted-foreground">Cliqués</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleStatus(automation.id, automation.is_active)}
                      >
                        {automation.is_active ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(automation.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {automations.length === 0 && (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                  <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">Aucune automatisation</h3>
                  <p className="text-muted-foreground">Commencez par en créer une nouvelle.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Setup */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration rapide</CardTitle>
          <CardDescription>Paramétrez votre première automation en quelques clics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div
              onClick={() => handleQuickSetup('welcome')}
              className="group flex flex-col items-center text-center p-6 rounded-lg border-2 border-dashed hover:border-primary/50 transition-colors cursor-pointer hover:bg-muted/50"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 mb-4 group-hover:scale-110 transition-transform">
                <Users className="h-7 w-7 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">Bienvenue</h3>
              <p className="text-sm text-muted-foreground">
                Accueillez automatiquement vos nouveaux prospects
              </p>
            </div>
            <div
              onClick={() => handleQuickSetup('followup')}
              className="group flex flex-col items-center text-center p-6 rounded-lg border-2 border-dashed hover:border-primary/50 transition-colors cursor-pointer hover:bg-muted/50"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-100 mb-4 group-hover:scale-110 transition-transform">
                <Clock className="h-7 w-7 text-orange-600" />
              </div>
              <h3 className="font-semibold mb-2">Relance</h3>
              <p className="text-sm text-muted-foreground">
                Relancez les prospects inactifs automatiquement
              </p>
            </div>
            <div
              onClick={() => handleQuickSetup('demo')}
              className="group flex flex-col items-center text-center p-6 rounded-lg border-2 border-dashed hover:border-primary/50 transition-colors cursor-pointer hover:bg-muted/50"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 mb-4 group-hover:scale-110 transition-transform">
                <Calendar className="h-7 w-7 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">Post-démo</h3>
              <p className="text-sm text-muted-foreground">
                Envoyez un suivi après chaque démonstration
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle automatisation</DialogTitle>
            <DialogDescription>Créez une nouvelle règle d'envoi automatique</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nom</Label>
              <Input
                placeholder="Ex: Relance devis"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Description courte..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Déclencheur</Label>
              <Select
                value={formData.trigger_type}
                onValueChange={(val) => setFormData({ ...formData, trigger_type: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="event">Événement (ex: Inscription)</SelectItem>
                  <SelectItem value="schedule">Planifié (ex: Chaque Lundi)</SelectItem>
                  <SelectItem value="condition">Condition (ex: Tag ajouté)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Annuler</Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
