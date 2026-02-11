"use client"

import React from "react"

import { useState } from "react"
import { Shield, Key, Smartphone, History } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"

export function SecuritySettings() {
  const [isLoading, setIsLoading] = useState(false)
  const [twoFactor, setTwoFactor] = useState(false)
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  })

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (passwords.new !== passwords.confirm) {
      toast.error("Les mots de passe ne correspondent pas")
      return
    }
    
    if (passwords.new.length < 8) {
      toast.error("Le mot de passe doit contenir au moins 8 caracteres")
      return
    }
    
    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    toast.success("Mot de passe mis a jour avec succes")
    setPasswords({ current: "", new: "", confirm: "" })
    setIsLoading(false)
  }

  const sessions = [
    { device: "Chrome sur Windows", location: "Paris, France", lastActive: "Maintenant", current: true },
    { device: "Safari sur iPhone", location: "Paris, France", lastActive: "Il y a 2 heures", current: false },
    { device: "Firefox sur MacOS", location: "Lyon, France", lastActive: "Il y a 3 jours", current: false },
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Changer le mot de passe
          </CardTitle>
          <CardDescription>
            Mettez a jour votre mot de passe regulierement pour securiser votre compte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current">Mot de passe actuel</Label>
              <Input
                id="current"
                type="password"
                value={passwords.current}
                onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="new">Nouveau mot de passe</Label>
              <Input
                id="new"
                type="password"
                value={passwords.new}
                onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirmer le nouveau mot de passe</Label>
              <Input
                id="confirm"
                type="password"
                value={passwords.confirm}
                onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                required
              />
            </div>
            
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Mise a jour..." : "Mettre a jour le mot de passe"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Authentification a deux facteurs
          </CardTitle>
          <CardDescription>
            Ajoutez une couche de securite supplementaire a votre compte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Activer 2FA</Label>
              <p className="text-sm text-muted-foreground">
                Utilisez une application d'authentification pour generer des codes
              </p>
            </div>
            <Switch
              checked={twoFactor}
              onCheckedChange={(checked) => {
                setTwoFactor(checked)
                toast.success(checked ? "2FA active" : "2FA desactive")
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Sessions actives
          </CardTitle>
          <CardDescription>
            Gerez les appareils connectes a votre compte
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sessions.map((session, index) => (
            <div 
              key={index}
              className="flex items-center justify-between p-4 rounded-lg border"
            >
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-foreground">{session.device}</h4>
                  {session.current && (
                    <span className="text-xs bg-success/10 text-success px-2 py-0.5 rounded">
                      Session actuelle
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {session.location} - {session.lastActive}
                </p>
              </div>
              {!session.current && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => toast.success("Session revoquee")}
                >
                  Revoquer
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
