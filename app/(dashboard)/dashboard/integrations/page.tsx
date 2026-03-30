'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Link2,
  Search,
  CheckCircle2,
  ExternalLink,
  Settings,
  Plus,
  Loader2,
  Sparkles,
  Zap,
  Trash2,
  BrainCircuit,
  AlertTriangle
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { PageHeader } from '@/components/dashboard/page-header'

// Types
interface Integration {
  id: string
  provider: string
  provider_category: string
  name: string
  description: string | null
  is_active: boolean
  settings: Record<string, any>
  created_at: string
  api_key?: string
}

// Intégrations IA populaires
const aiIntegrations = [
  { id: 'openai', name: 'OpenAI / ChatGPT', description: 'GPT-4, DALL-E, Whisper - IA conversationnelle et génération', category: 'AI', logo: '🤖', color: 'bg-emerald-500' },
  { id: 'anthropic', name: 'Claude (Anthropic)', description: 'Assistant IA avancé pour conversations et analyses', category: 'AI', logo: '🧠', color: 'bg-orange-500' },
  { id: 'google-ai', name: 'Google AI / Gemini', description: 'Gemini Pro, PaLM - Solutions IA de Google', category: 'AI', logo: '✨', color: 'bg-blue-500' },
  { id: 'midjourney', name: 'Midjourney', description: 'Génération d\'images artistiques par IA', category: 'AI', logo: '🎨', color: 'bg-purple-500' },
  { id: 'stable-diffusion', name: 'Stable Diffusion', description: 'Génération d\'images open source', category: 'AI', logo: '🖼️', color: 'bg-pink-500' },
  { id: 'elevenlabs', name: 'ElevenLabs', description: 'Synthèse vocale et clonage de voix IA', category: 'AI', logo: '🎙️', color: 'bg-indigo-500' },
  { id: 'huggingface', name: 'Hugging Face', description: 'Accès à des milliers de modèles IA', category: 'AI', logo: '🤗', color: 'bg-yellow-500' },
  { id: 'replicate', name: 'Replicate', description: 'Exécutez des modèles ML dans le cloud', category: 'AI', logo: '⚡', color: 'bg-cyan-500' },
  { id: 'cohere', name: 'Cohere', description: 'NLP et génération de texte entreprise', category: 'AI', logo: '📝', color: 'bg-rose-500' },
  { id: 'jasper', name: 'Jasper AI', description: 'Rédaction marketing automatisée', category: 'AI', logo: '✍️', color: 'bg-violet-500' },
  { id: 'copy-ai', name: 'Copy.ai', description: 'Génération de contenu marketing', category: 'AI', logo: '📄', color: 'bg-teal-500' },
  { id: 'writesonic', name: 'Writesonic', description: 'Création de contenu IA pour entreprises', category: 'AI', logo: '🚀', color: 'bg-amber-500' },
]

// Automatisations
const automationIntegrations = [
  { id: 'zapier', name: 'Zapier', description: 'Connectez des milliers d\'applications sans code', category: 'Automation', logo: '⚡', color: 'bg-orange-500' },
  { id: 'make', name: 'Make (Integromat)', description: 'Automatisations visuelles puissantes', category: 'Automation', logo: '🔄', color: 'bg-purple-500' },
  { id: 'n8n', name: 'n8n', description: 'Automatisation de workflow open source', category: 'Automation', logo: '🔗', color: 'bg-red-500' },
  { id: 'pipedream', name: 'Pipedream', description: 'Automatisation pour développeurs', category: 'Automation', logo: '💧', color: 'bg-green-500' },
  { id: 'activepieces', name: 'Activepieces', description: 'Automatisation open source no-code', category: 'Automation', logo: '🧩', color: 'bg-blue-500' },
  { id: 'ifttt', name: 'IFTTT', description: 'Automatisation simple If This Then That', category: 'Automation', logo: '🔀', color: 'bg-sky-500' },
]

// Autres intégrations
const otherIntegrations = [
  { id: 'slack', name: 'Slack', description: 'Notifications dans vos canaux Slack', category: 'Communication', logo: '💬', color: 'bg-purple-600' },
  { id: 'google-calendar', name: 'Google Calendar', description: 'Synchronisez vos rendez-vous', category: 'Productivity', logo: '📅', color: 'bg-blue-500' },
  { id: 'gmail', name: 'Gmail', description: 'Envoyez des emails depuis Gmail', category: 'Email', logo: '✉️', color: 'bg-red-500' },
  { id: 'hubspot', name: 'HubSpot', description: 'Synchronisez vos contacts CRM', category: 'CRM', logo: '🟠', color: 'bg-orange-500' },
  { id: 'salesforce', name: 'Salesforce', description: 'Intégration Salesforce CRM', category: 'CRM', logo: '☁️', color: 'bg-blue-600' },
  { id: 'stripe', name: 'Stripe', description: 'Gérez vos paiements', category: 'Payment', logo: '💳', color: 'bg-indigo-500' },
  { id: 'notion', name: 'Notion', description: 'Synchronisez notes et documents', category: 'Productivity', logo: '📓', color: 'bg-slate-700' },
  { id: 'airtable', name: 'Airtable', description: 'Base de données collaborative', category: 'Productivity', logo: '📊', color: 'bg-teal-500' },
  { id: 'twilio', name: 'Twilio', description: 'SMS et communications', category: 'Communication', logo: '📱', color: 'bg-red-600' },
  { id: 'sendgrid', name: 'SendGrid', description: 'Envoi d\'emails transactionnels', category: 'Email', logo: '📧', color: 'bg-blue-400' },
  { id: 'mailchimp', name: 'Mailchimp', description: 'Marketing email automatisé', category: 'Email', logo: '🐵', color: 'bg-yellow-400' },
  { id: 'webhooks', name: 'Webhooks', description: 'Intégrations personnalisées via webhooks', category: 'Development', logo: '🔌', color: 'bg-gray-600' },
]

const allAvailableIntegrations = [...aiIntegrations, ...automationIntegrations, ...otherIntegrations]

const categories = [
  { id: 'Tous', label: 'Tous' },
  { id: 'AI', label: 'IA' },
  { id: 'Automation', label: 'Automation' },
  { id: 'Communication', label: 'Communication' },
  { id: 'Productivity', label: 'Productivité' },
  { id: 'Email', label: 'Email' },
  { id: 'CRM', label: 'CRM' },
  { id: 'Payment', label: 'Paiement' },
  { id: 'Development', label: 'Development' }
]

export default function IntegrationsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Tous')
  const [connectedIntegrations, setConnectedIntegrations] = useState<Integration[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isConnectDialogOpen, setIsConnectDialogOpen] = useState(false)
  const [selectedIntegration, setSelectedIntegration] = useState<typeof aiIntegrations[0] | null>(null)
  const [apiKeyInput, setApiKeyInput] = useState('')

  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false)
  const [currentIntegrationId, setCurrentIntegrationId] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    loadIntegrations()
  }, [])

  async function loadIntegrations() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        if (error.code === '42P01') {
          console.warn('Table integrations non trouvée dans Supabase.')
        } else {
          console.error('Erreur chargement intégrations:', error)
        }
        setConnectedIntegrations([])
        return
      }
      setConnectedIntegrations(data || [])
    } catch (error: any) {
      console.error('Erreur:', error)
      setConnectedIntegrations([])
    } finally {
      setLoading(false)
    }
  }

  async function connectIntegration() {
    if (!selectedIntegration) return

    setSaving(true)
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) throw new Error('Non authentifié')

      let data: any, error: any

      if (isEditMode && currentIntegrationId) {
        // Update existing integration
        const response = await supabase
          .from('integrations')
          .update({
            api_key: apiKeyInput || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentIntegrationId)
          .select()
          .single()

        data = response.data
        error = response.error

        if (!error) {
          setConnectedIntegrations(connectedIntegrations.map(i =>
            i.id === currentIntegrationId ? data : i
          ))
          toast.success(`${selectedIntegration.name} mis à jour avec succès!`)
        }

      } else {
        // Insert new integration
        const response = await supabase
          .from('integrations')
          .insert({
            user_id: userData.user.id,
            provider: selectedIntegration.id,
            provider_category: selectedIntegration.category.toLowerCase(),
            name: selectedIntegration.name,
            description: selectedIntegration.description,
            is_active: true,
            api_key: apiKeyInput || null,
            settings: {}
          })
          .select()
          .single()

        data = response.data
        error = response.error

        if (!error) {
          setConnectedIntegrations([data, ...connectedIntegrations])
          toast.success(`${selectedIntegration.name} connecté avec succès!`)
        }
      }

      if (error) {
        // Log raw error for debugging
        console.error('Integrations Error:', error)
        
        // Specific message for missing table (PostgreSQL code 42P01)
        if (error.code === '42P01' || error.message?.includes('relation "integrations" does not exist')) {
          toast.error('⚠️ Table "integrations" non trouvée dans Supabase. Veuillez exécuter le SQL de création.')
          return
        }
        
        // Generic but detailed message for other errors (RLS, etc)
        toast.error(`Erreur ${error.code || ''}: ${error.message || 'Échec de connexion'}`)
        return
      }

      setIsConnectDialogOpen(false)
      setSelectedIntegration(null)
      setApiKeyInput('')
      setIsEditMode(false)
      setCurrentIntegrationId(null)

    } catch (error: any) {
      console.warn('Erreur connexion:', error)
      toast.error(error.message || '⚠️ Erreur lors de la connexion/mise à jour')
    } finally {
      setSaving(false)
    }
  }

  async function disconnectIntegration(id: string) {
    if (!confirm('Êtes-vous sûr de vouloir déconnecter cette intégration?')) return

    try {
      const { error } = await supabase
        .from('integrations')
        .delete()
        .eq('id', id)

      if (error) throw error
      setConnectedIntegrations(connectedIntegrations.filter(i => i.id !== id))
      toast.success('Intégration déconnectée')
    } catch (error: any) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la déconnexion')
    }
  }

  async function toggleIntegration(id: string, isActive: boolean) {
    try {
      const { error } = await supabase
        .from('integrations')
        .update({ is_active: isActive })
        .eq('id', id)

      if (error) throw error
      setConnectedIntegrations(connectedIntegrations.map(i =>
        i.id === id ? { ...i, is_active: isActive } : i
      ))
      toast.success(isActive ? 'Intégration activée' : 'Intégration désactivée')
    } catch (error: any) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la mise à jour')
    }
  }

  function openConnectDialog(integration: typeof aiIntegrations[0]) {
    if (integration.id === 'gmail') {
      window.location.href = '/api/auth/google'
      return
    }
    setSelectedIntegration(integration)
    setApiKeyInput('')
    setIsEditMode(false)
    setCurrentIntegrationId(null)
    setIsConnectDialogOpen(true)
  }

  function openEditDialog(integration: Integration) {
    // Find static data for this integration to get logo/name
    const integrationInfo = allAvailableIntegrations.find(i => i.id === integration.provider)

    if (!integrationInfo) return

    setSelectedIntegration(integrationInfo)
    setApiKeyInput(integration.api_key || '')
    setIsEditMode(true)
    setCurrentIntegrationId(integration.id)
    setIsConnectDialogOpen(true)
  }

  // Filtrer les intégrations
  const connectedProviders = connectedIntegrations.map(i => i.provider)

  const filteredIntegrations = allAvailableIntegrations.filter(integration => {
    const matchesSearch = integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
       integration.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'Tous' || integration.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // We filter available integrations correctly now
  // For available integrations, exclude already connected providers
  const availableIntegrations = filteredIntegrations.filter(i => !connectedProviders.includes(i.id))

  const getCategoryLabel = (catId: string) => {
    return categories.find(c => c.id.toLowerCase() === catId.toLowerCase())?.label || catId
  }

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
        title="Intégrations & Connecteurs" 
        description="Connectez vos outils préférés, configurez vos clés API IA et automatisez vos flux de travail entre différentes plateformes."
      />

      {/* AI Setup Banner */}
      {(() => {
        const hasAI = connectedIntegrations.some(i =>
          ['openai', 'anthropic', 'google-ai'].includes(i.provider) && i.is_active
        )
        const activeProvider = connectedIntegrations.find(i => ['openai', 'anthropic', 'google-ai'].includes(i.provider) && i.is_active)
        return hasAI ? (
          <Card className="border-green-200 bg-green-50/50">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
                  <BrainCircuit className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-green-800">Assistant IA activé ✅</p>
                  <p className="text-sm text-green-700">
                    Fournisseur actif : <strong>{activeProvider?.name}</strong> — L'Assistant IA et le Widget utilisent votre clé personnelle.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-orange-200 bg-orange-50/50">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-orange-800">Assistant IA non configuré</p>
                  <p className="text-sm text-orange-700">
                    Pour utiliser l'Assistant IA et le Widget, connectez <strong>OpenAI</strong>, <strong>Claude (Anthropic)</strong> ou <strong>Gemini</strong> avec votre propre clé API ci-dessous.
                  </p>
                </div>
                <Button size="sm" className="shrink-0 bg-orange-500 hover:bg-orange-600 text-white"
                  onClick={() => { setSelectedCategory('IA'); setSearchQuery('') }}>
                  <Sparkles className="mr-2 h-3 w-3" />
                  Configurer l'IA
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      })()}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Link2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{allAvailableIntegrations.length}</p>
                <p className="text-sm text-muted-foreground">Disponibles</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{connectedIntegrations.length}</p>
                <p className="text-sm text-muted-foreground">Connectées</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100">
                <Sparkles className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{aiIntegrations.length}</p>
                <p className="text-sm text-muted-foreground">Intégrations IA</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100">
                <Zap className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{automationIntegrations.length}</p>
                <p className="text-sm text-muted-foreground">Automatisations</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher une intégration IA, automatisation ou outil..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-base"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className={selectedCategory === category.id ? '' : 'bg-transparent'}
                >
                  {category.id === 'AI' && <Sparkles className="mr-1 h-3 w-3" />}
                  {category.id === 'Automation' && <Zap className="mr-1 h-3 w-3" />}
                  {category.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Connected Integrations */}
      {connectedIntegrations.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Intégrations actives ({connectedIntegrations.length})
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {connectedIntegrations.map((integration) => {
              const integrationInfo = allAvailableIntegrations.find(i => i.id === integration.provider)
              return (
                <Card key={integration.id} className="border-green-200 bg-green-50/50">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{integrationInfo?.logo || '🔌'}</span>
                        <div>
                          <p className="font-semibold">{integration.name}</p>
                          <Badge variant="secondary" className="text-xs">{getCategoryLabel(integration.provider_category)}</Badge>
                        </div>
                      </div>
                      <Switch
                        checked={integration.is_active}
                        onCheckedChange={(checked) => toggleIntegration(integration.id, checked)}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">{integration.description}</p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 bg-transparent"
                        onClick={() => openEditDialog(integration)}
                      >
                        <Settings className="mr-2 h-3 w-3" />
                        Configurer
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => disconnectIntegration(integration.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* AI Integrations Section */}
      {(selectedCategory === 'Tous' || selectedCategory === 'AI') && (
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            Intégrations IA
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {aiIntegrations
              .filter(i => !connectedProviders.includes(i.id))
              .filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                i.description.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((integration) => (
                <Card key={integration.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${integration.color}`}>
                        <span className="text-2xl">{integration.logo}</span>
                      </div>
                      <div>
                        <p className="font-semibold">{integration.name}</p>
                        <Badge variant="outline" className="text-xs">{getCategoryLabel('AI')}</Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{integration.description}</p>
                    <Button
                      className="w-full"
                      size="sm"
                      onClick={() => openConnectDialog(integration)}
                    >
                      <Link2 className="mr-2 h-3 w-3" />
                      Connecter
                    </Button>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      )}

      {/* Automation Integrations Section */}
      {(selectedCategory === 'Tous' || selectedCategory === 'Automation') && (
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5 text-orange-600" />
            Automatisations
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {automationIntegrations
              .filter(i => !connectedProviders.includes(i.id))
              .filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                i.description.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((integration) => (
                <Card key={integration.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${integration.color}`}>
                        <span className="text-2xl">{integration.logo}</span>
                      </div>
                      <div>
                        <p className="font-semibold">{integration.name}</p>
                        <Badge variant="outline" className="text-xs">Automation</Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{integration.description}</p>
                    <Button
                      className="w-full"
                      size="sm"
                      onClick={() => openConnectDialog(integration)}
                    >
                      <Link2 className="mr-2 h-3 w-3" />
                      Connecter
                    </Button>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      )}

      {/* Other Integrations Section */}
      {availableIntegrations.filter(i => i.category !== 'AI' && i.category !== 'Automation').length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Autres intégrations</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {otherIntegrations
              .filter(i => !connectedProviders.includes(i.id))
              .filter(i => selectedCategory === 'Tous' || i.category === selectedCategory)
              .filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                i.description.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((integration) => (
                <Card key={integration.id} className="hover:shadow-md transition-shadow opacity-90 hover:opacity-100">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${integration.color}`}>
                        <span className="text-2xl">{integration.logo}</span>
                      </div>
                      <div>
                        <p className="font-semibold">{integration.name}</p>
                        <Badge variant="outline" className="text-xs">{getCategoryLabel(integration.category)}</Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{integration.description}</p>
                    <Button
                      className="w-full"
                      size="sm"
                      onClick={() => openConnectDialog(integration)}
                    >
                      <Link2 className="mr-2 h-3 w-3" />
                      Connecter
                    </Button>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      )}

      {/* API Access */}
      <Card>
        <CardHeader>
          <CardTitle>Accès API</CardTitle>
          <CardDescription>
            Utilisez notre API pour créer vos propres intégrations personnalisées
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
            <div>
              <p className="font-medium">Documentation API</p>
              <p className="text-sm text-muted-foreground">
                Consultez notre documentation complète pour intégrer Workflow CRM
              </p>
            </div>
            <Button variant="outline">
              <ExternalLink className="mr-2 h-4 w-4" />
              Voir la doc
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Connect Dialog */}
      <Dialog open={isConnectDialogOpen} onOpenChange={setIsConnectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedIntegration && (
                <>
                  <span className="text-2xl">{selectedIntegration.logo}</span>
                  {isEditMode ? 'Configurer' : 'Connecter'} {selectedIntegration.name}
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedIntegration?.description}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="api-key">Clé API</Label>
              <Input
                id="api-key"
                type="password"
                placeholder={selectedIntegration?.id === 'openai' ? 'sk-proj-...' : selectedIntegration?.id === 'anthropic' ? 'sk-ant-...' : 'AIza...'}
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
              />
              {selectedIntegration && (
                <div className="text-xs text-muted-foreground space-y-1">
                  {selectedIntegration.id === 'openai' && (
                    <>
                      <p>🔑 Obtenez votre clé sur <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="text-primary underline">platform.openai.com/api-keys</a></p>
                      <p className="text-green-700 font-medium">⭐ Recommandé pour l'assistant IA — utilisera GPT-4o mini</p>
                    </>
                  )}
                  {selectedIntegration.id === 'anthropic' && (
                    <>
                      <p>🔑 Obtenez votre clé sur <a href="https://console.anthropic.com/" target="_blank" rel="noreferrer" className="text-primary underline">console.anthropic.com</a></p>
                      <p>Utilisera Claude 3 Haiku (rapide et économique)</p>
                    </>
                  )}
                  {selectedIntegration.id === 'google-ai' && (
                    <>
                      <p>🔑 Obtenez votre clé sur <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-primary underline">aistudio.google.com</a></p>
                      <p>Utilisera Gemini 1.5 Flash (gratuit jusqu'à un certain quota)</p>
                    </>
                  )}
                  {!['openai','anthropic','google-ai'].includes(selectedIntegration.id) && (
                    <p>Entrez votre clé API pour activer les fonctionnalités avancées.{isEditMode && " Laissez vide pour conserver la clé actuelle."}</p>
                  )}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConnectDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={connectIntegration} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditMode ? 'Mettre à jour' : 'Connecter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
