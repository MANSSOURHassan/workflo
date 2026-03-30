'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { updatePassword, signOut, getActiveSessions } from '@/lib/actions/auth'
import { deleteUserAccount, getUserSettings, updateGDPRConsent, updateUserSettings } from '@/lib/actions/settings'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import {
  Shield,
  Key,
  Smartphone,
  Lock,
  Eye,
  EyeOff,
  Monitor,
  Chrome,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  History
} from 'lucide-react'

const securityEvents = [
  { event: 'Connexion réussie', date: '24 Jan 2026, 14:32', location: 'Paris, France', type: 'success' },
  { event: 'Mot de passe modifié', date: '20 Jan 2026, 10:15', location: 'Paris, France', type: 'info' },
  { event: 'Tentative de connexion échouée', date: '18 Jan 2026, 23:45', location: 'Unknown', type: 'warning' },
  { event: 'Connexion réussie', date: '15 Jan 2026, 09:00', location: 'Paris, France', type: 'success' },
]

export default function SecurityPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const [gdprConsent, setGdprConsent] = useState(false)
  const [emailMarketing, setEmailMarketing] = useState(false)
  const [isLoadingSettings, setIsLoadingSettings] = useState(true)
  const [activeSessions, setActiveSessions] = useState<any[]>([])

  useEffect(() => {
    async function loadSettings() {
      const { data } = await getUserSettings()
      if (data) {
        setGdprConsent(data.gdpr_consent)
        setEmailMarketing(data.email_notifications)
      }
      setIsLoadingSettings(false)

      const { data: sessionData } = await getActiveSessions()
      if (sessionData) {
        setActiveSessions(sessionData)
      }
    }
    loadSettings()
  }, [])

  const handleUpdatePassword = async () => {
    if (!newPassword) return
    if (newPassword !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas')
      return
    }
    setIsUpdatingPassword(true)
    const formData = new FormData()
    formData.append('password', newPassword)

    try {
      const res = await updatePassword(formData)
      if (res?.error) {
        toast.error(res.error)
      }
    } catch (e: any) {
      if (e.message !== 'NEXT_REDIRECT') {
        toast.error('Erreur inattendue')
      }
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer définitivement votre compte ? Cette action est irréversible.')) return
    setIsDeleting(true)
    try {
      const res = await deleteUserAccount()
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success("Compte supprimé avec succès")
        router.push('/auth/login')
      }
    } catch (e) {
      toast.error('Erreur lors de la suppression du compte')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleGdprToggle = async (checked: boolean) => {
    setGdprConsent(checked)
    const res = await updateGDPRConsent(checked)
    if (res?.error) {
      toast.error(res.error)
      setGdprConsent(!checked)
    } else {
      toast.success("Préférences enregistrées")
    }
  }

  const handleEmailMarketingToggle = async (checked: boolean) => {
    setEmailMarketing(checked)
    const formData = new FormData()
    formData.append('email_notifications', String(checked))
    const res = await updateUserSettings(formData)
    if (res?.error) {
      toast.error(res.error)
      setEmailMarketing(!checked)
    } else {
      toast.success("Préférences enregistrées")
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}

      {/* Security Score */}
      <Card className="bg-gradient-to-r from-green-50 to-transparent border-green-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                <Shield className="h-7 w-7 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Score de sécurité: Bon</h3>
                <p className="text-sm text-muted-foreground">
                  Votre compte est bien protégé. Activez la 2FA pour une sécurité maximale.
                </p>
              </div>
            </div>
            <Badge className="bg-green-100 text-green-700 text-lg px-4 py-1">
              75/100
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Mot de passe
          </CardTitle>
          <CardDescription>Modifiez votre mot de passe régulièrement pour plus de sécurité</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Mot de passe actuel</Label>
            <div className="relative">
              <Input
                id="current-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="********"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nouveau mot de passe</Label>
              <Input id="new-password" type="password" placeholder="********" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
              <Input id="confirm-password" type="password" placeholder="********" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>
          </div>
          <div className="pt-2">
            <Button onClick={handleUpdatePassword} disabled={isUpdatingPassword || !newPassword}>
              {isUpdatingPassword ? "Mise à jour..." : "Mettre à jour le mot de passe"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Authentification à deux facteurs (2FA)
          </CardTitle>
          <CardDescription>Ajoutez une couche de sécurité supplémentaire à votre compte</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="flex items-center gap-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${twoFactorEnabled ? 'bg-green-100' : 'bg-yellow-100'}`}>
                <Lock className={`h-6 w-6 ${twoFactorEnabled ? 'text-green-600' : 'text-yellow-600'}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">Application d'authentification</p>
                  {twoFactorEnabled ? (
                    <Badge className="bg-green-100 text-green-700">Activé</Badge>
                  ) : (
                    <Badge variant="outline">Désactivée</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Utilisez Google Authenticator ou une application similaire
                </p>
              </div>
            </div>
            <Switch
              checked={twoFactorEnabled}
              onCheckedChange={setTwoFactorEnabled}
            />
          </div>
          {!twoFactorEnabled && (
            <div className="mt-4 p-4 rounded-lg bg-yellow-50 border border-yellow-200">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-800">Recommandation</p>
                  <p className="text-sm text-yellow-700">
                    Nous vous recommandons fortement d'activer l'authentification à deux facteurs
                    pour protéger votre compte contre les accès non autorisés.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Sessions actives
              </CardTitle>
              <CardDescription>Gérez les appareils connectés à votre compte</CardDescription>
            </div>
            <Button variant="outline" size="sm" className="text-destructive bg-transparent">
              <LogOut className="mr-2 h-4 w-4" />
              Déconnecter tout
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {activeSessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-4 rounded-lg border"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <Monitor className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{session.device}</p>
                      {session.current && (
                        <Badge className="bg-green-100 text-green-700">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Cette session
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {session.location} - {session.lastActive}
                    </p>
                  </div>
                </div>
                {!session.current && (
                  <Button variant="ghost" size="sm" className="text-destructive">
                    <LogOut className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            {activeSessions.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Chargement des sessions...
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Security Log */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historique de sécurité
          </CardTitle>
          <CardDescription>Derniers événements de sécurité sur votre compte</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {securityEvents.map((event, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`h-2 w-2 rounded-full ${event.type === 'success' ? 'bg-green-500' :
                    event.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                    }`} />
                  <div>
                    <p className="font-medium text-sm">{event.event}</p>
                    <p className="text-xs text-muted-foreground">{event.location}</p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{event.date}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Paramètres de confidentialité</CardTitle>
          <CardDescription>Contrôlez comment vos données sont utilisées</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div>
              <p className="font-medium">Partage des données d'utilisation (RGPD)</p>
              <p className="text-sm text-muted-foreground">
                Aidez-nous à améliorer LeadFlow en partageant des données anonymes
              </p>
            </div>
            <Switch checked={gdprConsent} onCheckedChange={handleGdprToggle} disabled={isLoadingSettings} />
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div>
              <p className="font-medium">Emails marketing</p>
              <p className="text-sm text-muted-foreground">
                Recevoir des actualités et offres spéciales
              </p>
            </div>
            <Switch checked={emailMarketing} onCheckedChange={handleEmailMarketingToggle} disabled={isLoadingSettings} />
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div>
              <p className="font-medium">Profil public</p>
              <p className="text-sm text-muted-foreground">
                Rendre votre profil visible aux autres utilisateurs
              </p>
            </div>
            <Switch disabled />
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Zone de danger</CardTitle>
          <CardDescription>Actions irréversibles sur votre compte</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/30 bg-destructive/5">
            <div>
              <p className="font-medium">Supprimer le compte</p>
              <p className="text-sm text-muted-foreground">
                Cette action est définitive et supprimera toutes vos données
              </p>
            </div>
            <Button variant="destructive" size="sm" onClick={handleDeleteAccount} disabled={isDeleting}>
              {isDeleting ? "Suppression..." : "Supprimer mon compte"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
