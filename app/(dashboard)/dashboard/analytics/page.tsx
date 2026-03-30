'use client'

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  DollarSign,
  BarChart3,
  Activity,
  Award,
  Zap,
  Trophy,
  Flame,
  Loader2,
  Wallet,
  Phone,
  Mail,
  CalendarCheck,
  CheckCircle2,
  Building2
} from "lucide-react"
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart as RePieChart, Pie, Cell, Legend, Line
} from "recharts"
import { getAnalyticsData, AnalyticsData } from "@/lib/actions/analytics"
import Link from "next/link"
import { PageHeader } from "@/components/dashboard/page-header"

const ACHIEVEMENTS = [
  { name: "Première vente", icon: Trophy, description: "Premier deal conclu", key: 'firstDeal' },
  { name: "Prospecteur", icon: Users, description: "10+ prospects ajoutés", key: 'prospects' },
  { name: "Communicateur", icon: Zap, description: "10+ emails envoyés", key: 'emails' },
  { name: "Négociateur", icon: Target, description: "10 deals > 5 000 EUR", key: 'deals' },
  { name: "Champion", icon: Award, description: "Premier du classement", key: 'champion' },
]

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      const { data, error } = await getAnalyticsData()
      if (data) setData(data)
      setLoading(false)
    }
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const kpis = [
    {
      label: "CA encaissé (ce mois)",
      value: `${(data?.kpis.revenue || 0).toLocaleString('fr-FR')} €`,
      change: `${(data?.kpis.revenueChange || 0).toFixed(1)}%`,
      trend: (data?.kpis.revenueChange || 0) >= 0 ? "up" : "down",
      icon: DollarSign,
      color: "text-emerald-600"
    },
    {
      label: "Dépenses (ce mois)",
      value: `${(data?.kpis.costs || 0).toLocaleString('fr-FR')} €`,
      change: "-",
      trend: "down",
      icon: TrendingDown,
      color: "text-rose-600"
    },
    {
      label: "Résultat net",
      value: `${(data?.kpis.profit || 0).toLocaleString('fr-FR')} €`,
      change: "-",
      trend: (data?.kpis.profit || 0) >= 0 ? "up" : "down",
      icon: Wallet,
      color: (data?.kpis.profit || 0) >= 0 ? "text-emerald-600" : "text-rose-600"
    },
    {
      label: "Taux de conversion",
      value: `${data?.kpis.conversionRate || 0}%`,
      change: "-",
      trend: "up",
      icon: Target,
      color: "text-primary"
    },
    {
      label: "Deals actifs",
      value: `${data?.kpis.activeDeals || 0}`,
      change: `${(data?.kpis.activeDealsChange || 0).toFixed(0)}%`,
      trend: (data?.kpis.activeDealsChange || 0) >= 0 ? "up" : "down",
      icon: Activity,
      color: "text-blue-600"
    },
    {
      label: "Prospects total",
      value: `${data?.kpis.prospects || 0}`,
      change: `${(data?.kpis.prospectsChange || 0).toFixed(0)}%`,
      trend: (data?.kpis.prospectsChange || 0) >= 0 ? "up" : "down",
      icon: Users,
      color: "text-violet-600"
    },
  ]

  // Achievements unlocked dynamically
  const unlockedMap: Record<string, boolean> = {
    firstDeal: (data?.kpis.activeDeals || 0) > 0 || (data?.kpis.revenue || 0) > 0,
    prospects: (data?.kpis.prospects || 0) >= 10,
    emails: (data?.kpis.emailsSent || 0) >= 10,
    deals: false, // requires 10 deals > 5000
    champion: false,
  }
  const points = Math.floor((data?.kpis.revenue || 0) / 100)

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Analytiques" 
        description="Analysez vos performances globales et découvrez vos leviers de croissance."
      />

      {/* KPIs Grid — 3 cols on md, 6 on xl */}
      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        {kpis.map((kpi, index) => (
          <Card key={index}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground truncate">{kpi.label}</p>
                  <p className={`text-xl font-bold mt-1 ${kpi.color}`}>{kpi.value}</p>
                  {kpi.change !== "-" && (
                    <div className="flex items-center gap-1 mt-1">
                      {kpi.trend === "up"
                        ? <TrendingUp className="h-3 w-3 text-emerald-500" />
                        : <TrendingDown className="h-3 w-3 text-rose-500" />}
                      <span className={`text-xs ${kpi.trend === "up" ? "text-emerald-500" : "text-rose-500"}`}>
                        {kpi.change} vs mois préc.
                      </span>
                    </div>
                  )}
                </div>
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/5`}>
                  <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue Chart + Pipeline */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Chiffre d'affaires vs Charges</CardTitle>
            <CardDescription>Évolution mensuelle des 6 derniers mois</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.revenueData || []}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      `${value.toLocaleString('fr-FR')} €`,
                      name === 'revenue' ? 'Recettes' : 'Charges'
                    ]}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2} fill="url(#colorRevenue)" name="revenue" />
                  <Line type="monotone" dataKey="costs" stroke="#EF4444" strokeWidth={2} dot={false} name="costs" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribution Pipeline</CardTitle>
            <CardDescription>Répartition des deals par étape</CardDescription>
          </CardHeader>
          <CardContent>
            {(data?.pipelineData || []).length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground text-sm">
                <BarChart3 className="h-10 w-10 mb-2 opacity-20" />
                <p>Aucun deal dans le pipeline</p>
              </div>
            ) : (
              <>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie data={data?.pipelineData || []} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                        {(data?.pipelineData || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number, name: string) => [`${value} deal(s)`, name]} />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2">
                  {(data?.pipelineData || []).map((item, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded" style={{ backgroundColor: item.color }} />
                        <span className="truncate">{item.name}</span>
                      </div>
                      <span className="font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity chart + Recent Deals */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Activités (7 derniers jours)
            </CardTitle>
            <CardDescription>Suivi automatique de vos actions commerciales</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.activityData || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="calls" name="Appels" fill="#6366F1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="emails" name="Emails" fill="#22D3EE" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="meetings" name="Réunions" fill="#22C55E" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <Phone className="h-4 w-4 text-primary" />
                  <p className="text-2xl font-bold text-primary">{data?.kpis.callsMade || 0}</p>
                </div>
                <p className="text-xs text-muted-foreground">Appels</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <Mail className="h-4 w-4 text-cyan-500" />
                  <p className="text-2xl font-bold text-cyan-500">{data?.kpis.emailsSent || 0}</p>
                </div>
                <p className="text-xs text-muted-foreground">Emails</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <CalendarCheck className="h-4 w-4 text-green-500" />
                  <p className="text-2xl font-bold text-green-500">{data?.kpis.meetingsDone || 0}</p>
                </div>
                <p className="text-xs text-muted-foreground">Réunions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-500" />
              Deals récents
            </CardTitle>
            <CardDescription>Dernières opportunités mises à jour</CardDescription>
          </CardHeader>
          <CardContent>
            {(data?.recentDeals || []).length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground text-sm">
                <Activity className="h-10 w-10 mb-2 opacity-20" />
                <p>Aucun deal enregistré</p>
                <Link href="/dashboard/pipeline" className="text-primary text-xs mt-2 hover:underline">
                  Créer un deal →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {(data?.recentDeals || []).map((deal) => (
                  <div key={deal.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: deal.color }} />
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{deal.title}</p>
                        {deal.prospect && (
                          <p className="text-xs text-muted-foreground truncate">{deal.prospect}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <p className="font-bold text-sm">{deal.amount.toLocaleString('fr-FR')} €</p>
                      <Badge variant="outline" className="text-[10px]" style={{ borderColor: deal.color, color: deal.color }}>
                        {deal.stage}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Prospects + Gamification */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-violet-500" />
              Top Prospects
            </CardTitle>
            <CardDescription>Prospects avec le plus fort potentiel commercial</CardDescription>
          </CardHeader>
          <CardContent>
            {(data?.topProspects || []).length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[160px] text-muted-foreground text-sm">
                <Users className="h-10 w-10 mb-2 opacity-20" />
                <p>Aucun prospect avec des deals</p>
                <Link href="/dashboard/prospects" className="text-primary text-xs mt-2 hover:underline">
                  Gérer les prospects →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {(data?.topProspects || []).map((p, i) => (
                  <div key={p.id} className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full font-bold text-sm text-white shrink-0
                      ${i === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
                        i === 1 ? 'bg-gradient-to-br from-slate-400 to-slate-500' :
                        'bg-gradient-to-br from-amber-600 to-amber-700'}`}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{p.name}</p>
                      {p.company && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                          <Building2 className="h-3 w-3 shrink-0" />{p.company}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-sm text-primary">{p.revenue.toLocaleString('fr-FR')} €</p>
                      <p className="text-xs text-muted-foreground">{p.deals} deal{p.deals > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Achievements
            </CardTitle>
            <CardDescription>Vos succès débloqués grâce à votre activité</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              {ACHIEVEMENTS.map((achievement, index) => {
                const unlocked = unlockedMap[achievement.key] ?? false
                return (
                  <div
                    key={index}
                    title={achievement.description}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                      unlocked
                        ? "bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200"
                        : "bg-muted/50 opacity-40"
                    }`}
                  >
                    <achievement.icon className={`h-4 w-4 ${unlocked ? "text-yellow-500" : "text-muted-foreground"}`} />
                    <span className="text-xs font-medium">{achievement.name}</span>
                    {unlocked && <CheckCircle2 className="h-3 w-3 text-green-500" />}
                  </div>
                )
              })}
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-muted-foreground">Score de performance</p>
                <span className="text-sm font-bold text-primary">{points} pts</span>
              </div>
              <Progress value={Math.min((points / 1000) * 100, 100)} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">Basé sur votre chiffre d'affaires encaissé</p>
            </div>

            <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
              <div className="flex items-center gap-2 mb-1">
                <Flame className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium">Prochain objectif</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {!unlockedMap['prospects']
                  ? `Plus que ${Math.max(0, 10 - (data?.kpis.prospects || 0))} prospects pour débloquer "Prospecteur"`
                  : !unlockedMap['emails']
                  ? `Plus que ${Math.max(0, 10 - (data?.kpis.emailsSent || 0))} emails pour débloquer "Communicateur"`
                  : "Continuez à développer votre activité pour débloquer de nouveaux succès !"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
