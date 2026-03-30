"use client"

import React, { useRef, useState, useEffect } from "react"
import { User, Mail, Building2, Phone, Camera, Loader2, X } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

export function ProfileSettings() {
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [profile, setProfile] = useState({
    first_name: "",
    last_name: "",
    email: "",
    company: "",
    phone: "",
    avatar_url: "",
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => { loadProfile() }, [])

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    if (data) {
      setProfile({
        first_name: data.first_name || "",
        last_name: data.last_name || "",
        email: user.email || "",
        company: data.company || data.company_name || "",
        phone: data.phone || "",
        avatar_url: data.avatar_url || "",
      })
    } else {
      // Aucun profil en DB → utiliser les données auth
      setProfile(prev => ({ ...prev, email: user.email || "" }))
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) { toast.error("L'image ne doit pas dépasser 2 MB"); return }
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
      toast.error("Format invalide : JPG, PNG, GIF ou WebP uniquement")
      return
    }

    setIsUploading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { toast.error("Non authentifié"); return }

      const ext = file.name.split('.').pop() || 'jpg'
      const filePath = `${user.id}/avatar.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true, contentType: file.type })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // Cache-buster pour forcer le rechargement
      const avatarUrl = `${publicUrl}?t=${Date.now()}`

      await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', user.id)

      setProfile(prev => ({ ...prev, avatar_url: avatarUrl }))
      toast.success("Photo de profil mise à jour !")
    } catch (err: any) {
      toast.error("Erreur : " + (err.message || 'inconnu'))
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleRemoveAvatar = async () => {
    setIsUploading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      await supabase.from('profiles').update({ avatar_url: null }).eq('id', user.id)
      setProfile(prev => ({ ...prev, avatar_url: "" }))
      toast.success("Photo supprimée")
    } catch { toast.error("Erreur lors de la suppression") }
    finally { setIsUploading(false) }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { toast.error("Non authentifié"); return }

      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: profile.first_name || null,
          last_name: profile.last_name || null,
          company: profile.company || null,
          phone: profile.phone || null,
        })
        .eq('id', user.id)

      if (error) throw error
      toast.success("Profil mis à jour ✅")
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la mise à jour")
    } finally {
      setIsLoading(false)
    }
  }

  const initials = `${profile.first_name?.charAt(0) || ""}${profile.last_name?.charAt(0) || ""}`.toUpperCase() || "U"

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informations du profil</CardTitle>
        <CardDescription>Mettez à jour vos informations personnelles</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile.avatar_url || undefined} alt={profile.first_name} />
                <AvatarFallback className="text-lg">{initials}</AvatarFallback>
              </Avatar>
              {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
              />
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}>
                  <Camera className="mr-2 h-4 w-4" />
                  {isUploading ? "Upload…" : "Changer la photo"}
                </Button>
                {profile.avatar_url && (
                  <Button type="button" variant="ghost" size="sm" disabled={isUploading}
                    onClick={handleRemoveAvatar}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">JPG, PNG, GIF ou WebP. Max 2 MB.</p>
            </div>
          </div>

          {/* Nom & Prénom */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="first_name">Prénom</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input id="first_name" value={profile.first_name} className="pl-10"
                  placeholder="Votre prénom"
                  onChange={e => setProfile({ ...profile, first_name: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Nom</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input id="last_name" value={profile.last_name} className="pl-10"
                  placeholder="Votre nom"
                  onChange={e => setProfile({ ...profile, last_name: e.target.value })} />
              </div>
            </div>
          </div>

          {/* Email (lecture seule) */}
          <div className="space-y-2">
            <Label htmlFor="email">Adresse email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input id="email" type="email" value={profile.email} className="pl-10" disabled />
            </div>
            <p className="text-xs text-muted-foreground">L&apos;email ne peut pas être modifié</p>
          </div>

          {/* Entreprise & Téléphone */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="company">Entreprise</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input id="company" value={profile.company} className="pl-10"
                  placeholder="Nom de votre entreprise"
                  onChange={e => setProfile({ ...profile, company: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input id="phone" value={profile.phone} className="pl-10"
                  placeholder="+33 6 00 00 00 00"
                  onChange={e => setProfile({ ...profile, phone: e.target.value })} />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enregistrement…</>
                : "Enregistrer les modifications"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
