import { Suspense } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Send, Users, BarChart3, Clock, AlertCircle } from 'lucide-react'
import { getCampaign } from '@/lib/actions/campaigns'
import { Badge } from '@/components/ui/badge'

export default async function CampaignDetailsPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const { data: campaign, error } = await getCampaign(id)

    if (!campaign || error) {
        notFound()
    }

    // Calculate stats
    const totalRecipients = campaign.campaign_recipients?.length || 0
    const sent = campaign.campaign_recipients?.filter((r: any) => r.status === 'sent').length || 0
    const opened = campaign.campaign_recipients?.filter((r: any) => r.opened_at).length || 0
    const clicked = campaign.campaign_recipients?.filter((r: any) => r.clicked_at).length || 0

    const openRate = sent > 0 ? Math.round((opened / sent) * 100) : 0
    const clickRate = opened > 0 ? Math.round((clicked / opened) * 100) : 0

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/dashboard/campaigns">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold text-primary">{campaign.name}</h1>
                            <Badge variant={
                                campaign.status === 'completed' ? 'secondary' :
                                    campaign.status === 'active' ? 'default' :
                                        'outline'
                            }>
                                {campaign.status}
                            </Badge>
                        </div>
                        <p className="text-muted-foreground flex items-center gap-2 text-sm mt-1">
                            <Clock className="h-3 w-3" />
                            Créée le {new Date(campaign.created_at).toLocaleDateString()}
                        </p>
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Destinataires</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalRecipients}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Envoyés</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{sent}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Taux d'ouverture</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{openRate}%</div>
                        <p className="text-xs text-muted-foreground">{opened} ouvertures</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Taux de clic</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{clickRate}%</div>
                        <p className="text-xs text-muted-foreground">{clicked} clics</p>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="stats" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="stats">Statistiques</TabsTrigger>
                    <TabsTrigger value="recipients">Destinataires</TabsTrigger>
                    <TabsTrigger value="content">Contenu</TabsTrigger>
                </TabsList>

                <TabsContent value="stats" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Performance dans le temps</CardTitle>
                            <CardDescription>Évolution des ouvertures et clics</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
                            <BarChart3 className="h-12 w-12 mb-4 opacity-20" />
                            <p>Le graphique sera disponible une fois la campagne lancée.</p>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="recipients">
                    <Card>
                        <CardHeader>
                            <CardTitle>Liste des destinataires</CardTitle>
                            <CardDescription>Détail des interactions par prospect</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {campaign.campaign_recipients && campaign.campaign_recipients.length > 0 ? (
                                <div className="space-y-4">
                                    {campaign.campaign_recipients.map((recipient: any) => (
                                        <div key={recipient.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                                                    {recipient.prospect?.first_name?.[0] || 'U'}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm">
                                                        {recipient.prospect?.first_name} {recipient.prospect?.last_name}
                                                        <span className="text-muted-foreground font-normal ml-2">({recipient.prospect?.email})</span>
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">{recipient.prospect?.company}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {recipient.status === 'sent' && (
                                                    <Badge variant="outline" className="text-blue-600 bg-blue-50 border-blue-200">Envoyé</Badge>
                                                )}
                                                {recipient.opened_at && (
                                                    <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">Ouvert</Badge>
                                                )}
                                                {recipient.clicked_at && (
                                                    <Badge variant="outline" className="text-purple-600 bg-purple-50 border-purple-200">Cliqué</Badge>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                    <p>Aucun destinataire pour le moment.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="content">
                    <Card>
                        <CardHeader>
                            <CardTitle>Aperçu de l'email</CardTitle>
                            <CardDescription>Sujet : {campaign.subject}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="p-6 border rounded-lg bg-white min-h-[400px] prose max-w-none">
                                {/* Render HTML safely here if needed, for now just text */}
                                <div dangerouslySetInnerHTML={{ __html: campaign.content }} />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
