"use client"

import { useState } from "react"
import { Shield, Download, Trash2, FileText, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"

export function RgpdSettings() {
  const [isExporting, setIsExporting] = useState(false)
  const [consentSettings, setConsentSettings] = useState({
    analytics: true,
    marketing: false,
    personalization: true,
  })

  const handleExportData = async () => {
    setIsExporting(true)
    // Simulate export
    await new Promise(resolve => setTimeout(resolve, 2000))
    toast.success("Export terminé ! Vous recevrez un email avec vos données.")
    setIsExporting(false)
  }

  const handleDeleteAccount = () => {
    toast.error("Demande de suppression envoyée. Notre équipe vous contactera sous 48h.")
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Conformité RGPD
          </CardTitle>
          <CardDescription>
            Vos droits concernant vos données personnelles selon le Règlement Général sur la Protection des Données
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg bg-muted p-4">
            <h4 className="font-medium text-foreground mb-2">Vos droits</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>- Droit d'accès à vos données personnelles</li>
              <li>- Droit de rectification de vos données</li>
              <li>- Droit à l'effacement (droit à l'oubli)</li>
              <li>- Droit à la portabilité de vos données</li>
              <li>- Droit d'opposition au traitement</li>
              <li>- Droit à la limitation du traitement</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Consentements
          </CardTitle>
          <CardDescription>
            Gérez vos préférences de consentement pour le traitement de vos données
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Cookies analytiques</Label>
              <p className="text-sm text-muted-foreground">
                Nous aident à comprendre comment vous utilisez l'application
              </p>
            </div>
            <Switch
              checked={consentSettings.analytics}
              onCheckedChange={(checked) =>
                setConsentSettings({ ...consentSettings, analytics: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Communications marketing</Label>
              <p className="text-sm text-muted-foreground">
                Recevoir des offres et actualités par email
              </p>
            </div>
            <Switch
              checked={consentSettings.marketing}
              onCheckedChange={(checked) =>
                setConsentSettings({ ...consentSettings, marketing: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Personnalisation</Label>
              <p className="text-sm text-muted-foreground">
                Adapter l'expérience à vos préférences
              </p>
            </div>
            <Switch
              checked={consentSettings.personalization}
              onCheckedChange={(checked) =>
                setConsentSettings({ ...consentSettings, personalization: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Exporter vos données
          </CardTitle>
          <CardDescription>
            Téléchargez une copie de toutes vos données personnelles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Vous recevrez un fichier ZIP contenant toutes vos données au format JSON.
                L'export peut prendre quelques minutes.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleExportData}
              disabled={isExporting}
            >
              <Download className="mr-2 h-4 w-4" />
              {isExporting ? "Export en cours..." : "Exporter mes données"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Supprimer mon compte
          </CardTitle>
          <CardDescription>
            Supprimez définitivement votre compte et toutes vos données
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-destructive/10 p-4 mb-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-destructive">Attention</h4>
                <p className="text-sm text-destructive/80">
                  Cette action est irréversible. Toutes vos données seront définitivement supprimées :
                  prospects, campagnes, affaires, rapports, et paramètres.
                </p>
              </div>
            </div>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer mon compte
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action ne peut pas être annulée. Cela supprimera définitivement votre
                  compte et toutes les données associées de nos serveurs.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Oui, supprimer mon compte
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  )
}
