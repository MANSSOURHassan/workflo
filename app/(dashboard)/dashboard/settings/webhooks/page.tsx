'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import {
    ArrowLeft,
    Plus,
    Trash2,
    RefreshCw,
    Eye,
    EyeOff,
    Copy,
    CheckCircle,
    Webhook,
    Loader2
} from 'lucide-react'
import { getWebhooks, createWebhook, deleteWebhook, toggleWebhook } from '@/lib/actions/settings-advanced'
import { toast } from 'sonner'

const webhookEvents = [
    { id: 'prospect.created', label: 'Prospect créé' },
    { id: 'prospect.updated', label: 'Prospect modifié' },
    { id: 'prospect.deleted', label: 'Prospect supprimé' },
    { id: 'deal.created', label: 'Opportunité créée' },
    { id: 'deal.updated', label: 'Opportunité modifiée' },
    { id: 'deal.won', label: 'Opportunité gagnée' },
    { id: 'deal.lost', label: 'Opportunité perdue' },
    { id: 'campaign.sent', label: 'Campagne envoyée' },
    { id: 'campaign.opened', label: 'Email ouvert' },
    { id: 'campaign.clicked', label: 'Lien cliqué' },
]

export default function WebhooksPage() {
    const [loading, setLoading] = useState(true)
    const [webhooks, setWebhooks] = useState<any[]>([])
    const [showSecret, setShowSecret] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)

    // Form state
    const [isCreating, setIsCreating] = useState(false)
    const [newName, setNewName] = useState('')
    const [newUrl, setNewUrl] = useState('')
    const [selectedEvents, setSelectedEvents] = useState<string[]>([])

    useEffect(() => {
        loadWebhooks()
    }, [])

    async function loadWebhooks() {
        try {
            const { data, error } = await getWebhooks()
            if (error) {
                console.error(error)
                if (error !== 'relation "webhooks" does not exist') {
                    // toast.error('Erreur lors du chargement des webhooks')
                }
            } else {
                setWebhooks(data)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    async function handleCreateWebhook() {
        if (!newName.trim() || !newUrl.trim() || selectedEvents.length === 0) {
            toast.error('Veuillez remplir tous les champs')
            return
        }

        setIsCreating(true)
        try {
            const { data, error } = await createWebhook({
                name: newName,
                url: newUrl,
                events: selectedEvents
            })

            if (error) {
                toast.error('Erreur lors de la création')
            } else {
                toast.success('Webhook créé avec succès')
                setWebhooks([data, ...webhooks])
                // Reset form
                setNewName('')
                setNewUrl('')
                setSelectedEvents([])
            }
        } catch (error) {
            toast.error('Erreur inattendue')
        } finally {
            setIsCreating(false)
        }
    }

    async function handleDeleteWebhook(id: string) {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce webhook ?')) return

        try {
            const { error } = await deleteWebhook(id)
            if (error) {
                toast.error('Erreur lors de la suppression')
            } else {
                toast.success('Webhook supprimé')
                setWebhooks(webhooks.filter(w => w.id !== id))
            }
        } catch (error) {
            console.error(error)
        }
    }

    async function handleToggleWebhook(id: string, currentStatus: boolean) {
        // Optimistic update
        const newStatus = !currentStatus
        setWebhooks(webhooks.map(w => w.id === id ? { ...w, is_active: newStatus } : w))

        try {
            const { error } = await toggleWebhook(id, newStatus)
            if (error) {
                // Revert on error
                setWebhooks(webhooks.map(w => w.id === id ? { ...w, is_active: currentStatus } : w))
                toast.error('Erreur lors de la mise à jour')
            }
        } catch (error) {
            setWebhooks(webhooks.map(w => w.id === id ? { ...w, is_active: currentStatus } : w))
        }
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/dashboard/settings">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Liste des webhooks */}
            <div className="space-y-4">
                {loading ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : webhooks.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                            <Webhook className="h-12 w-12 mb-4 opacity-20" />
                            <p>Aucun webhook configuré.</p>
                        </CardContent>
                    </Card>
                ) : (
                    webhooks.map((webhook) => (
                        <Card key={webhook.id}>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-primary/10">
                                            <Webhook className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">{webhook.name}</CardTitle>
                                            <CardDescription className="font-mono text-xs">
                                                {webhook.url}
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <Switch
                                                checked={webhook.is_active}
                                                onCheckedChange={() => handleToggleWebhook(webhook.id, webhook.is_active)}
                                            />
                                            <span className="text-sm text-muted-foreground">
                                                {webhook.is_active ? 'Actif' : 'Inactif'}
                                            </span>
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={() => handleDeleteWebhook(webhook.id)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Événements */}
                                <div>
                                    <Label className="text-sm font-medium">Événements écoutés</Label>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {webhook.events.map((event: string) => (
                                            <span
                                                key={event}
                                                className="px-2 py-1 bg-primary/10 text-primary rounded text-xs font-medium"
                                            >
                                                {webhookEvents.find(e => e.id === event)?.label || event}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Secret */}
                                <div>
                                    <Label className="text-sm font-medium">Secret de signature</Label>
                                    <div className="flex items-center gap-2 mt-2">
                                        <Input
                                            type={showSecret === webhook.id ? 'text' : 'password'}
                                            value={webhook.secret}
                                            readOnly
                                            className="font-mono text-sm"
                                        />
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setShowSecret(showSecret === webhook.id ? null : webhook.id)}
                                        >
                                            {showSecret === webhook.id ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => copyToClipboard(webhook.secret)}
                                        >
                                            {copied ? (
                                                <CheckCircle className="h-4 w-4 text-success" />
                                            ) : (
                                                <Copy className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                </div>

                                {/* Dernière exécution */}
                                {webhook.last_triggered_at && (
                                    <p className="text-xs text-muted-foreground">
                                        Dernière exécution : {new Date(webhook.last_triggered_at).toLocaleString('fr-FR')}
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Formulaire nouveau webhook */}
            <Card>
                <CardHeader>
                    <CardTitle>Créer un nouveau webhook</CardTitle>
                    <CardDescription>
                        Configurez un endpoint pour recevoir les événements de votre CRM
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nom du webhook</Label>
                            <Input
                                id="name"
                                placeholder="Mon webhook"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="url">URL de destination</Label>
                            <Input
                                id="url"
                                placeholder="https://..."
                                value={newUrl}
                                onChange={(e) => setNewUrl(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Événements à écouter</Label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                            {webhookEvents.map((event) => (
                                <div key={event.id} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={event.id}
                                        checked={selectedEvents.includes(event.id)}
                                        onCheckedChange={(checked) => {
                                            if (checked) {
                                                setSelectedEvents([...selectedEvents, event.id])
                                            } else {
                                                setSelectedEvents(selectedEvents.filter(id => id !== event.id))
                                            }
                                        }}
                                    />
                                    <label
                                        htmlFor={event.id}
                                        className="text-sm cursor-pointer"
                                    >
                                        {event.label}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    <Button className="w-full" onClick={handleCreateWebhook} disabled={isCreating}>
                        {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <Plus className="h-4 w-4 mr-2" />
                        Créer le webhook
                    </Button>
                </CardContent>
            </Card>

            {/* Documentation */}
            <Card>
                <CardHeader>
                    <CardTitle>Documentation</CardTitle>
                    <CardDescription>
                        Comment utiliser les webhooks Workflow CRM
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-4 bg-muted rounded-lg">
                        <h4 className="font-medium mb-2">Format des requêtes</h4>
                        <pre className="text-sm text-muted-foreground overflow-x-auto">
                            {`POST votre-url
Content-Type: application/json
X-Webhook-Signature: t=1234567890,v1=abc123...
X-Webhook-Event: prospect.created

{
  "event": "prospect.created",
  "timestamp": "2026-01-26T12:00:00Z",
  "data": {
    "id": "...",
    "email": "contact@example.com",
    ...
  }
}`}
                        </pre>
                    </div>

                    <div className="p-4 bg-muted rounded-lg">
                        <h4 className="font-medium mb-2">Vérification de la signature</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                            Pour sécuriser vos webhooks, vérifiez la signature HMAC-SHA256 :
                        </p>
                        <pre className="text-sm text-muted-foreground overflow-x-auto">
                            {`signature = HMAC-SHA256(secret, timestamp + "." + body)
if signature == header["X-Webhook-Signature"].v1:
    # Webhook valide`}
                        </pre>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
