'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Users,
    Plus,
    MoreHorizontal,
    Trash2,
    Loader2,
    Mail,
    Phone,
    Shield,
    UserCheck,
    Clock,
    X,
    Send,
    Crown,
    AlertCircle,
    Copy,
    CheckIcon,
} from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { PLANS, PlanType } from '@/lib/config/plans'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/dashboard/page-header'

interface TeamMember {
    id: string
    email: string
    first_name: string | null
    last_name: string | null
    role: 'admin' | 'manager' | 'member' | 'viewer'
    is_active: boolean
    created_at: string
    phone?: string | null
    department?: string | null
}

interface TeamInvitation {
    id: string
    email: string
    role: 'admin' | 'manager' | 'member' | 'viewer'
    status: 'pending'
    expires_at: string
    created_at: string
}

const roleConfig = {
    admin: { label: 'Administrateur', color: 'bg-red-100 text-red-700 border-red-200', icon: Shield },
    manager: { label: 'Manager', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: UserCheck },
    member: { label: 'Membre', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Users },
    viewer: { label: 'Lecteur', color: 'bg-slate-100 text-slate-700 border-slate-200', icon: Users },
}

export default function TeamPage() {
    const [members, setMembers] = useState<TeamMember[]>([])
    const [invitations, setInvitations] = useState<TeamInvitation[]>([])
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [sending, setSending] = useState(false)
    const [currentPlan, setCurrentPlan] = useState<PlanType>('starter')
    const [inviteForm, setInviteForm] = useState({ email: '', role: 'member' as TeamMember['role'] })
    const [invitationLink, setInvitationLink] = useState<string | null>(null)
    const [linkCopied, setLinkCopied] = useState(false)

    const supabase = createClient()

    const loadData = useCallback(async () => {
        setLoading(true)
        try {
            // Charger le plan actuel
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('plan')
                    .eq('id', user.id)
                    .single()
                if (profile?.plan) setCurrentPlan(profile.plan as PlanType)
            }

            // Charger membres + invitations
            const res = await fetch('/api/team')
            if (res.ok) {
                const data = await res.json()
                setMembers(data.members || [])
                setInvitations(data.invitations || [])
            }
        } catch (error) {
            console.error('Erreur chargement équipe:', error)
            toast.error('Erreur lors du chargement de l\'équipe')
        } finally {
            setLoading(false)
        }
    }, [supabase])

    useEffect(() => {
        loadData()
    }, [loadData])

    const planConfig = PLANS[currentPlan]
    const totalUsed = members.length + invitations.length
    const maxUsers = planConfig.maxUsers
    const isAtLimit = maxUsers !== Infinity && totalUsed >= maxUsers
    const usagePercent = maxUsers === Infinity ? 0 : Math.min((totalUsed / maxUsers) * 100, 100)

    async function sendInvitation() {
        if (!inviteForm.email.trim() || !inviteForm.email.includes('@')) {
            toast.error('Veuillez entrer un email valide')
            return
        }
        setSending(true)
        try {
            const res = await fetch('/api/team/invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(inviteForm),
            })
            const data = await res.json()
            if (!res.ok) {
                toast.error(data.error || 'Erreur lors de l\'invitation')
            } else {
                setIsDialogOpen(false)
                setInviteForm({ email: '', role: 'member' })
                // Afficher le lien pour partage manuel
                if (data.invitationLink) {
                    setInvitationLink(data.invitationLink)
                }
                toast.success(`Invitation créée pour ${data.invitation?.email} !`)
                loadData()
            }
        } catch {
            toast.error('Erreur réseau')
        } finally {
            setSending(false)
        }
    }

    async function cancelInvitation(invitationId: string) {
        try {
            const res = await fetch(`/api/team/${invitationId}?type=invitation`, { method: 'DELETE' })
            if (res.ok) {
                toast.success('Invitation annulée')
                setInvitations(prev => prev.filter(i => i.id !== invitationId))
            } else {
                const data = await res.json()
                toast.error(data.error || 'Erreur')
            }
        } catch {
            toast.error('Erreur réseau')
        }
    }

    async function removeMember(memberId: string) {
        if (!confirm('Supprimer ce membre de l\'équipe ?')) return
        try {
            const res = await fetch(`/api/team/${memberId}`, { method: 'DELETE' })
            if (res.ok) {
                toast.success('Membre supprimé')
                setMembers(prev => prev.filter(m => m.id !== memberId))
            } else {
                const data = await res.json()
                toast.error(data.error || 'Erreur')
            }
        } catch {
            toast.error('Erreur réseau')
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
                title="Gestion de l'équipe" 
                description="Gérez les accès et collaborez efficacement avec les membres de votre organisation."
            >
                <Button
                    onClick={() => setIsDialogOpen(true)}
                    disabled={isAtLimit}
                    className="shrink-0"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Inviter un membre
                </Button>
            </PageHeader>

            {/* Plan usage */}
            <Card className="bg-gradient-to-r from-primary/5 to-transparent border-primary/20">
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Crown className="h-4 w-4 text-primary" />
                            <span className="font-medium">Plan {planConfig.name}</span>
                            <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-xs">
                                {maxUsers === Infinity ? 'Illimité' : `${totalUsed} / ${maxUsers} membres`}
                            </Badge>
                        </div>
                        {isAtLimit && (
                            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 text-xs flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                Limite atteinte
                            </Badge>
                        )}
                    </div>
                    {maxUsers !== Infinity && (
                        <Progress value={usagePercent} className={`h-2 ${isAtLimit ? '[&>div]:bg-orange-500' : ''}`} />
                    )}
                    {isAtLimit && (
                        <p className="text-xs text-muted-foreground mt-2">
                            Passez au plan supérieur pour inviter davantage de membres.
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold">{members.length}</div>
                        <p className="text-sm text-muted-foreground">Membres actifs</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-orange-500">{invitations.length}</div>
                        <p className="text-sm text-muted-foreground">Invitations en attente</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-red-600">
                            {members.filter(m => m.role === 'admin').length}
                        </div>
                        <p className="text-sm text-muted-foreground">Administrateurs</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-purple-600">
                            {members.filter(m => m.role === 'manager').length}
                        </div>
                        <p className="text-sm text-muted-foreground">Managers</p>
                    </CardContent>
                </Card>
            </div>

            {/* Pending Invitations */}
            {invitations.length > 0 && (
                <Card className="border-orange-200 bg-orange-50/30">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Clock className="h-4 w-4 text-orange-500" />
                            Invitations en attente ({invitations.length})
                        </CardTitle>
                        <CardDescription>Ces personnes ont reçu un email d&apos;invitation mais n&apos;ont pas encore rejoint.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {invitations.map((inv) => {
                                const role = roleConfig[inv.role]
                                const RoleIcon = role.icon
                                const expiresDate = new Date(inv.expires_at).toLocaleDateString('fr-FR')
                                return (
                                    <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg border border-orange-200 bg-white/60">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-orange-600 font-semibold text-sm">
                                                {inv.email[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm flex items-center gap-2">
                                                    <Mail className="h-3 w-3 text-muted-foreground" />
                                                    {inv.email}
                                                </p>
                                                <p className="text-xs text-muted-foreground">Expire le {expiresDate}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className={`text-xs ${role.color}`}>
                                                <RoleIcon className="h-3 w-3 mr-1" />
                                                {role.label}
                                            </Badge>
                                            <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-200 text-xs">
                                                En attente
                                            </Badge>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                onClick={() => cancelInvitation(inv.id)}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Active Members */}
            <Card>
                <CardHeader>
                    <CardTitle>Membres de l&apos;équipe</CardTitle>
                    <CardDescription>{members.length} membre{members.length > 1 ? 's' : ''} actif{members.length > 1 ? 's' : ''}</CardDescription>
                </CardHeader>
                <CardContent>
                    {members.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Users className="h-12 w-12 text-muted-foreground mb-4" />
                            <p className="font-medium text-muted-foreground">Aucun membre pour l&apos;instant</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Invitez des collaborateurs pour commencer à travailler ensemble.
                            </p>
                            <Button className="mt-4" onClick={() => setIsDialogOpen(true)} disabled={isAtLimit}>
                                <Plus className="mr-2 h-4 w-4" />
                                Inviter le premier membre
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {members.map((member) => {
                                const role = roleConfig[member.role]
                                const RoleIcon = role.icon
                                return (
                                    <div
                                        key={member.id}
                                        className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                                                {(member.first_name?.[0] || member.email[0]).toUpperCase()}
                                                {member.last_name?.[0]?.toUpperCase() || ''}
                                            </div>
                                            <div>
                                                <p className="font-medium">
                                                    {member.first_name && member.last_name
                                                        ? `${member.first_name} ${member.last_name}`
                                                        : member.email}
                                                </p>
                                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <Mail className="h-3 w-3" />
                                                        {member.email}
                                                    </span>
                                                    {member.phone && (
                                                        <span className="flex items-center gap-1">
                                                            <Phone className="h-3 w-3" />
                                                            {member.phone}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Badge variant="outline" className={`text-xs ${role.color}`}>
                                                <RoleIcon className="h-3 w-3 mr-1" />
                                                {role.label}
                                            </Badge>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        className="text-destructive"
                                                        onClick={() => removeMember(member.id)}
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Retirer de l&apos;équipe
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Invite Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Send className="h-5 w-5 text-primary" />
                            Inviter un membre
                        </DialogTitle>
                        <DialogDescription>
                            Un email d&apos;invitation sera envoyé. Ils devront créer un compte ou se connecter pour rejoindre votre équipe.
                            {maxUsers !== Infinity && (
                                <span className="block mt-1 font-medium text-primary">
                                    {totalUsed}/{maxUsers} places utilisées (plan {planConfig.name})
                                </span>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="invite-email">Email *</Label>
                            <Input
                                id="invite-email"
                                type="email"
                                placeholder="collaborateur@exemple.com"
                                value={inviteForm.email}
                                onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                                onKeyDown={(e) => e.key === 'Enter' && sendInvitation()}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Rôle</Label>
                            <Select
                                value={inviteForm.role}
                                onValueChange={(val) => setInviteForm({ ...inviteForm, role: val as TeamMember['role'] })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admin">🔴 Administrateur — accès complet</SelectItem>
                                    <SelectItem value="manager">🟣 Manager — gestion équipe et prospects</SelectItem>
                                    <SelectItem value="member">🔵 Membre — usage standard</SelectItem>
                                    <SelectItem value="viewer">⬜ Lecteur — accès en lecture seule</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="bg-transparent">
                            Annuler
                        </Button>
                        <Button onClick={sendInvitation} disabled={sending || isAtLimit}>
                            {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                            Envoyer l&apos;invitation
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* ─── Dialog Lien d'invitation ─── */}
            <Dialog open={!!invitationLink} onOpenChange={(open) => { if (!open) { setInvitationLink(null); setLinkCopied(false) } }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Mail className="h-5 w-5 text-primary" />
                            Invitation créée ✅
                        </DialogTitle>
                        <DialogDescription>
                            Partagez ce lien avec le membre invité (valable 7 jours). Il devra s&apos;inscrire ou se connecter pour rejoindre l&apos;équipe.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="rounded-lg border bg-muted/50 p-3 break-all text-xs font-mono text-muted-foreground select-all">
                            {invitationLink}
                        </div>
                        <Button
                            className="w-full"
                            variant={linkCopied ? 'outline' : 'default'}
                            onClick={() => {
                                if (invitationLink) {
                                    navigator.clipboard.writeText(invitationLink)
                                    setLinkCopied(true)
                                    toast.success('Lien copié !')
                                    setTimeout(() => setLinkCopied(false), 3000)
                                }
                            }}
                        >
                            {linkCopied
                                ? <><CheckIcon className="mr-2 h-4 w-4 text-green-600" />Lien copié !</>
                                : <><Copy className="mr-2 h-4 w-4" />Copier le lien d&apos;invitation</>
                            }
                        </Button>
                        <p className="text-xs text-center text-muted-foreground">
                            💡 Partagez par email, WhatsApp ou tout autre moyen. Le membre clique pour rejoindre.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" className="w-full bg-transparent" onClick={() => { setInvitationLink(null); setLinkCopied(false) }}>
                            Fermer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
