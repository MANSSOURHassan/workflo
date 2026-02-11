"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"

const campaignsData = [
  {
    name: "Promotion Printemps",
    type: "email",
    sent: 2500,
    opened: 875,
    clicked: 156,
    converted: 23,
  },
  {
    name: "Lancement Produit X",
    type: "email",
    sent: 1800,
    opened: 720,
    clicked: 144,
    converted: 18,
  },
  {
    name: "Relance Inactifs",
    type: "email",
    sent: 950,
    opened: 285,
    clicked: 42,
    converted: 8,
  },
  {
    name: "Newsletter Juin",
    type: "email",
    sent: 3200,
    opened: 1280,
    clicked: 192,
    converted: 32,
  },
  {
    name: "Promo Flash SMS",
    type: "sms",
    sent: 500,
    opened: 425,
    clicked: 85,
    converted: 15,
  },
]

export function CampaignsReport() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance des campagnes</CardTitle>
        <CardDescription>
          Analyse détaillée de vos dernières campagnes marketing
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campagne</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Envoyés</TableHead>
              <TableHead>Taux d'ouverture</TableHead>
              <TableHead>Taux de clic</TableHead>
              <TableHead className="text-right">Conversions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaignsData.map((campaign) => {
              const openRate = Math.round((campaign.opened / campaign.sent) * 100)
              const clickRate = Math.round((campaign.clicked / campaign.opened) * 100)

              return (
                <TableRow key={campaign.name}>
                  <TableCell className="font-medium">{campaign.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">
                      {campaign.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {campaign.sent.toLocaleString("fr-FR")}
                  </TableCell>
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
                  <TableCell className="text-right font-semibold text-success">
                    {campaign.converted}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
