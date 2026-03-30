"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

type Settings = {
    email_new_lead: boolean
    email_deal_won: boolean
    email_deal_lost: boolean
    email_campaign_completed: boolean
    email_weekly_report: boolean
    push_new_lead: boolean
    push_deal_update: boolean
    push_task_reminder: boolean
    marketing_emails: boolean
}

const DEFAULT_SETTINGS: Settings = {
    email_new_lead: true,
    email_deal_won: true,
    email_deal_lost: false,
    email_campaign_completed: true,
    email_weekly_report: true,
    push_new_lead: true,
    push_deal_update: true,
    push_task_reminder: true,
    marketing_emails: false,
}

export function NotificationSettings() {
    const [isLoading, setIsLoading] = useState(false)
    const [isFetching, setIsFetching] = useState(true)
    const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch('/api/settings/notifications')
                if (res.ok) {
                    const data = await res.json()
                    setSettings({ ...DEFAULT_SETTINGS, ...data })
                }
            } catch {
                // Utiliser les valeurs par défaut silencieusement
            } finally {
                setIsFetching(false)
            }
        }
        load()
    }, [])

    const handleSave = async () => {
        setIsLoading(true)
        try {
            const res = await fetch('/api/settings/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings),
            })
            const data = await res.json()
            if (res.ok) {
                toast.success("Préférences de notification mises à jour")
            } else {
                toast.error(data.error || "Erreur lors de la sauvegarde")
            }
        } catch {
            toast.error("Erreur réseau")
        } finally {
            setIsLoading(false)
        }
    }

    const toggle = (key: keyof Settings) =>
        setSettings(prev => ({ ...prev, [key]: !prev[key] }))

    const notifications = [
        {
            category: "Notifications par email",
            description: "Recevez des emails pour les événements importants",
            items: [
                { key: "email_new_lead" as const, label: "Nouveau prospect", description: "Email lors de l'ajout d'un nouveau prospect" },
                { key: "email_deal_won" as const, label: "Affaire gagnée 🎉", description: "Email quand une affaire est gagnée" },
                { key: "email_deal_lost" as const, label: "Affaire perdue", description: "Email quand une affaire est perdue" },
                { key: "email_campaign_completed" as const, label: "Campagne terminée", description: "Email à la fin d'une campagne" },
                { key: "email_weekly_report" as const, label: "Rapport hebdomadaire", description: "Résumé hebdomadaire de vos performances" },
                { key: "marketing_emails" as const, label: "Emails marketing", description: "Nouveautés et conseils de Workflow CRM" },
            ]
        },
        {
            category: "Notifications push",
            description: "Notifications en temps réel dans le navigateur",
            items: [
                { key: "push_new_lead" as const, label: "Nouveau prospect", description: "Notification push pour les nouveaux prospects" },
                { key: "push_deal_update" as const, label: "Mise à jour d'affaire", description: "Notification push pour les changements d'étape" },
                { key: "push_task_reminder" as const, label: "Rappel de tâche", description: "Notification push pour les rappels de tâches" },
            ]
        }
    ]

    if (isFetching) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {notifications.map((section) => (
                <Card key={section.category}>
                    <CardHeader>
                        <CardTitle>{section.category}</CardTitle>
                        <CardDescription>{section.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        {section.items.map((item) => (
                            <div key={item.key} className="flex items-center justify-between gap-4">
                                <div className="space-y-0.5 flex-1">
                                    <Label htmlFor={item.key} className="cursor-pointer">{item.label}</Label>
                                    <p className="text-sm text-muted-foreground">{item.description}</p>
                                </div>
                                <Switch
                                    id={item.key}
                                    checked={settings[item.key]}
                                    onCheckedChange={() => toggle(item.key)}
                                />
                            </div>
                        ))}
                    </CardContent>
                </Card>
            ))}

            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={isLoading}>
                    {isLoading
                        ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enregistrement…</>
                        : "Enregistrer les préférences"
                    }
                </Button>
            </div>
        </div>
    )
}
