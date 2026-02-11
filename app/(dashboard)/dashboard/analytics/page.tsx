'use client'

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import {
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  DollarSign,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Award,
  Zap,
  Trophy,
  Star,
  Flame,
  Medal,
  Loader2
} from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RePieChart, Pie, Cell, Legend, LineChart, Line } from "recharts"
import { getAnalyticsData, AnalyticsData } from "@/lib/actions/analytics"

const achievements = [
  { name: "Premiere vente", icon: Trophy, description: "Premier deal conclu", unlocked: true },
  { name: "Prospecteur", icon: Users, description: "50 prospects ajoutes", unlocked: true },
  { name: "Communicateur", icon: Zap, description: "100 emails envoyes", unlocked: true },
  { name: "Negociateur", icon: Target, description: "10 deals > 5000EUR", unlocked: false },
  { name: "Champion", icon: Award, description: "Premier du classement", unlocked: false },
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
    { label: "Chiffre d'affaires", value: `${(data?.kpis.revenue || 0).toLocaleString()} EUR`, change: `${(data?.kpis.revenueChange || 0).toFixed(1)}%`, trend: (data?.kpis.revenueChange || 0) >= 0 ? "up" : "down", icon: DollarSign },
    { label: "Nouveaux prospects", value: `${data?.kpis.prospects || 0}`, change: "+0%", trend: "up", icon: Users }, // History not fully tracked yet
    { label: "Taux de conversion", value: `${(data?.kpis.conversionRate || 0).toFixed(1)}%`, change: "0%", trend: "up", icon: Target },
    { label: "Deals en cours", value: `${data?.kpis.activeDeals || 0}`, change: "0", trend: "down", icon: Activity },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Analyses & Performance</h1>
          <p className="text-muted-foreground">Suivez vos KPIs, objectifs et gamification</p>
        </div>
        <div className="flex items-center gap-2">
          <Select defaultValue="month">
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Cette semaine</SelectItem>
              <SelectItem value="month">Ce mois</SelectItem>
              <SelectItem value="quarter">Ce trimestre</SelectItem>
              <SelectItem value="year">Cette annee</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Calendar className="mr-2 h-4 w-4" />
            Personnaliser
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        {kpis.map((kpi, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{kpi.label}</p>
                  <p className="text-2xl font-bold mt-1">{kpi.value}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {kpi.trend === "up" ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                    <span className={kpi.trend === "up" ? "text-green-500 text-sm" : "text-red-500 text-sm"}>
                      {kpi.change}
                    </span>
                  </div>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <kpi.icon className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Chiffre d'affaires vs Objectifs</CardTitle>
            <CardDescription>Evolution mensuelle du CA et des objectifs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.revenueData || []}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} />
                  <Tooltip
                    formatter={(value: number) => [`${value.toLocaleString()} EUR`, '']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#6366F1"
                    strokeWidth={2}
                    fill="url(#colorRevenue)"
                    name="CA Realise"
                  />
                  <Line
                    type="monotone"
                    dataKey="target"
                    stroke="#94A3B8"
                    strokeDasharray="5 5"
                    strokeWidth={2}
                    dot={false}
                    name="Objectif"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Pipeline Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribution Pipeline</CardTitle>
            <CardDescription>Repartition des opportunites</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={data?.pipelineData || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {(data?.pipelineData || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RePieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {(data?.pipelineData || []).map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded" style={{ backgroundColor: item.color }} />
                    <span>{item.name}</span>
                  </div>
                  <span className="font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Tracking & Gamification */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Activity Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Tracking Activites
            </CardTitle>
            <CardDescription>Suivi automatique de vos actions commerciales</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.activityData || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="calls" name="Appels" fill="#6366F1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="emails" name="Emails" fill="#22D3EE" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="meetings" name="Reunions" fill="#22C55E" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">
                  {(data?.activityData || []).reduce((acc, curr) => acc + curr.calls, 0)}
                </p>
                <p className="text-xs text-muted-foreground">Appels</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-cyan-500">
                  {(data?.activityData || []).reduce((acc, curr) => acc + curr.emails, 0)}
                </p>
                <p className="text-xs text-muted-foreground">Emails</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-500">
                  {(data?.activityData || []).reduce((acc, curr) => acc + curr.meetings, 0)}
                </p>
                <p className="text-xs text-muted-foreground">Reunions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gamification */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Gamification
            </CardTitle>
            <CardDescription>Classement et achievements de l'equipe (Simulation)</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Leaderboard - Static for now as multi-user stats require robust permissions/querying */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">Classement</p>
              <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 text-white font-bold text-sm">
                  1
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                  Moi
                </div>
                <div className="flex-1">
                  <p className="font-medium">Vous</p>
                  <p className="text-xs text-muted-foreground">{data?.kpis.revenue} EUR</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary">{Math.floor((data?.kpis.revenue || 0) / 100)}</p>
                  <p className="text-xs text-muted-foreground">points</p>
                </div>
              </div>
            </div>

            {/* Achievements */}
            <div className="mt-6 pt-4 border-t">
              <p className="text-sm font-medium text-muted-foreground mb-3">Achievements</p>
              <div className="flex gap-2 flex-wrap">
                {achievements.map((achievement, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${achievement.unlocked
                        ? "bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200"
                        : "bg-muted/50 opacity-50"
                      }`}
                  >
                    <achievement.icon className={`h-4 w-4 ${achievement.unlocked ? "text-yellow-500" : "text-muted-foreground"}`} />
                    <span className="text-xs font-medium">{achievement.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Progress to next achievement */}
            <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/10">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium">Prochain: Negociateur</span>
                </div>
                <span className="text-xs text-muted-foreground">0/10 deals</span>
              </div>
              <Progress value={0} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Sources */}
      <Card>
        <CardHeader>
          <CardTitle>Sources de donnees connectees</CardTitle>
          <CardDescription>Pappers, PeopleDataLabs, web scraping en temps reel</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="flex items-center gap-3 p-4 rounded-lg border">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <BarChart3 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">Pappers</p>
                <p className="text-xs text-muted-foreground">Donnees entreprises FR</p>
              </div>
              <Badge className="ml-auto bg-green-100 text-green-700">Actif</Badge>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg border">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium">PeopleDataLabs</p>
                <p className="text-xs text-muted-foreground">Enrichissement contacts</p>
              </div>
              <Badge className="ml-auto bg-green-100 text-green-700">Actif</Badge>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg border">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-100">
                <Zap className="h-5 w-5 text-cyan-600" />
              </div>
              <div>
                <p className="font-medium">Web Scraping</p>
                <p className="text-xs text-muted-foreground">Donnees temps reel</p>
              </div>
              <Badge className="ml-auto bg-green-100 text-green-700">Actif</Badge>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg border">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
                <Star className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="font-medium">IA Scoring</p>
                <p className="text-xs text-muted-foreground">Analyse predictive</p>
              </div>
              <Badge className="ml-auto bg-green-100 text-green-700">Actif</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
