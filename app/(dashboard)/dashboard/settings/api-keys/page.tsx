'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
    ArrowLeft,
    Copy,
    CheckCircle,
    Key,
    Plus,
    Trash2,
    Eye,
    EyeOff,
    Loader2
} from 'lucide-react'
import { getApiKeys, createApiKey, deleteApiKey } from '@/lib/actions/settings-advanced'
import { toast } from 'sonner'

export default function APIKeysPage() {
    const [loading, setLoading] = useState(true)
    const [keys, setKeys] = useState<any[]>([])
    const [showKey, setShowKey] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)
    const [isCreating, setIsCreating] = useState(false)
    const [showCreateDialog, setShowCreateDialog] = useState(false)
    const [newKeyName, setNewKeyName] = useState('')

    useEffect(() => {
        loadKeys()
    }, [])

    async function loadKeys() {
        try {
            const { data, error } = await getApiKeys()
            if (error) {
                console.error(error)
                if (error !== 'relation "api_keys" does not exist') {
                    // toast.error('Erreur lors du chargement des clés')
                }
            } else {
                setKeys(data)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleCreateKey = async () => {
        if (!newKeyName.trim()) return

        setIsCreating(true)
        try {
            const { data, error } = await createApiKey(newKeyName)
            if (error) {
                toast.error('Erreur lors de la création de la clé')
            } else {
                toast.success('Clé API créée avec succès')
                setKeys([data, ...keys])
                setShowCreateDialog(false)
                setNewKeyName('')
            }
        } catch (error) {
            toast.error('Erreur inattendue')
        } finally {
            setIsCreating(false)
        }
    }

    const handleDeleteKey = async (id: string) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette clé ?')) return

        try {
            const { error } = await deleteApiKey(id)
            if (error) {
                toast.error('Erreur lors de la suppression')
            } else {
                toast.success('Clé supprimée')
                setKeys(keys.filter(k => k.id !== id))
            }
        } catch (error) {
            console.error(error)
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
                <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nouvelle clé
                </Button>
            </div>

            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Créer une nouvelle clé API</DialogTitle>
                        <DialogDescription>
                            Donnez un nom à votre clé pour l'identifier facilement.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Nom de la clé</Label>
                            <Input
                                placeholder="ex: Intégration Zapier"
                                value={newKeyName}
                                onChange={(e) => setNewKeyName(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Annuler</Button>
                        <Button onClick={handleCreateKey} disabled={isCreating || !newKeyName.trim()}>
                            {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Créer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Liste des clés */}
            <div className="space-y-4">
                {loading ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : keys.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                            <Key className="h-12 w-12 mb-4 opacity-20" />
                            <p>Aucune clé API créée.</p>
                            <Button variant="link" onClick={() => setShowCreateDialog(true)}>Créer votre première clé</Button>
                        </CardContent>
                    </Card>
                ) : (
                    keys.map((apiKey) => (
                        <Card key={apiKey.id}>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-primary/10">
                                            <Key className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-medium">{apiKey.name}</h3>
                                            <p className="text-xs text-muted-foreground">
                                                Créée le {new Date(apiKey.created_at).toLocaleDateString('fr-FR')}
                                                {apiKey.last_used_at && (
                                                    <> • Dernière utilisation : {new Date(apiKey.last_used_at).toLocaleDateString('fr-FR')}</>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteKey(apiKey.id)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                                <div className="flex items-center gap-2 mt-4">
                                    <Input
                                        type={showKey === apiKey.id ? 'text' : 'password'}
                                        value={apiKey.key}
                                        readOnly
                                        className="font-mono text-sm"
                                    />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setShowKey(showKey === apiKey.id ? null : apiKey.id)}
                                    >
                                        {showKey === apiKey.id ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => copyToClipboard(apiKey.key)}
                                    >
                                        {copied ? (
                                            <CheckCircle className="h-4 w-4 text-success" />
                                        ) : (
                                            <Copy className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Documentation API */}
            <Card>
                <CardHeader>
                    <CardTitle>Documentation API REST</CardTitle>
                    <CardDescription>
                        Utilisez l'API pour intégrer Workflow CRM à vos applications
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <h4 className="font-medium mb-2">Base URL</h4>
                        <div className="flex items-center gap-2">
                            <code className="bg-muted px-3 py-2 rounded text-sm flex-1">
                                https://votre-domaine.com/api/v1
                            </code>
                            <Button variant="ghost" size="icon" onClick={() => copyToClipboard('https://votre-domaine.com/api/v1')}>
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-medium mb-2">Authentification</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                            Incluez votre clé API dans le header Authorization :
                        </p>
                        <pre className="bg-muted p-4 rounded text-sm overflow-x-auto">
                            {`Authorization: Bearer wcrm_live_votre_cle_api`}
                        </pre>
                    </div>

                    <div>
                        <h4 className="font-medium mb-3">Endpoints disponibles</h4>
                        <div className="space-y-3">
                            <div className="p-3 bg-muted rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="px-2 py-0.5 bg-green-500/20 text-green-600 rounded text-xs font-medium">GET</span>
                                    <code className="text-sm">/api/v1/prospects</code>
                                </div>
                                <p className="text-xs text-muted-foreground">Liste tous les prospects (paginated)</p>
                            </div>
                            <div className="p-3 bg-muted rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="px-2 py-0.5 bg-blue-500/20 text-blue-600 rounded text-xs font-medium">POST</span>
                                    <code className="text-sm">/api/v1/prospects</code>
                                </div>
                                <p className="text-xs text-muted-foreground">Crée un nouveau prospect</p>
                            </div>
                            <div className="p-3 bg-muted rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="px-2 py-0.5 bg-green-500/20 text-green-600 rounded text-xs font-medium">GET</span>
                                    <code className="text-sm">/api/v1/prospects/:id</code>
                                </div>
                                <p className="text-xs text-muted-foreground">Récupère un prospect par ID</p>
                            </div>
                            <div className="p-3 bg-muted rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-600 rounded text-xs font-medium">PUT</span>
                                    <code className="text-sm">/api/v1/prospects/:id</code>
                                </div>
                                <p className="text-xs text-muted-foreground">Met à jour un prospect</p>
                            </div>
                            <div className="p-3 bg-muted rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="px-2 py-0.5 bg-red-500/20 text-red-600 rounded text-xs font-medium">DELETE</span>
                                    <code className="text-sm">/api/v1/prospects/:id</code>
                                </div>
                                <p className="text-xs text-muted-foreground">Supprime un prospect</p>
                            </div>
                            <div className="p-3 bg-muted rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="px-2 py-0.5 bg-green-500/20 text-green-600 rounded text-xs font-medium">GET</span>
                                    <code className="text-sm">/api/v1/deals</code>
                                </div>
                                <p className="text-xs text-muted-foreground">Liste toutes les opportunités</p>
                            </div>
                            <div className="p-3 bg-muted rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="px-2 py-0.5 bg-green-500/20 text-green-600 rounded text-xs font-medium">GET</span>
                                    <code className="text-sm">/api/v1/campaigns</code>
                                </div>
                                <p className="text-xs text-muted-foreground">Liste toutes les campagnes</p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-medium mb-2">Exemple de requête</h4>
                        <pre className="bg-muted p-4 rounded text-sm overflow-x-auto">
                            {`curl -X GET "https://votre-domaine.com/api/v1/prospects?page=1&limit=10" \\
  -H "Authorization: Bearer wcrm_live_votre_cle_api" \\
  -H "Content-Type: application/json"`}
                        </pre>
                    </div>

                    <div>
                        <h4 className="font-medium mb-2">Exemple de réponse</h4>
                        <pre className="bg-muted p-4 rounded text-sm overflow-x-auto">
                            {`{
  "data": [
    {
      "id": "uuid-1234",
      "email": "contact@example.com",
      "first_name": "Jean",
      "last_name": "Dupont",
      "company": "Acme Corp",
      "status": "qualified",
      "ai_score": 85
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 150,
    "pages": 15
  }
}`}
                        </pre>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
