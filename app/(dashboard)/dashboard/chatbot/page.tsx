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
  User,
  X,
  Sparkles
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { PageHeader } from '@/components/dashboard/page-header'

export default function ChatbotPage() {
  const [isEnabled, setIsEnabled] = useState(true)
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState('appearance')
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
    collectEmails: true,
    theme: 'light', // 'light', 'dark', or 'auto'
    visualStyle: 'modern' // 'modern' or 'classic'
  })

  // Simulated live preview messages
  const [previewMessages, setPreviewMessages] = useState([
    { id: '1', role: 'bot', content: 'Bonjour ! Comment puis-je vous aider ?' }
  ])
  const [previewInput, setPreviewInput] = useState('')
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const previewScrollRef = useRef<HTMLDivElement>(null)
  const isLoadedRef = useRef(false)

  const supabase = createClient()

  useEffect(() => {
    if (isLoadedRef.current) return
    isLoadedRef.current = true
    
    loadData()
  }, [])

  useEffect(() => {
    if (previewScrollRef.current) {
      previewScrollRef.current.scrollTop = previewScrollRef.current.scrollHeight
    }
  }, [previewMessages])

  async function loadData() {
    setLoading(true)
    try {
      const { data: conversations, error: convError, count } = await supabase
        .from('chatbot_conversations')
        .select('*', { count: 'exact', head: false })

      if (convError) {
        if (convError.code === '42P01') {
          toast.error('⚠️ Table "chatbot_conversations" manquante. Exécutez le script SQL.')
          return
        }
        throw convError
      }

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
        setSettings(prev => ({ ...prev, ...integration.settings }))
        setIsEnabled(integration.is_active)
        setPreviewMessages([{ id: '1', role: 'bot', content: integration.settings.welcomeMessage || 'Bonjour !' }])
      }
    } catch (e: any) {
      if (e.name === 'AbortError' || e.message?.includes('aborted')) return
      
      const errorMsg = e.message || "Erreur lors du chargement"
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
      const errorMsg = error.message || "Erreur lors de l'enregistrement"
      toast.error(`Erreur : ${errorMsg}`)
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
      <PageHeader 
        title="Widget Chatbot IA" 
        description="Gérez votre assistant virtuel intelligent et personnalisez son apparence pour l'intégrer sur votre site web."
      >
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 mr-2">
            <Switch
              id="chatbot-enabled-header"
              checked={isEnabled}
              onCheckedChange={setIsEnabled}
            />
            <Label htmlFor="chatbot-enabled-header" className="cursor-pointer font-medium text-xs whitespace-nowrap">
              {isEnabled ? 'Activé' : 'Désactivé'}
            </Label>
          </div>
          <Button variant="outline" onClick={saveSettings}>
            <Settings className="mr-2 h-4 w-4" />
            Sauvegarder
          </Button>
          <Button 
            className="bg-gradient-to-r from-primary to-indigo-600 hover:shadow-lg hover:shadow-primary/20 transition-all font-semibold border-none group"
            onClick={() => {
              setActiveTab('appearance')
              setIsPreviewOpen(true)
              setTimeout(() => {
                const simulator = document.getElementById('chat-simulator')
                if (simulator) simulator.scrollIntoView({ behavior: 'smooth', block: 'center' })
              }, 200)
            }}
          >
            <Sparkles className="mr-2 h-4 w-4 group-hover:animate-pulse" />
            Aperçu live
          </Button>
        </div>
      </PageHeader>

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
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
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
                      <Button
                        variant={settings.visualStyle === 'modern' ? 'default' : 'outline'}
                        className={`rounded-xl ${settings.visualStyle === 'modern' ? 'bg-primary text-primary-foreground' : 'border-primary/10'}`}
                        onClick={() => setSettings({ ...settings, visualStyle: 'modern' })}
                      >
                        Moderne / Arrondi
                      </Button>
                      <Button
                        variant={settings.visualStyle === 'classic' ? 'default' : 'outline'}
                        className={`rounded-xl ${settings.visualStyle === 'classic' ? 'bg-primary text-primary-foreground' : 'border-primary/10'}`}
                        onClick={() => setSettings({ ...settings, visualStyle: 'classic' })}
                      >
                        Classique / Carré
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-xs uppercase tracking-widest text-muted-foreground">Thème du Chatbot</Label>
                    <div className="grid grid-cols-3 gap-3">
                      <Button
                        variant={settings.theme === 'light' ? 'default' : 'outline'}
                        className={`rounded-xl ${settings.theme === 'light' ? 'bg-primary text-primary-foreground' : 'border-primary/10'}`}
                        onClick={() => setSettings({ ...settings, theme: 'light' })}
                      >
                        Clair
                      </Button>
                      <Button
                        variant={settings.theme === 'dark' ? 'default' : 'outline'}
                        className={`rounded-xl ${settings.theme === 'dark' ? 'bg-primary text-primary-foreground' : 'border-primary/10'}`}
                        onClick={() => setSettings({ ...settings, theme: 'dark' })}
                      >
                        Sombre
                      </Button>
                      <Button
                        variant={settings.theme === 'auto' ? 'default' : 'outline'}
                        className={`rounded-xl ${settings.theme === 'auto' ? 'bg-primary text-primary-foreground' : 'border-primary/10'}`}
                        onClick={() => setSettings({ ...settings, theme: 'auto' })}
                      >
                        Automatique
                      </Button>
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
            <div className="md:col-span-7" id="chat-simulator">
              <div className="relative h-[550px] w-full bg-slate-100 dark:bg-slate-900 rounded-3xl border-8 border-white dark:border-slate-800 shadow-2xl overflow-hidden">
                <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-full text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                  Simulateur Interactif
                </div>

                {/* Simulated Website Content */}
                <div className="p-12 space-y-4 opacity-10">
                  <div className="h-8 w-48 bg-slate-400 rounded-lg"></div>
                  <div className="h-4 w-full bg-slate-300 rounded-lg"></div>
                  <div className="h-4 w-3/4 bg-slate-300 rounded-lg"></div>
                  <div className="h-32 w-full bg-slate-200 rounded-2xl"></div>
                </div>

                {/* Bot floating button with tooltip-like hint */}
                {!isPreviewOpen && (
                  <div className="absolute right-6 bottom-6 flex flex-col items-end gap-3">
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-white dark:bg-slate-800 p-3 rounded-2xl shadow-xl text-xs font-medium border border-border/50 max-w-[200px]"
                    >
                      {settings.welcomeMessage}
                    </motion.div>
                    <button
                      onClick={() => setIsPreviewOpen(true)}
                      className={`h-14 w-14 shadow-2xl flex items-center justify-center text-white hover:scale-110 transition-all animate-in zoom-in duration-500 hover:rotate-12 ${
                        settings.visualStyle === 'modern' ? 'rounded-2xl' : 'rounded-full'
                      }`}
                      style={{ backgroundColor: settings.primaryColor }}
                    >
                      <MessageSquare className="h-7 w-7" />
                    </button>
                  </div>
                )}

                {/* Bot UI */}
                {isPreviewOpen && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className={`absolute right-6 bottom-6 w-85 h-[480px] shadow-2xl border border-border/30 flex flex-col overflow-hidden ${settings.visualStyle === 'modern' ? 'rounded-3xl' : 'rounded-sm'} ${settings.theme === 'dark' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}
                  >
                    {/* Bot Header */}
                    <div className={`p-4 text-white flex items-center justify-between ${settings.visualStyle === 'modern' ? '' : 'border-b border-black/10'}`} style={{ backgroundColor: settings.primaryColor }}>
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner ${settings.visualStyle === 'modern' ? 'rounded-xl' : 'rounded-sm'}`}>
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
                      <button 
                        onClick={() => setIsPreviewOpen(false)} 
                        className="text-white/80 hover:text-white transition-colors p-1"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    {/* Bot Messages */}
                    <div
                      ref={previewScrollRef}
                      className={`flex-1 p-5 overflow-y-auto space-y-6 ${settings.theme === 'dark' ? 'bg-slate-950/90' : 'bg-slate-50'}`}
                    >
                      <AnimatePresence initial={false}>
                        {previewMessages.map((msg) => (
                          <motion.div 
                            key={msg.id} 
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[85%] p-3.5 text-xs shadow-sm leading-relaxed ${msg.role === 'user'
                                ? `bg-primary text-primary-foreground ${settings.visualStyle === 'modern' ? 'rounded-2xl rounded-tr-none' : 'rounded-sm rounded-tr-none'}`
                                : `${settings.theme === 'dark' ? 'bg-slate-800 text-slate-100' : 'bg-white text-slate-900 border border-slate-100'} ${settings.visualStyle === 'modern' ? 'rounded-2xl rounded-tl-none' : 'rounded-sm rounded-tl-none'}`
                                }`}
                              style={msg.role === 'user' ? { backgroundColor: settings.primaryColor } : {}}
                            >
                              {msg.content}
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>

                    {/* Bot Input */}
                    <div className={`p-3 border-t ${settings.theme === 'dark' ? 'bg-slate-900 border-slate-800' : settings.theme === 'light' ? 'bg-white border-slate-200' : 'bg-background'}`}>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Tapez un message..."
                          value={previewInput}
                          onChange={(e) => setPreviewInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handlePreviewSend()}
                          className={`text-xs h-9 border-none focus-visible:ring-1 focus-visible:ring-primary/30 ${settings.visualStyle === 'modern' ? 'rounded-xl' : 'rounded-sm'} ${settings.theme === 'dark' ? 'bg-slate-800 text-white placeholder:text-slate-400' : settings.theme === 'light' ? 'bg-slate-100 text-slate-900 placeholder:text-slate-500' : 'bg-muted'}`}
                        />
                        <Button
                          size="icon"
                          onClick={handlePreviewSend}
                          className={`h-9 w-9 shrink-0 ${settings.visualStyle === 'modern' ? 'rounded-xl' : 'rounded-sm'}`}
                          style={{ backgroundColor: settings.primaryColor }}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
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
