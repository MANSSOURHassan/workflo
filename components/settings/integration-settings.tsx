"use client"

import { useState } from "react"
import { Mail, Calendar, MessageSquare, Linkedin, Check, X } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

const integrations = [
  {
    id: "gmail",
    name: "Gmail",
    description: "Synchronisez vos emails et contacts Gmail",
    icon: Mail,
    connected: false,
    category: "Email",
  },
  {
    id: "outlook",
    name: "Microsoft Outlook",
    description: "Connectez votre compte Outlook professionnel",
    icon: Mail,
    connected: true,
    category: "Email",
  },
  {
    id: "google_calendar",
    name: "Google Calendar",
    description: "Synchronisez vos rendez-vous et événements",
    icon: Calendar,
    connected: true,
    category: "Calendrier",
  },
  {
    id: "slack",
    name: "Slack",
    description: "Recevez des notifications dans vos canaux Slack",
    icon: MessageSquare,
    connected: false,
    category: "Communication",
  },
  {
    id: "linkedin",
    name: "LinkedIn Sales Navigator",
    description: "Importez des prospects depuis LinkedIn",
    icon: Linkedin,
    connected: false,
    category: "Réseau social",
  },
]

export function IntegrationSettings() {
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [connectedApps, setConnectedApps] = useState<Record<string, boolean>>(
    Object.fromEntries(integrations.map(i => [i.id, i.connected]))
  )

  const handleToggle = async (id: string, isConnected: boolean) => {
    setLoadingId(id)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    setConnectedApps(prev => ({ ...prev, [id]: !isConnected }))
    toast.success(isConnected ? "Intégration déconnectée" : "Intégration connectée")
    setLoadingId(null)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Applications connectées</CardTitle>
          <CardDescription>
            Gérez vos intégrations avec des services tiers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {integrations.map((integration) => {
            const isConnected = connectedApps[integration.id]
            const isLoading = loadingId === integration.id

            return (
              <div
                key={integration.id}
                className="flex items-center justify-between p-4 rounded-lg border"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <integration.icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-foreground">{integration.name}</h4>
                      <Badge variant="secondary" className="text-xs">
                        {integration.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {integration.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isConnected && (
                    <Badge variant="outline" className="text-success border-success">
                      <Check className="h-3 w-3 mr-1" />
                      Connecté
                    </Badge>
                  )}
                  <Button
                    variant={isConnected ? "outline" : "default"}
                    size="sm"
                    onClick={() => handleToggle(integration.id, isConnected)}
                    disabled={isLoading}
                  >
                    {isLoading ? "..." : isConnected ? "Déconnecter" : "Connecter"}
                  </Button>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Clés API</CardTitle>
          <CardDescription>
            Gérez vos clés API pour les intégrations personnalisées
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm text-muted-foreground">
              Les clés API seront disponibles dans une prochaine mise à jour.
              Elles vous permettront d'intégrer Workflow CRM avec vos propres outils.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
