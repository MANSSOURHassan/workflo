"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export function NotificationSettings() {
  const [isLoading, setIsLoading] = useState(false)
  const [settings, setSettings] = useState({
    email_new_lead: true,
    email_deal_won: true,
    email_deal_lost: false,
    email_campaign_completed: true,
    email_weekly_report: true,
    push_new_lead: true,
    push_deal_update: true,
    push_task_reminder: true,
  })

  const handleSave = async () => {
    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500))
    toast.success("Préférences de notification mises à jour")
    setIsLoading(false)
  }

  const notifications = [
    {
      category: "Notifications par email",
      items: [
        { key: "email_new_lead", label: "Nouveau prospect", description: "Recevoir un email lors de l'ajout d'un nouveau prospect" },
        { key: "email_deal_won", label: "Affaire gagnée", description: "Recevoir un email quand une affaire est gagnée" },
        { key: "email_deal_lost", label: "Affaire perdue", description: "Recevoir un email quand une affaire est perdue" },
        { key: "email_campaign_completed", label: "Campagne terminée", description: "Recevoir un email à la fin d'une campagne" },
        { key: "email_weekly_report", label: "Rapport hebdomadaire", description: "Recevoir un résumé hebdomadaire de vos performances" },
      ]
    },
    {
      category: "Notifications push",
      items: [
        { key: "push_new_lead", label: "Nouveau prospect", description: "Notification push pour les nouveaux prospects" },
        { key: "push_deal_update", label: "Mise à jour d'affaire", description: "Notification push pour les changements d'étape" },
        { key: "push_task_reminder", label: "Rappel de tâche", description: "Notification push pour les rappels de tâches" },
      ]
    }
  ]

  return (
    <div className="space-y-6">
      {notifications.map((section) => (
        <Card key={section.category}>
          <CardHeader>
            <CardTitle>{section.category}</CardTitle>
            <CardDescription>
              Configurez vos préférences de notification
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {section.items.map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor={item.key}>{item.label}</Label>
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </div>
                <Switch
                  id={item.key}
                  checked={settings[item.key as keyof typeof settings]}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, [item.key]: checked })
                  }
                />
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? "Enregistrement..." : "Enregistrer les préférences"}
        </Button>
      </div>
    </div>
  )
}
