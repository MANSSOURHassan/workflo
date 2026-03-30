"use client"

import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ProfileSettings } from "@/components/settings/profile-settings"
import { NotificationSettings } from "@/components/settings/notification-settings"
import { IntegrationSettings } from "@/components/settings/integration-settings"
import { SecuritySettings } from "@/components/settings/security-settings"
import { RgpdSettings } from "@/components/settings/rgpd-settings"
import { Key, Webhook, Shield, ExternalLink, Users } from "lucide-react"
import { TeamSettings } from "@/components/settings/team-settings"
import { PageHeader } from "@/components/dashboard/page-header"

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader 
        title="Paramètres" 
        description="Personnalisez votre compte, gérez vos notifications et configurez vos intégrations."
      />

      {/* Raccourcis vers pages spécialisées */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/dashboard/settings/api-keys">
          <Card className="h-full hover:border-primary transition-colors cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Key className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">Clés API</h3>
                  <p className="text-sm text-muted-foreground">Gérer l'accès API</p>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/settings/webhooks">
          <Card className="h-full hover:border-primary transition-colors cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Webhook className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">Webhooks</h3>
                  <p className="text-sm text-muted-foreground">Notifications temps réel</p>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/settings/rgpd">
          <Card className="h-full hover:border-primary transition-colors cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">RGPD</h3>
                  <p className="text-sm text-muted-foreground">Vos droits et données</p>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:inline-grid">
          <TabsTrigger value="profile">Profil</TabsTrigger>
          <TabsTrigger value="team">Équipe</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="integrations">Intégrations</TabsTrigger>
          <TabsTrigger value="security">Sécurité</TabsTrigger>
          <TabsTrigger value="rgpd">RGPD</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <ProfileSettings />
        </TabsContent>

        <TabsContent value="team" className="mt-6">
          <TeamSettings />
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <NotificationSettings />
        </TabsContent>

        <TabsContent value="integrations" className="mt-6">
          <IntegrationSettings />
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          <SecuritySettings />
        </TabsContent>

        <TabsContent value="rgpd" className="mt-6">
          <RgpdSettings />
        </TabsContent>
      </Tabs>
    </div>
  )
}
