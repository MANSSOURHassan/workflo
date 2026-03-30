"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Megaphone } from "lucide-react"
import Link from "next/link"

type Campaign = {
  id: string
  name: string
  type: string
  status: string
  sent_count: number
  opened_count: number
  clicked_count: number
  converted_count: number
}

export function CampaignsReport() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data } = await supabase
        .from('campaigns')
        .select('id, name, type, status, sent_count, opened_count, clicked_count, converted_count')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      setCampaigns((data || []).map(c => ({
        id: c.id,
        name: c.name,
        type: c.type || 'email',
        status: c.status,
        sent_count: c.sent_count || 0,
        opened_count: c.opened_count || 0,
        clicked_count: c.clicked_count || 0,
        converted_count: c.converted_count || 0,
      })))
      setLoading(false)
    }
    load()
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance des campagnes</CardTitle>
        <CardDescription>Analyse de vos campagnes marketing réelles</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : campaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-sm">
            <Megaphone className="h-12 w-12 mb-3 opacity-20" />
            <p>Aucune campagne enregistrée</p>
            <Link href="/dashboard/marketing" className="text-primary text-xs mt-2 hover:underline">
              Créer une campagne →
            </Link>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campagne</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Envoyés</TableHead>
                <TableHead>Taux d'ouverture</TableHead>
                <TableHead>Taux de clic</TableHead>
                <TableHead className="text-right">Conversions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((campaign) => {
                const openRate = campaign.sent_count > 0 ? Math.round((campaign.opened_count / campaign.sent_count) * 100) : 0
                const clickRate = campaign.opened_count > 0 ? Math.round((campaign.clicked_count / campaign.opened_count) * 100) : 0
                return (
                  <TableRow key={campaign.id}>
                    <TableCell className="font-medium max-w-[180px] truncate">{campaign.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">{campaign.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={
                        campaign.status === 'sent' ? 'bg-green-100 text-green-700' :
                        campaign.status === 'draft' ? 'bg-gray-100 text-gray-700' :
                        'bg-blue-100 text-blue-700'
                      }>
                        {campaign.status === 'sent' ? 'Envoyée' : campaign.status === 'draft' ? 'Brouillon' : 'Planifiée'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{campaign.sent_count.toLocaleString("fr-FR")}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={openRate} className="w-16 h-2" />
                        <span className="text-sm text-muted-foreground">{openRate}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={clickRate} className="w-16 h-2" />
                        <span className="text-sm text-muted-foreground">{clickRate}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-emerald-600">{campaign.converted_count}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
