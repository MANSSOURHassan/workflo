'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
  MessageSquare,
  Bot,
  Settings,
  Code,
  Palette,
  Globe,
  Users,
  TrendingUp,
  Clock,
  Copy,
  ExternalLink,
  Check,
  Loader2,
  Send,
  User
} from 'lucide-react'

export default function ChatbotPage() {
  const [isEnabled, setIsEnabled] = useState(true)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    conversations: 0,
    leads: 0,
    conversion: '0%',
    avgTime: '45s'
  })
  const [settings, setSettings] = useState({
    botName: 'Assistant Workflow CRM',
    welcomeMessage: 'Bonjour ! Comment puis-je vous aider ?',
    primaryColor: '#4F46E5',
    collectEmails: true
  })

  // Simulated live preview messages
  const [previewMessages, setPreviewMessages] = useState([
    { id: '1', role: 'bot', content: 'Bonjour ! Comment puis-je vous aider ?' }
  ])
  const [previewInput, setPreviewInput] = useState('')
  const previewScrollRef = useRef<HTMLDivElement>(null)

  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (previewScrollRef.current) {
      previewScrollRef.current.scrollTop = previewScrollRef.current.scrollHeight
    }
  }, [previewMessages])

  async function loadData() {
    console.log('Chatbot: Début chargement...')
    setLoading(true)
    try {
      const { data: conversations, error: convError, count } = await supabase
        .from('chatbot_conversations')
        .select('*', { count: 'exact', head: false })

      if (convError) {
        console.error('Chatbot: Erreur stats brute:', convError)
        console.log('Chatbot: Code stats:', convError?.code)
        console.log('Chatbot: Message stats:', convError?.message)
        console.log('Chatbot: Détails stats:', convError?.details)

        if (convError.code === '42P01') {
          toast.error('⚠️ Table "chatbot_conversations" manquante. Exécutez le script SQL.')
          return
        }
        throw convError
      }

      console.log('Chatbot: Stats reçues, conversations:', count)

      setStats(prev => ({
        ...prev,
        conversations: count || 0,
        leads: conversations?.filter(c => c.visitor_email).length || 0
      }))

      // Load settings from integrations
      const { data: integration, error: intError } = await supabase
        .from('integrations')
        .select('*')
        .eq('provider', 'chatbot_widget')
        .single()

      if (intError && intError.code !== 'PGRST116') {
        console.error('Chatbot: Erreur intégrations brute:', intError)
      }

      if (integration && integration.settings) {
        console.log('Chatbot: Paramètres chargés')
        setSettings(prev => ({ ...prev, ...integration.settings }))
        setIsEnabled(integration.is_active)
        setPreviewMessages([{ id: '1', role: 'bot', content: integration.settings.welcomeMessage || 'Bonjour !' }])
      }
    } catch (e: any) {
      console.error('Chatbot - Erreur attrapée:', e)
      const errorMsg = e.message || e.details || e.code || "Erreur inconnue"
      toast.error(`Erreur chatbot: ${errorMsg}`)
    } finally {
      setLoading(false)
    }
  }

  async function saveSettings() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error("Veuillez vous connecter")
        return
      }

      const { error } = await supabase
        .from('integrations')
        .upsert({
          user_id: user.id,
          provider: 'chatbot_widget',
          provider_category: 'communication',
          is_active: isEnabled,
          settings: settings,
          name: 'Chatbot Widget'
        }, { onConflict: 'user_id,provider' })

      if (error) throw error
      toast.success("Paramètres enregistrés avec succès")
    } catch (error: any) {
      console.error('Chatbot - Erreur sauvegarde brute:', error)
      console.log('Chatbot - Code erreur sauvegarde:', error?.code)
      console.log('Assistant - Message erreur sauvegarde:', error?.message)
      console.log('Assistant - Détails erreur sauvegarde:', error?.details)

      const errorMsg = error.message || error.details || (error.code ? `Code: ${error.code}` : "Inconnue")
      toast.error(`Erreur lors de l'enregistrement: ${errorMsg}`)
    }
  }

  const handlePreviewSend = () => {
    if (!previewInput.trim()) return

    const userMsg = { id: Date.now().toString(), role: 'user', content: previewInput }
    setPreviewMessages(prev => [...prev, userMsg])
    setPreviewInput('')

    // Simulated bot response
    setTimeout(() => {
      const botMsg = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        content: "Ceci est une simulation de l'IA. Elle répondra dynamiquement à vos clients sur votre site web !"
      }
      setPreviewMessages(prev => [...prev, botMsg])
    }, 1000)
  }

  const embedCode = `<script src="https://workflow-crm.com/chatbot/widget.js" data-id="user_${settings.botName.toLowerCase().replace(/\s/g, '_')}"></script>`

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-primary">Widget Chatbot</h1>
            <Badge className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white border-none">
              IA Propulsé
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Configurez et intégrez votre assistant virtuel intelligent
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              id="chatbot-enabled"
              checked={isEnabled}
              onCheckedChange={setIsEnabled}
            />
            <Label htmlFor="chatbot-enabled" className="cursor-pointer">
              {isEnabled ? 'Activé' : 'Désactivé'}
            </Label>
          </div>
          <Button variant="outline" onClick={saveSettings} className="border-primary/20 hover:bg-primary/5">
            Sauvegarder
          </Button>
          <Button className="bg-primary hover:shadow-lg hover:shadow-primary/20 transition-all">
            <ExternalLink className="mr-2 h-4 w-4" />
            Aperçu live
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Conversations', value: stats.conversations, icon: MessageSquare, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Leads générés', value: stats.leads, icon: Users, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Taux conversion', value: stats.conversations > 0 ? ((stats.leads / stats.conversations) * 100).toFixed(1) + '%' : '0%', icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Temps moyen', value: stats.avgTime, icon: Clock, color: 'text-purple-600', bg: 'bg-purple-50' }
        ].map((stat, i) => (
          <Card key={i} className="hover:shadow-md transition-all duration-300 border-none bg-card/60 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${stat.bg} ${stat.color} shadow-inner`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Configuration */}
      <Tabs defaultValue="appearance" className="space-y-4">
        <TabsList className="bg-muted/50 p-1 rounded-2xl w-fit">
          <TabsTrigger value="general" className="rounded-xl px-6">
            <Settings className="mr-2 h-4 w-4" />
            Configuration
          </TabsTrigger>
          <TabsTrigger value="appearance" className="rounded-xl px-6">
            <Palette className="mr-2 h-4 w-4" />
            Apparence & Test
          </TabsTrigger>
          <TabsTrigger value="embed" className="rounded-xl px-6">
            <Code className="mr-2 h-4 w-4" />
            Intégration
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="animate-in slide-in-from-left-2 duration-300">
          <Card className="border-none shadow-sm bg-card/60 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Comportement du Bot</CardTitle>
              <CardDescription>Personnalisez l'identité et les règles du chatbot</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="bot-name">Nom affiché</Label>
                  <Input
                    id="bot-name"
                    placeholder="Ex: Assistant Commercial"
                    value={settings.botName}
                    onChange={(e) => setSettings({ ...settings, botName: e.target.value })}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="response-delay">Collecte de données</Label>
                  <div className="flex items-center justify-between p-3 rounded-xl border bg-muted/10 h-10">
                    <span className="text-sm">Demander l'email du visiteur</span>
                    <Switch
                      checked={settings.collectEmails}
                      onCheckedChange={(val) => setSettings({ ...settings, collectEmails: val })}
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="welcome-message">Message d'accueil automatique</Label>
                <Textarea
                  id="welcome-message"
                  placeholder="Bonjour ! Comment puis-je vous aider aujourd'hui ?"
                  value={settings.welcomeMessage}
                  onChange={(e) => {
                    setSettings({ ...settings, welcomeMessage: e.target.value })
                    setPreviewMessages([{ id: '1', role: 'bot', content: e.target.value }])
                  }}
                  rows={3}
                  className="rounded-xl resize-none"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="animate-in slide-in-from-left-2 duration-300">
          <div className="grid gap-6 md:grid-cols-12">
            {/* Design Controls */}
            <div className="md:col-span-5 space-y-6">
              <Card className="border-none shadow-sm bg-card/60 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Personnalisation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="space-y-4">
                    <Label className="text-xs uppercase tracking-widest text-muted-foreground">Couleur dominante</Label>
                    <div className="flex flex-wrap gap-3">
                      {['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#000000'].map((color) => (
                        <button
                          key={color}
                          onClick={() => setSettings({ ...settings, primaryColor: color })}
                          className={`h-10 w-10 rounded-xl border-2 transition-all duration-300 hover:scale-110 ${settings.primaryColor === color ? 'border-primary ring-4 ring-primary/20 scale-110' : 'border-transparent'}`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-xs uppercase tracking-widest text-muted-foreground">Style visuel</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <Button variant="outline" className="rounded-xl border-primary/10">Moderne / Arrondi</Button>
                      <Button variant="ghost" className="rounded-xl opacity-50">Classique / Carré</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/10">
                <p className="font-bold text-sm text-indigo-900 dark:text-indigo-200 mb-2">💡 Conseil Pro</p>
                <p className="text-xs text-indigo-800/70 dark:text-indigo-200/60 leading-relaxed">
                  Utilisez une couleur qui contraste avec le fond de votre site pour que le bouton de chat soit bien visible par vos visiteurs.
                </p>
              </div>
            </div>

            {/* Interactive Preview */}
            <div className="md:col-span-7">
              <div className="relative h-[550px] w-full bg-slate-100 dark:bg-slate-900 rounded-3xl border-8 border-white dark:border-slate-800 shadow-2xl overflow-hidden">
                <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-full text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                  Simulateur Interactif
                </div>

                {/* Bot UI */}
                <div className="absolute right-6 bottom-6 w-80 h-[450px] bg-background rounded-2xl shadow-2xl border border-border/50 flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 duration-700">
                  {/* Bot Header */}
                  <div className="p-4 text-white flex items-center justify-between" style={{ backgroundColor: settings.primaryColor }}>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
                        <Bot className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-bold text-sm">{settings.botName}</p>
                        <p className="text-[10px] opacity-80 flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                          En ligne
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Bot Messages */}
                  <div
                    ref={previewScrollRef}
                    className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50 dark:bg-slate-950/50"
                  >
                    {previewMessages.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                        <div
                          className={`max-w-[80%] p-3 text-xs shadow-sm ${msg.role === 'user'
                            ? 'bg-primary text-primary-foreground rounded-2xl rounded-tr-none'
                            : 'bg-white dark:bg-slate-800 border rounded-2xl rounded-tl-none'
                            }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Bot Input */}
                  <div className="p-3 border-t bg-background">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Tapez un message..."
                        value={previewInput}
                        onChange={(e) => setPreviewInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handlePreviewSend()}
                        className="text-xs h-9 rounded-xl border-none bg-muted focus-visible:ring-1 focus-visible:ring-primary/30"
                      />
                      <Button
                        size="icon"
                        onClick={handlePreviewSend}
                        className="h-9 w-9 rounded-xl shrink-0"
                        style={{ backgroundColor: settings.primaryColor }}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Simulated Website Content */}
                <div className="p-12 space-y-4 opacity-10">
                  <div className="h-8 w-48 bg-slate-400 rounded-lg"></div>
                  <div className="h-4 w-full bg-slate-300 rounded-lg"></div>
                  <div className="h-4 w-3/4 bg-slate-300 rounded-lg"></div>
                  <div className="h-32 w-full bg-slate-200 rounded-2xl"></div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="embed" className="animate-in slide-in-from-left-2 duration-300">
          <Card className="border-none shadow-sm bg-card/60 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Installation</CardTitle>
              <CardDescription>Ajoutez ce code sur votre site pour activer le chatbot</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="relative group">
                <div className="absolute -top-3 left-6 px-2 py-0.5 bg-slate-800 text-slate-400 text-[10px] font-mono rounded border border-slate-700">HTML</div>
                <pre className="p-6 pt-8 rounded-2xl bg-slate-900 text-cyan-400 text-xs overflow-x-auto border-4 border-slate-800 shadow-2xl font-mono leading-relaxed">
                  {embedCode}
                </pre>
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute top-4 right-4 shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-300 bg-white/10 hover:bg-white/20 text-white border-none"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <><Check className="mr-2 h-4 w-4 text-green-400" /> Copié !</>
                  ) : (
                    <><Copy className="mr-2 h-4 w-4" /> Copier le code</>
                  )}
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-6 rounded-2xl border bg-blue-50/30 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center shrink-0 shadow-sm">
                      <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-bold text-blue-900 dark:text-blue-200">Compatibilité</p>
                      <p className="text-xs text-blue-800/70 dark:text-blue-300/60 mt-1 leading-relaxed">
                        Fonctionne avec WordPress, Webflow, Shopify, Wix et n'importe quel site HTML statique.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-6 rounded-2xl border bg-amber-50/30 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/30">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0 shadow-sm">
                      <Settings className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="font-bold text-amber-900 dark:text-amber-200">Synchronisation</p>
                      <p className="text-xs text-amber-800/70 dark:text-amber-300/60 mt-1 leading-relaxed">
                        Toutes les conversations sont enregistrées dans votre CRM et les leads sont créés automatiquement.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
