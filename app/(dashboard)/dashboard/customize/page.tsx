'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Palette,
  Upload,
  Globe,
  Bell,
  Mail,
  Smartphone,
  Monitor,
  Sun,
  Moon,
  Check,
  Loader2,
  Save
} from 'lucide-react'
import { getCustomization, updateCustomization } from '@/lib/actions/customize'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { PageHeader } from '@/components/dashboard/page-header'

import type { Customization } from '@/lib/types/database'

export type ExtendedCustomization = Customization & {
  language?: string
  timezone?: string
}

const colorThemes = [
  { name: 'Bleu', primary: '#4F46E5', secondary: '#818CF8' },
  { name: 'Vert', primary: '#10B981', secondary: '#34D399' },
  { name: 'Orange', primary: '#F59E0B', secondary: '#FBBF24' },
  { name: 'Rose', primary: '#EC4899', secondary: '#F472B6' },
  { name: 'Rouge', primary: '#EF4444', secondary: '#F87171' },
  { name: 'Violet', primary: '#8B5CF6', secondary: '#A78BFA' },
]

const languages = [
  { value: 'Français', label: 'Français' },
  { value: 'English', label: 'English' },
  { value: 'Español', label: 'Español' },
  { value: 'Deutsch', label: 'Deutsch' },
]

const timezones = [
  { value: 'Europe/Paris (UTC+1)', label: 'Europe/Paris (UTC+1)' },
  { value: 'Europe/London (UTC+0)', label: 'Europe/London (UTC+0)' },
  { value: 'America/New_York (UTC-5)', label: 'America/New_York (UTC-5)' },
  { value: 'Asia/Tokyo (UTC+9)', label: 'Asia/Tokyo (UTC+9)' },
]

export default function CustomizePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [customization, setCustomization] = useState<Partial<ExtendedCustomization>>({
    company_name: '',
    email_signature: '',
    primary_color: '#4F46E5',
    theme: 'system',
    language: 'Français',
    timezone: 'Europe/Paris (UTC+1)'
  })

  // Local state for UI
  const [darkMode, setDarkMode] = useState(false)

  const logoInputRef = useRef<HTMLInputElement>(null)
  const faviconInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const { data, error } = await getCustomization()
      if (data) {
        setCustomization(data)
        setDarkMode(data.theme === 'dark')
      } else if (error && error !== 'Table customizations manquante') {
        toast.error('Erreur lors du chargement des préférences')
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      const { success, error } = await updateCustomization({
        ...customization,
        theme: darkMode ? 'dark' : 'light' // Simple logic for now
      })

      if (error) throw new Error(error)

      toast.success('Préférences enregistrées avec succès')
    } catch (error) {
      console.error(error)
      toast.error("Erreur lors de l'enregistrement")
    } finally {
      setSaving(false)
    }
  }

  const updateField = (field: keyof ExtendedCustomization, value: any) => {
    setCustomization(prev => ({ ...prev, [field]: value }))
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'favicon') => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Le fichier est trop volumineux (max 2MB)')
      return
    }

    const toastId = toast.loading('Téléchargement en cours...')

    try {
      const supabase = createClient()
      const fileExt = file.name.split('.').pop()
      const fileName = `${type}-${Date.now()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('branding')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('branding')
        .getPublicUrl(filePath)

      updateField(type === 'logo' ? 'logo_url' : 'favicon_url', publicUrl)
      toast.success('Image téléchargée avec succès')
    } catch (error) {
      console.error(error)
      toast.error('Erreur lors du téléchargement')
    } finally {
      toast.dismiss(toastId)
      // Reset input
      if (event.target) event.target.value = ''
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Personnalisation de l'Espace" 
        description="Adaptez le CRM à votre image : logo, couleurs, thèmes et préférences régionales pour une expérience sur mesure."
      >
        <Button onClick={handleSave} disabled={saving} className="bg-primary hover:shadow-lg shadow-primary/20 transition-all font-semibold">
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Enregistrer les modifications
        </Button>
      </PageHeader>

      {/* Branding */}
      <Card>
        <CardHeader>
          <CardTitle>Identité visuelle</CardTitle>
          <CardDescription>Personnalisez votre espace avec votre branding</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Logo de l'entreprise</Label>
                <div className="flex items-center gap-4">
                  <div className="flex h-20 w-20 items-center justify-center rounded-xl border-2 border-dashed bg-muted overflow-hidden">
                    {customization.logo_url ? (
                      <img src={customization.logo_url} alt="Logo" className="h-full w-full object-contain" />
                    ) : (
                      <Upload className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <input
                      type="file"
                      ref={logoInputRef}
                      className="hidden"
                      accept="image/png, image/jpeg, image/svg+xml"
                      onChange={(e) => handleFileUpload(e, 'logo')}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => logoInputRef.current?.click()}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Télécharger un logo
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      PNG, JPG jusqu'à 2MB
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-name">Nom de l'entreprise</Label>
                <Input
                  id="company-name"
                  value={customization.company_name || ''}
                  onChange={(e) => updateField('company_name', e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Favicon</Label>
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg border-2 border-dashed bg-muted overflow-hidden">
                    {customization.favicon_url ? (
                      <img src={customization.favicon_url} alt="Favicon" className="h-full w-full object-contain" />
                    ) : (
                      <Globe className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <input
                      type="file"
                      ref={faviconInputRef}
                      className="hidden"
                      accept="image/png, image/x-icon, image/vnd.microsoft.icon"
                      onChange={(e) => handleFileUpload(e, 'favicon')}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => faviconInputRef.current?.click()}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Télécharger
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      32x32 pixels recommandé
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Theme */}
      <Card>
        <CardHeader>
          <CardTitle>Thème et couleurs</CardTitle>
          <CardDescription>Choisissez un thème qui vous correspond</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                {darkMode ? <Moon className="h-6 w-6" /> : <Sun className="h-6 w-6" />}
              </div>
              <div>
                <p className="font-medium">Mode sombre</p>
                <p className="text-sm text-muted-foreground">
                  Activer le thème sombre pour réduire la fatigue oculaire
                </p>
              </div>
            </div>
            <Switch checked={darkMode} onCheckedChange={setDarkMode} />
          </div>

          <div className="space-y-3">
            <Label>Couleur principale</Label>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {colorThemes.map((theme) => (
                <button
                  key={theme.name}
                  onClick={() => updateField('primary_color', theme.primary)}
                  className={`relative flex flex-col items-center p-3 rounded-xl border-2 transition-all ${customization.primary_color === theme.primary
                    ? 'border-primary ring-2 ring-primary/20'
                    : 'border-transparent hover:border-muted-foreground/20'
                    }`}
                >
                  <div
                    className="h-10 w-10 rounded-full mb-2"
                    style={{ backgroundColor: theme.primary }}
                  />
                  <span className="text-xs font-medium">{theme.name}</span>
                  {customization.primary_color === theme.primary && (
                    <div className="absolute top-2 right-2 h-5 w-5 bg-primary rounded-full flex items-center justify-center">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications - Keeping this mainly static for now but could be linked to settings */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Configurez vos préférences de notification</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <Mail className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">Notifications email</p>
                <p className="text-sm text-muted-foreground">Recevez un email pour les événements importants</p>
              </div>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Email Signature */}
      <Card>
        <CardHeader>
          <CardTitle>Signature email</CardTitle>
          <CardDescription>Personnalisez votre signature pour les emails envoyés depuis le CRM</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Textarea
              placeholder="Votre signature email..."
              rows={6}
              value={customization.email_signature || ''}
              onChange={(e) => updateField('email_signature', e.target.value)}
            />
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Vous pouvez utiliser du HTML simple pour formater votre signature
              </p>
              <Button variant="outline" size="sm">
                Aperçu
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Language & Region */}
      <Card>
        <CardHeader>
          <CardTitle>Langue et région</CardTitle>
          <CardDescription>Paramètres régionaux et de langue</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Langue</Label>
              <Select
                value={customization.language}
                onValueChange={(value) => updateField('language', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une langue" />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Fuseau horaire</Label>
              <Select
                value={customization.timezone}
                onValueChange={(value) => updateField('timezone', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un fuseau horaire" />
                </SelectTrigger>
                <SelectContent>
                  {timezones.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Format de date</Label>
              <Input
                value={customization.date_format || 'DD/MM/YYYY'}
                onChange={(e) => updateField('date_format', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Devise</Label>
              <Input
                value={customization.default_currency || 'EUR'}
                onChange={(e) => updateField('default_currency', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
