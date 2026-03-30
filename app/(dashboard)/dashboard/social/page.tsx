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
  Share2,
  Plus,
  MoreHorizontal,
  Trash2,
  Edit2,
  Loader2,
  Linkedin,
  Twitter,
  Facebook,
  Instagram,
  Clock,
  Send,
  Heart,
  MessageCircle,
  Repeat2,
  Calendar,
  Youtube,
  Music,
  Search,
  ExternalLink,
  CheckCircle2,
  Link2,
  Users,
  TrendingUp,
  Sparkles,
  BarChart2,
  ArrowUpRight,
  MousePointerClick
} from 'lucide-react'
import { cn } from '@/lib/utils'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { generateSocialPost } from '@/lib/actions/ai'
import { getSocialStats, SocialStats } from '@/lib/actions/social'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { PageHeader } from '@/components/dashboard/page-header'

interface SocialAccount {
  id: string
  platform: string
  account_name: string | null
  is_active: boolean
  followers_count: number
  profile_url: string | null
  created_at: string
}

interface SocialPost {
  id: string
  content: string
  status: 'draft' | 'scheduled' | 'published' | 'failed'
  scheduled_at: string | null
  published_at: string | null
  engagement: { likes: number; comments: number; shares: number }
  account_id: string | null
  social_accounts?: SocialAccount
  created_at: string
}

// Configuration des plateformes sociales - TOUTES les plateformes
const allPlatforms = [
  // Réseaux majeurs
  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'bg-blue-600', textColor: 'text-white', description: 'Réseau professionnel B2B' },
  { id: 'twitter', name: 'Twitter / X', icon: Twitter, color: 'bg-slate-900', textColor: 'text-white', description: 'Microblogging et actualités' },
  { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'bg-blue-500', textColor: 'text-white', description: 'Réseau social généraliste' },
  { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500', textColor: 'text-white', description: 'Photos et stories' },
  { id: 'youtube', name: 'YouTube', icon: Youtube, color: 'bg-red-600', textColor: 'text-white', description: 'Vidéos et streaming' },
  { id: 'tiktok', name: 'TikTok', icon: Music, color: 'bg-black', textColor: 'text-white', description: 'Vidéos courtes virales' },
  // Autres plateformes
  { id: 'pinterest', name: 'Pinterest', icon: Share2, color: 'bg-red-500', textColor: 'text-white', description: 'Inspiration visuelle' },
  { id: 'snapchat', name: 'Snapchat', icon: MessageCircle, color: 'bg-yellow-400', textColor: 'text-black', description: 'Messages éphémères' },
  { id: 'threads', name: 'Threads', icon: MessageCircle, color: 'bg-black', textColor: 'text-white', description: 'Par Instagram/Meta' },
  { id: 'bluesky', name: 'Bluesky', icon: Share2, color: 'bg-sky-500', textColor: 'text-white', description: 'Réseau décentralisé' },
  { id: 'mastodon', name: 'Mastodon', icon: Share2, color: 'bg-purple-600', textColor: 'text-white', description: 'Réseau fédéré' },
  { id: 'reddit', name: 'Reddit', icon: MessageCircle, color: 'bg-orange-600', textColor: 'text-white', description: 'Communautés et forums' },
  { id: 'twitch', name: 'Twitch', icon: Youtube, color: 'bg-purple-500', textColor: 'text-white', description: 'Streaming en direct' },
  { id: 'discord', name: 'Discord', icon: MessageCircle, color: 'bg-indigo-500', textColor: 'text-white', description: 'Serveurs communautaires' },
  { id: 'telegram', name: 'Telegram', icon: Send, color: 'bg-sky-400', textColor: 'text-white', description: 'Canaux et groupes' },
  { id: 'whatsapp', name: 'WhatsApp Business', icon: MessageCircle, color: 'bg-green-500', textColor: 'text-white', description: 'Messagerie professionnelle' },
]

const statusConfig = {
  draft: { label: 'Brouillon', color: 'bg-slate-100 text-slate-700' },
  scheduled: { label: 'Programmé', color: 'bg-blue-100 text-blue-700' },
  published: { label: 'Publié', color: 'bg-green-100 text-green-700' },
  failed: { label: 'Échoué', color: 'bg-red-100 text-red-700' }
}

export default function SocialPage() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([])
  const [posts, setPosts] = useState<SocialPost[]>([])
  const [loading, setLoading] = useState(true)
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false)
  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPlatform, setSelectedPlatform] = useState<typeof allPlatforms[0] | null>(null)

  // Analytics state
  const [analyticsData, setAnalyticsData] = useState<SocialStats[]>([])
  const [selectedAccountStats, setSelectedAccountStats] = useState<string>('all')
  const [statsPeriod, setStatsPeriod] = useState<string>('30')
  const [statsLoading, setStatsLoading] = useState(false)

  const [postForm, setPostForm] = useState({
    content: '',
    scheduled_at: '',
    account_id: ''
  })
  const [accountForm, setAccountForm] = useState({
    platform: '',
    account_name: '',
    profile_url: ''
  })
  const [aiTopic, setAiTopic] = useState('')
  const [generatingAi, setGeneratingAi] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (selectedAccountStats && accounts.length > 0) {
      loadStats(selectedAccountStats)
    }
  }, [selectedAccountStats, statsPeriod, accounts])

  async function loadData() {
    setLoading(true)
    try {
      const [accountsRes, postsRes] = await Promise.all([
        supabase.from('social_accounts').select('*').order('created_at', { ascending: false }),
        supabase.from('social_posts').select('*, social_accounts(*)').order('created_at', { ascending: false })
      ])

      if (accountsRes.error) {
        // Handle specific error for missing table
        if (accountsRes.error.code === '42P01') {
          toast.error('Table manquante: veuillez exécuter integrations-social-tables.sql')
        } else {
          throw accountsRes.error
        }
      }
      if (postsRes.error && postsRes.error.code !== '42P01') throw postsRes.error

      setAccounts(accountsRes.data || [])
      setPosts(postsRes.data || [])

      // Select first account for stats if available
      if (accountsRes.data && accountsRes.data.length > 0) {
        setSelectedAccountStats(accountsRes.data[0].id)
      }

    } catch (error: any) {
      console.error('Erreur:', error)
      toast.error('Erreur lors du chargement des données')
    } finally {
      setLoading(false)
    }
  }

  async function loadStats(accountId: string) {
    setStatsLoading(true)
    try {
      if (accountId === 'all') {
        const { data } = await getSocialStats(accounts[0]?.id || '', parseInt(statsPeriod)) // Fallback logic needed for 'all'
        // For simplicity in this demo, if 'all' is selected, we just show stats for the first account or aggregate manually
        // Here we just fetch for first account if exists
        if (accounts.length > 0) {
          const result = await getSocialStats(accounts[0].id, parseInt(statsPeriod))
          setAnalyticsData(result.data || [])
        }
      } else {
        const result = await getSocialStats(accountId, parseInt(statsPeriod))
        setAnalyticsData(result.data || [])
      }
    } catch (error) {
      console.error(error)
      toast.error("Erreur chargement statistiques")
    } finally {
      setStatsLoading(false)
    }
  }

  function openConnectDialog(platform: typeof allPlatforms[0]) {
    setSelectedPlatform(platform)
    setAccountForm({
      platform: platform.id,
      account_name: '',
      profile_url: ''
    })
    setIsAccountDialogOpen(true)
  }

  async function createAccount() {
    if (!accountForm.account_name.trim() || !accountForm.platform) {
      toast.error('Veuillez entrer un nom de compte')
      return
    }

    setSaving(true)
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) throw new Error('Non authentifié')

      const { data, error } = await supabase
        .from('social_accounts')
        .insert({
          user_id: userData.user.id,
          platform: accountForm.platform,
          account_name: accountForm.account_name.trim(),
          profile_url: accountForm.profile_url.trim() || null,
          is_active: true,
          followers_count: 0
        })
        .select()
        .single()

      if (error) throw error
      setAccounts([data, ...accounts])
      setIsAccountDialogOpen(false)
      setAccountForm({ platform: '', account_name: '', profile_url: '' })
      setSelectedPlatform(null)
      toast.success('Compte ajouté!')

      // Load mock stats for this new account
      loadStats(data.id)

    } catch (error: any) {
      console.error('Erreur:', error)
      toast.error(error.message || 'Erreur lors de la création')
    } finally {
      setSaving(false)
    }
  }

  async function createPost() {
    if (!postForm.content.trim()) {
      toast.error('Veuillez entrer du contenu')
      return
    }

    setSaving(true)
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) throw new Error('Non authentifié')

      const { data, error } = await supabase
        .from('social_posts')
        .insert({
          user_id: userData.user.id,
          content: postForm.content.trim(),
          scheduled_at: postForm.scheduled_at || null,
          account_id: postForm.account_id || null,
          status: postForm.scheduled_at ? 'scheduled' : 'draft',
          engagement: { likes: 0, comments: 0, shares: 0 }
        })
        .select('*, social_accounts(*)')
        .single()

      if (error) throw error
      setPosts([data, ...posts])
      setIsPostDialogOpen(false)
      setPostForm({ content: '', scheduled_at: '', account_id: '' })
      toast.success('Publication créée!')
    } catch (error: any) {
      console.error('Erreur:', error)
      toast.error(error.message || 'Erreur lors de la création')
    } finally {
      setSaving(false)
    }
  }

  async function handleGenerateAI() {
    if (!postForm.account_id) {
      toast.error('Veuillez sélectionner un compte')
      return
    }
    if (!aiTopic.trim()) {
      toast.error('Entrez un sujet pour l\'IA')
      return
    }

    setGeneratingAi(true)
    try {
      const account = accounts.find(a => a.id === postForm.account_id)
      const platform = account?.platform || 'linkedin'
      const result = await generateSocialPost(platform, aiTopic, 'professional')
      if (result.error) throw new Error(result.error)
      setPostForm({ ...postForm, content: result.data?.content || '' })
      toast.success('Contenu généré !')
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setGeneratingAi(false)
    }
  }

  async function publishPost(postId: string) {
    try {
      const { error } = await supabase
        .from('social_posts')
        .update({
          status: 'published',
          published_at: new Date().toISOString()
        })
        .eq('id', postId)

      if (error) throw error
      setPosts(posts.map(p => p.id === postId ? { ...p, status: 'published' as const, published_at: new Date().toISOString() } : p))
      toast.success('Publication publiée!')
    } catch (error: any) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la publication')
    }
  }

  async function deletePost(postId: string) {
    if (!confirm('Supprimer cette publication?')) return
    try {
      const { error } = await supabase.from('social_posts').delete().eq('id', postId)
      if (error) throw error
      setPosts(posts.filter(p => p.id !== postId))
      toast.success('Publication supprimée')
    } catch (error: any) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la suppression')
    }
  }

  async function deleteAccount(accountId: string) {
    if (!confirm('Supprimer ce compte?')) return
    try {
      const { error } = await supabase.from('social_accounts').delete().eq('id', accountId)
      if (error) throw error
      setAccounts(accounts.filter(a => a.id !== accountId))
      toast.success('Compte supprimé')
    } catch (error: any) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la suppression')
    }
  }

  const getPlatformConfig = (platformId: string) => {
    return allPlatforms.find(p => p.id === platformId) || allPlatforms[0]
  }

  // Plateformes connectées
  const connectedPlatformIds = accounts.map(a => a.platform)

  // Plateformes disponibles (non connectées)
  const availablePlatforms = allPlatforms.filter(p =>
    !connectedPlatformIds.includes(p.id) &&
    (p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const stats = {
    totalPosts: posts.length,
    published: posts.filter(p => p.status === 'published').length,
    scheduled: posts.filter(p => p.status === 'scheduled').length,
    totalEngagement: posts.reduce((sum, p) => sum + (p.engagement?.likes || 0) + (p.engagement?.comments || 0) + (p.engagement?.shares || 0), 0),
    totalFollowers: accounts.reduce((sum, a) => sum + (a.followers_count || 0), 0)
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
        title="Réseaux Sociaux" 
        description="Gérez votre présence sur toutes les plateformes, programmez vos publications et analysez votre engagement."
      >
        <Button onClick={() => setIsPostDialogOpen(true)} className="bg-primary hover:shadow-lg shadow-primary/20 transition-all font-semibold">
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle publication
        </Button>
      </PageHeader>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Share2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{accounts.length}</div>
                <p className="text-xs text-muted-foreground">Comptes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.totalFollowers.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Abonnés</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.published}</div>
                <p className="text-xs text-muted-foreground">Publiées</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">{stats.scheduled}</div>
                <p className="text-xs text-muted-foreground">Programmées</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">{stats.totalEngagement}</div>
                <p className="text-xs text-muted-foreground">Engagements</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="accounts" className="space-y-4">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="accounts" className="gap-2">
            <Share2 className="h-4 w-4" />
            Comptes ({accounts.length})
          </TabsTrigger>
          <TabsTrigger value="posts" className="gap-2">
            <Send className="h-4 w-4" />
            Publications ({posts.length})
          </TabsTrigger>
          <TabsTrigger value="calendar" className="gap-2">
            <Calendar className="h-4 w-4" />
            Calendrier
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart2 className="h-4 w-4" />
            Analyses
          </TabsTrigger>
          <TabsTrigger value="connect" className="gap-2">
            <Plus className="h-4 w-4" />
            Connecter
          </TabsTrigger>
        </TabsList>

        {/* Tab: Connected Accounts */}
        <TabsContent value="accounts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Comptes connectés</CardTitle>
              <CardDescription>Gérez vos comptes de réseaux sociaux</CardDescription>
            </CardHeader>
            <CardContent>
              {accounts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Share2 className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium mb-2">Aucun compte connecté</p>
                  <p className="text-muted-foreground mb-4">Connectez vos réseaux sociaux pour commencer</p>
                  <Button onClick={() => document.querySelector('[data-value="connect"]')?.dispatchEvent(new MouseEvent('click'))}>
                    <Plus className="mr-2 h-4 w-4" />
                    Connecter un compte
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {accounts.map((account) => {
                    const platform = getPlatformConfig(account.platform)
                    const PlatformIcon = platform.icon
                    return (
                      <div key={account.id} className="flex items-center justify-between p-4 rounded-xl border hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${platform.color} ${platform.textColor}`}>
                            <PlatformIcon className="h-6 w-6" />
                          </div>
                          <div>
                            <p className="font-semibold">{account.account_name}</p>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">{platform.name}</Badge>
                              <span className="text-xs text-muted-foreground">{account.followers_count.toLocaleString()} abonnés</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {account.profile_url && (
                            <Button variant="ghost" size="icon" asChild>
                              <a href={account.profile_url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => deleteAccount(account.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Posts */}
        <TabsContent value="posts" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Publications</CardTitle>
                <CardDescription>{posts.length} publications</CardDescription>
              </div>
              <Button onClick={() => setIsPostDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Nouvelle
              </Button>
            </CardHeader>
            <CardContent>
              {posts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Send className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium mb-2">Aucune publication</p>
                  <p className="text-muted-foreground mb-4">Créez votre première publication</p>
                  <Button onClick={() => setIsPostDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Créer une publication
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {posts.map((post) => {
                    const status = statusConfig[post.status]
                    const accountPlatform = post.social_accounts ? getPlatformConfig(post.social_accounts.platform) : null
                    return (
                      <div key={post.id} className="p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {accountPlatform && (
                                <Badge className={`${accountPlatform.color} ${accountPlatform.textColor} text-xs`}>
                                  {accountPlatform.name}
                                </Badge>
                              )}
                              <Badge className={status.color}>{status.label}</Badge>
                            </div>
                            <p className="text-sm line-clamp-2 mb-3">{post.content}</p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              {post.scheduled_at && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(post.scheduled_at).toLocaleDateString('fr-FR')}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Heart className="h-3 w-3" />
                                {post.engagement?.likes || 0}
                              </span>
                              <span className="flex items-center gap-1">
                                <MessageCircle className="h-3 w-3" />
                                {post.engagement?.comments || 0}
                              </span>
                              <span className="flex items-center gap-1">
                                <Repeat2 className="h-3 w-3" />
                                {post.engagement?.shares || 0}
                              </span>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {post.status !== 'published' && (
                                <DropdownMenuItem onClick={() => publishPost(post.id)}>
                                  <Send className="mr-2 h-4 w-4" />
                                  Publier maintenant
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem className="text-destructive" onClick={() => deletePost(post.id)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Calendar */}
        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Calendrier de publication</CardTitle>
              <CardDescription>Visualisez votre stratégie de contenu sur le mois</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-px bg-muted rounded-lg overflow-hidden border">
                {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => (
                  <div key={d} className="bg-muted p-2 text-center text-xs font-bold">{d}</div>
                ))}
                {Array.from({ length: 31 }).map((_, i) => (
                  <div key={i} className="bg-card min-h-[100px] p-2 hover:bg-muted/30 transition-colors border-r border-b">
                    <span className="text-xs text-muted-foreground">{i + 1}</span>
                    <div className="mt-1 space-y-1">
                      {posts.filter(p => p.scheduled_at && new Date(p.scheduled_at).getDate() === (i + 1)).map(p => {
                        const plat = getPlatformConfig(p.social_accounts?.platform || 'linkedin')
                        return (
                          <div key={p.id} className={cn("text-[9px] p-1 rounded border flex items-center gap-1", plat.color, plat.textColor)}>
                            <plat.icon className="h-2 w-2" />
                            <span className="truncate">{p.content}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Analytics */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="flex gap-4 mb-4">
            <Select value={selectedAccountStats} onValueChange={setSelectedAccountStats}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Choisir un compte" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map(acc => (
                  <SelectItem key={acc.id} value={acc.id}>{acc.account_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statsPeriod} onValueChange={setStatsPeriod}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Période" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 derniers jours</SelectItem>
                <SelectItem value="30">30 derniers jours</SelectItem>
                <SelectItem value="90">3 mois</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Impressions</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analyticsData.reduce((sum, item) => sum + item.impressions, 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">+12% vs période précedente</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Engagement</CardTitle>
                <MousePointerClick className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(analyticsData.reduce((sum, item) => sum + item.engagement_rate, 0) / (analyticsData.length || 1)).toFixed(2)}%
                </div>
                <p className="text-xs text-muted-foreground">+2.4% vs période précedente</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">J'aime</CardTitle>
                <Heart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analyticsData.reduce((sum, item) => sum + item.likes, 0).toLocaleString()}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Clics</CardTitle>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analyticsData.reduce((sum, item) => sum + item.clicks, 0).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Abonnés</CardTitle>
                <CardDescription>Évolution du nombre d'abonnés</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {statsLoading ? (
                  <div className="flex h-full items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analyticsData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(date) => format(new Date(date), 'd MMM', { locale: fr })}
                      />
                      <YAxis />
                      <RechartsTooltip
                        labelFormatter={(date) => format(new Date(date), 'd MMMM yyyy', { locale: fr })}
                      />
                      <Line type="monotone" dataKey="followers_count" stroke="#8884d8" name="Abonnés" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Performance des publications</CardTitle>
                <CardDescription>Impressions par jour</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {statsLoading ? (
                  <div className="flex h-full items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analyticsData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(date) => format(new Date(date), 'd MMM', { locale: fr })}
                      />
                      <YAxis />
                      <RechartsTooltip
                        labelFormatter={(date) => format(new Date(date), 'd MMMM yyyy', { locale: fr })}
                      />
                      <Bar dataKey="impressions" fill="#3b82f6" name="Impressions" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Performance par publication</CardTitle>
              <CardDescription>Détail de vos derniers posts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {posts.filter(p => !selectedAccountStats || selectedAccountStats === 'all' || p.social_accounts?.id === selectedAccountStats).slice(0, 5).map(post => (
                  <div key={post.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium line-clamp-1">{post.content}</p>
                      <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Heart className="h-4 w-4" /> {post.engagement?.likes || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="h-4 w-4" /> {post.engagement?.comments || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Repeat2 className="h-4 w-4" /> {post.engagement?.shares || 0}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">
                        {((post.engagement?.likes || 0) + (post.engagement?.comments || 0) + (post.engagement?.shares || 0))}
                      </div>
                      <div className="text-xs text-muted-foreground">Engagement total</div>
                    </div>
                  </div>
                ))}
                {posts.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucune publication à analyser
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Connect New Network */}
        <TabsContent value="connect" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Connecter un réseau social</CardTitle>
              <CardDescription>Choisissez parmi {allPlatforms.length} plateformes disponibles</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un réseau social..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>

              {/* Platforms Grid */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {availablePlatforms.map((platform) => {
                  const PlatformIcon = platform.icon
                  return (
                    <Card key={platform.id} className="hover:shadow-md transition-shadow cursor-pointer group">
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${platform.color} ${platform.textColor} group-hover:scale-110 transition-transform`}>
                            <PlatformIcon className="h-6 w-6" />
                          </div>
                          <div>
                            <p className="font-semibold">{platform.name}</p>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">{platform.description}</p>
                        <Button
                          className="w-full"
                          size="sm"
                          onClick={() => openConnectDialog(platform)}
                        >
                          <Link2 className="mr-2 h-4 w-4" />
                          Connecter
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {availablePlatforms.length === 0 && (
                <div className="text-center py-8">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-lg font-medium">Tous les réseaux sont connectés!</p>
                  <p className="text-muted-foreground">Ou aucun résultat pour votre recherche</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Account Dialog */}
      <Dialog open={isAccountDialogOpen} onOpenChange={setIsAccountDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedPlatform && (
                <>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${selectedPlatform.color} ${selectedPlatform.textColor}`}>
                    <selectedPlatform.icon className="h-5 w-5" />
                  </div>
                  Connecter {selectedPlatform.name}
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              Ajoutez votre compte {selectedPlatform?.name} pour publier et gérer vos posts
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Nom du compte / Username *</Label>
              <Input
                placeholder="@votre_compte"
                value={accountForm.account_name}
                onChange={(e) => setAccountForm({ ...accountForm, account_name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>URL du profil (optionnel)</Label>
              <Input
                placeholder="https://..."
                value={accountForm.profile_url}
                onChange={(e) => setAccountForm({ ...accountForm, profile_url: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAccountDialogOpen(false)}>Annuler</Button>
            <Button onClick={createAccount} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Connecter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Post Dialog */}
      <Dialog open={isPostDialogOpen} onOpenChange={setIsPostDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Nouvelle publication</DialogTitle>
            <DialogDescription>Créez et planifiez votre contenu</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            {/* Form */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Compte</Label>
                <Select
                  value={postForm.account_id}
                  onValueChange={(val) => setPostForm({ ...postForm, account_id: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un compte" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map(account => (
                      <SelectItem key={account.id} value={account.id}>{account.account_name} ({getPlatformConfig(account.platform).name})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Contenu</Label>
                <Textarea
                  placeholder="Écrivez votre publication..."
                  className="h-[200px]"
                  value={postForm.content}
                  onChange={(e) => setPostForm({ ...postForm, content: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Assistant IA (Bêta)</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Sujet (ex: conseils productivité)"
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                  />
                  <Button
                    variant="secondary"
                    onClick={handleGenerateAI}
                    disabled={generatingAi || !postForm.account_id}
                  >
                    {generatingAi ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Date de publication (optionnel)</Label>
                <Input
                  type="datetime-local"
                  value={postForm.scheduled_at}
                  onChange={(e) => setPostForm({ ...postForm, scheduled_at: e.target.value })}
                />
              </div>
            </div>

            {/* Preview */}
            <div className="border rounded-lg p-4 bg-muted/20">
              <h3 className="font-semibold mb-4 text-sm text-muted-foreground uppercase tracking-wider">Aperçu</h3>
              <div className="bg-card border rounded-lg p-4 shadow-sm max-w-sm mx-auto">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
                  <div className="space-y-2">
                    <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                    <div className="h-3 w-16 bg-muted rounded animate-pulse" />
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  {postForm.content ? (
                    <p className="text-sm whitespace-pre-wrap">{postForm.content}</p>
                  ) : (
                    <>
                      <div className="h-4 w-full bg-muted rounded animate-pulse" />
                      <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
                    </>
                  )}
                </div>
                {/* Mock Image placeholder */}
                <div className="aspect-video bg-muted rounded-md w-full mb-3 flex items-center justify-center text-muted-foreground text-xs">
                  Média (Image/Vidéo)
                </div>
                <div className="flex justify-between text-muted-foreground pt-2 border-t">
                  <Heart className="h-4 w-4" />
                  <MessageCircle className="h-4 w-4" />
                  <Repeat2 className="h-4 w-4" />
                  <Share2 className="h-4 w-4" />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPostDialogOpen(false)}>Annuler</Button>
            <Button onClick={createPost} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {postForm.scheduled_at ? 'Programmer' : 'Publier'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
