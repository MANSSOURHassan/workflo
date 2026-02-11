"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Mail,
  Inbox,
  Send,
  Star,
  Trash2,
  Search,
  RefreshCw,
  Plus,
  MoreHorizontal,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Clock,
  User,
  Building2,
  ArrowUpRight,
  Filter
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Email {
  id: string
  from_name: string | null
  from_email: string
  subject: string
  snippet: string
  body_text: string | null
  body_html: string | null
  received_at: string
  is_read: boolean
  is_starred: boolean
  folder: string
  ai_opportunity_score?: number
}

interface Integration {
  id: string
  provider: string
  email: string
  sync_status: string
  last_sync_at: string | null
}

export default function EmailPage() {
  const [emails, setEmails] = useState<Email[]>([])
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)
  const [composeData, setComposeData] = useState({ to: '', subject: '', message: '' })
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("inbox")
  const [isSyncing, setIsSyncing] = useState(false)
  const [integration, setIntegration] = useState<Integration | null>(null)
  const [loading, setLoading] = useState(true)
  const [isComposeOpen, setIsComposeOpen] = useState(false)
  const [sending, setSending] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Load integration
      const { data: integrationData } = await supabase
        .from('email_integrations')
        .select('*')
        .eq('user_id', user.id)
        .eq('provider', 'gmail')
        .single()

      setIntegration(integrationData)

      // Load emails
      const { data: emailsData } = await supabase
        .from('synced_emails')
        .select('*')
        .eq('user_id', user.id)
        .order('received_at', { ascending: false })
        .limit(50)

      setEmails(emailsData || [])
    } catch (error) {
      console.error('Error loading email data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredEmails = emails.filter(email => {
    if (activeTab === "starred") return email.is_starred
    if (activeTab === "sent") return email.folder === "SENT"
    if (activeTab === "inbox") return email.folder === "INBOX"
    return true
  }).filter(email =>
    email.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (email.from_name || email.from_email).toLowerCase().includes(searchQuery.toLowerCase())
  )

  const unreadCount = emails.filter(e => !e.is_read && e.folder === "INBOX").length
  const opportunityCount = emails.filter(e => (e.ai_opportunity_score || 0) > 70).length

  const handleSync = async () => {
    if (!integration) {
      toast.error("Veuillez d'abord connecter votre compte Gmail")
      return
    }

    setIsSyncing(true)
    try {
      const res = await fetch('/api/email/sync', { method: 'POST' })
      const data = await res.json()

      if (data.success) {
        toast.success(`${data.synced} nouveaux emails synchronisés`)
        loadData()
      } else {
        toast.error(data.error || "Erreur lors de la synchronisation")
      }
    } catch (error) {
      toast.error("Erreur réseau lors de la synchronisation")
    } finally {
      setIsSyncing(false)
    }
  }

  const toggleStar = async (emailId: string, currentState: boolean) => {
    try {
      const { error } = await supabase
        .from('synced_emails')
        .update({ is_starred: !currentState })
        .eq('id', emailId)

      if (error) throw error
      setEmails(prev => prev.map(e =>
        e.id === emailId ? { ...e, is_starred: !currentState } : e
      ))
    } catch (error) {
      toast.error("Erreur lors de la mise à jour")
    }
  }

  const handleConnect = () => {
    window.location.href = '/api/auth/google'
  }


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Emails</h1>
          <p className="text-muted-foreground">Gérez vos emails et détectez les opportunités avec l'IA</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleSync} disabled={isSyncing || !integration}>
            <RefreshCw className={cn("mr-2 h-4 w-4", isSyncing && "animate-spin")} />
            Synchroniser
          </Button>
          <Button onClick={() => {
            setComposeData({ to: '', subject: '', message: '' })
            setIsComposeOpen(true)
          }}>
            <Plus className="mr-2 h-4 w-4" />
            Nouveau message
          </Button>
        </div>
      </div>

      {/* Gmail Connection Status */}
      {!integration ? (
        <Card className="bg-gradient-to-r from-red-50 to-orange-50 border-red-200">
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center text-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm">
                <Mail className="h-8 w-8 text-red-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">Connectez votre compte Gmail</h3>
                <p className="text-muted-foreground max-w-md mx-auto mt-1">
                  Synchronisez vos emails pour détecter automatiquement des opportunités d'affaires avec notre IA et répondre plus rapidement à vos clients.
                </p>
              </div>
              <Button onClick={handleConnect} size="lg" className="bg-red-600 hover:bg-red-700">
                Connecter avec Google
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-gradient-to-r from-red-50 to-orange-50 border-red-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm">
                  <Mail className="h-6 w-6 text-red-500" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">Gmail Connecté ({integration.email})</h3>
                    <Badge className={cn(
                      "text-white",
                      integration.sync_status === 'success' ? "bg-green-500" :
                        integration.sync_status === 'syncing' ? "bg-blue-500" : "bg-red-500"
                    )}>
                      {integration.sync_status === 'success' ? 'Actif' :
                        integration.sync_status === 'syncing' ? 'Synchronisation...' : 'Erreur'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Dernière sync: {integration.last_sync_at ? new Date(integration.last_sync_at).toLocaleString('fr-FR') : 'Jamais'}
                  </p>
                  {(integration as any).sync_error && (
                    <div className="flex items-center gap-1 text-xs text-red-600 mt-1">
                      <AlertCircle className="h-3 w-3" />
                      <span>{(integration as any).sync_error}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">{opportunityCount}</p>
                  <p className="text-muted-foreground">Opportunités</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Insights */}
      {opportunityCount > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">
                  {opportunityCount} opportunités détectées par l'IA
                </p>
                <p className="text-sm text-muted-foreground">
                  Des emails contiennent des signaux d'achat ou demandes de devis
                </p>
              </div>
              <Button size="sm" variant="outline">
                Voir les opportunités
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Email List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button variant="ghost" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="px-4 border-b">
                  <TabsList className="h-10 bg-transparent p-0 gap-4">
                    <TabsTrigger value="inbox" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none relative">
                      <Inbox className="h-4 w-4 mr-2" />
                      Boîte de réception
                      {unreadCount > 0 && (
                        <Badge className="ml-2 h-5 px-1.5">{unreadCount}</Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="sent" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none">
                      <Send className="h-4 w-4 mr-2" />
                      Envoyés
                    </TabsTrigger>
                    <TabsTrigger value="starred" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none">
                      <Star className="h-4 w-4 mr-2" />
                      Favoris
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className="divide-y">
                  {filteredEmails.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <Mail className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p>Aucun email trouvé</p>
                    </div>
                  ) : (
                    filteredEmails.map((email) => (
                      <div
                        key={email.id}
                        onClick={() => setSelectedEmail(email)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && setSelectedEmail(email)}
                        className={cn(
                          "flex items-start gap-3 w-full p-4 text-left hover:bg-muted/50 transition-colors cursor-pointer border-b last:border-0",
                          !email.is_read && "bg-primary/5",
                          selectedEmail?.id === email.id && "bg-muted"
                        )}
                      >
                        <Avatar className="h-10 w-10 shrink-0">
                          <AvatarFallback className="text-xs">
                            {(email.from_name || email.from_email).split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className={cn(
                              "font-medium truncate",
                              !email.is_read && "font-semibold text-primary"
                            )}>
                              {email.from_name || email.from_email}
                            </p>
                            <div className="flex items-center gap-2 shrink-0">
                              {(email.ai_opportunity_score || 0) > 0 && (
                                <Badge className={cn(
                                  "text-xs",
                                  (email.ai_opportunity_score || 0) > 80 ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                                )}>
                                  <Sparkles className="h-3 w-3 mr-1" />
                                  {email.ai_opportunity_score}%
                                </Badge>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {new Date(email.received_at).toLocaleDateString() === new Date().toLocaleDateString()
                                  ? new Date(email.received_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                  : new Date(email.received_at).toLocaleDateString([], { day: '2-digit', month: 'short' })
                                }
                              </span>
                            </div>
                          </div>
                          <p className={cn(
                            "text-sm truncate",
                            !email.is_read ? "text-foreground font-medium" : "text-muted-foreground"
                          )}>
                            {email.subject}
                          </p>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {email.snippet}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleStar(email.id, email.is_starred)
                          }}
                          className="shrink-0"
                          type="button"
                        >
                          <Star className={cn(
                            "h-4 w-4",
                            email.is_starred ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                          )} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar / Detail View */}
        <div className="space-y-6">
          {selectedEmail ? (
            <Card className="h-full flex flex-col min-h-[600px]">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <Button variant="ghost" size="sm" onClick={() => setSelectedEmail(null)}>
                    Retour
                  </Button>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="mt-4">
                  <h2 className="text-xl font-bold">{selectedEmail.subject}</h2>
                  <div className="flex items-center gap-3 mt-4">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {(selectedEmail.from_name || selectedEmail.from_email)[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-baseline justify-between">
                        <span className="font-semibold">{selectedEmail.from_name}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(selectedEmail.received_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{selectedEmail.from_email}</p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <ScrollArea className="flex-1 p-6">
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  {selectedEmail.body_html ? (
                    <div dangerouslySetInnerHTML={{ __html: selectedEmail.body_html }} />
                  ) : (
                    <div className="whitespace-pre-wrap font-sans text-sm text-foreground">
                      {selectedEmail.body_text || selectedEmail.snippet}
                    </div>
                  )}
                </div>
              </ScrollArea>
              <div className="p-4 border-t bg-muted/20">
                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    variant="outline"
                    onClick={() => {
                      setComposeData({
                        to: selectedEmail.from_email,
                        subject: `Re: ${selectedEmail.subject}`,
                        message: `\n\n--- En réponse à ---\nDe: ${selectedEmail.from_name} <${selectedEmail.from_email}>\nEnvoyé: ${new Date(selectedEmail.received_at).toLocaleString()}\nObjet: ${selectedEmail.subject}\n\n${selectedEmail.body_text || selectedEmail.snippet}`
                      })
                      setIsComposeOpen(true)
                    }}
                  >
                    Répondre
                  </Button>
                  <Button className="flex-1" variant="outline">Transférer</Button>
                </div>
              </div>
            </Card>
          ) : (
            <>
              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Statistiques</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Non lus</span>
                    <Badge variant="secondary">{unreadCount}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Opportunités IA</span>
                    <Badge className="bg-green-100 text-green-700">{opportunityCount}</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* AI Detected Opportunities */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Opportunités détectées
                  </CardTitle>
                  <CardDescription>Emails avec signaux d'achat</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {emails.filter(e => (e.ai_opportunity_score || 0) > 70).slice(0, 3).map((email) => (
                    <div
                      key={email.id}
                      className="flex items-center gap-3 p-2 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted"
                      onClick={() => setSelectedEmail(email)}
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{email.from_name || email.from_email}</p>
                        <p className="text-xs text-muted-foreground truncate">{email.subject}</p>
                      </div>
                      <Badge className="bg-green-100 text-green-700">{email.ai_opportunity_score}%</Badge>
                    </div>
                  ))}
                  {opportunityCount === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-2">Aucune opportunité détectée pour le moment</p>
                  )}
                </CardContent>
              </Card>

              {/* Integrations */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Intégrations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      <Mail className="h-5 w-5 text-red-500" />
                      <span className="text-sm font-medium">Gmail</span>
                    </div>
                    {integration ? (
                      <Badge className="bg-green-100 text-green-700">Connecté</Badge>
                    ) : (
                      <Button size="sm" variant="ghost" onClick={handleConnect} className="h-7 text-xs">Connecter</Button>
                    )}
                  </div>
                  <Button variant="outline" className="w-full bg-transparent" size="sm" asChild>
                    <Link href="/dashboard/integrations">Gérer les intégrations</Link>
                  </Button>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* Compose Dialog */}
      <ComposeDialog
        open={isComposeOpen}
        onOpenChange={setIsComposeOpen}
        initialData={composeData}
      />
    </div>
  )
}

function ComposeDialog({
  open,
  onOpenChange,
  initialData
}: {
  open: boolean,
  onOpenChange: (open: boolean) => void,
  initialData?: { to: string, subject: string, message: string }
}) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({ to: '', subject: '', message: '' })

  useEffect(() => {
    if (initialData) {
      setFormData(initialData)
    } else {
      setFormData({ to: '', subject: '', message: '' })
    }
  }, [initialData, open])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const data = await res.json()

      if (data.success) {
        toast.success("Message envoyé avec succès")
        onOpenChange(false)
      } else {
        toast.error(data.error || "Erreur lors de l'envoi")
      }
    } catch (error) {
      toast.error("Erreur réseau lors de l'envoi")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Nouveau message</DialogTitle>
          <DialogDescription>
            Envoyez un email via votre compte Gmail connecté
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSend} className="space-y-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="to">À</Label>
            <Input
              id="to"
              value={formData.to}
              onChange={(e) => setFormData({ ...formData, to: e.target.value })}
              placeholder="destinataire@exemple.com"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="subject">Objet</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="Objet de votre message"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Écrivez votre message ici..."
              className="min-h-[200px]"
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Envoi...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Envoyer
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
