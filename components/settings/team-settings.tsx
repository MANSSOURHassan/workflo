'use client'

import { useState, useEffect, useCallback } from 'react'
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    Users,
    Plus,
    Trash2,
    Loader2,
    Mail,
    Shield,
    UserCheck,
    Clock,
    X,
    Send,
    Crown,
    AlertCircle,
    MoreHorizontal,
} from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { PLANS, PlanType } from '@/lib/config/plans'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

const roleConfig = {
    admin: { label: 'Administrateur', color: 'bg-red-100 text-red-700 border-red-200', icon: Shield },
    manager: { label: 'Manager', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: UserCheck },
    member: { label: 'Membre', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Users },
    viewer: { label: 'Lecteur', color: 'bg-slate-100 text-slate-700 border-slate-200', icon: Users },
}

export function TeamSettings() {
    const [members, setMembers] = useState<any[]>([])
    const [invitations, setInvitations] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [sending, setSending] = useState(false)
    const [currentPlan, setCurrentPlan] = useState<PlanType>('starter')
    const [inviteForm, setInviteForm] = useState({ email: '', role: 'member' })

    const supabase = createClient()

    const loadData = useCallback(async () => {
        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('plan')
                    .eq('id', user.id)
                    .single()
                if (profile?.plan) setCurrentPlan(profile.plan as PlanType)
            }

            const res = await fetch('/api/team')
            if (res.ok) {
                const data = await res.json()
                setMembers(data.members || [])
                setInvitations(data.invitations || [])
            }
        } catch {
            toast.error('Erreur lors du chargement de l\'équipe')
        } finally {
            setLoading(false)
        }
    }, [supabase])

    useEffect(() => { loadData() }, [loadData])

    const planConfig = PLANS[currentPlan]
    const totalUsed = members.length + invitations.length
    const maxUsers = planConfig.maxUsers
    const isAtLimit = maxUsers !== Infinity && totalUsed >= maxUsers
    const usagePercent = maxUsers === Infinity ? 0 : Math.min((totalUsed / maxUsers) * 100, 100)

    async function sendInvitation() {
        if (!inviteForm.email.trim() || !inviteForm.email.includes('@')) {
            toast.error('Email invalide')
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
                toast.error(data.error || 'Erreur')
            } else {
                toast.success(`Invitation envoyée à ${inviteForm.email} !`)
                setIsDialogOpen(false)
                setInviteForm({ email: '', role: 'member' })
                loadData()
            }
        } catch {
            toast.error('Erreur réseau')
        } finally {
            setSending(false)
        }
    }

    async function cancelInvitation(id: string) {
        const res = await fetch(`/api/team/${id}?type=invitation`, { method: 'DELETE' })
        if (res.ok) {
            toast.success('Invitation annulée')
            setInvitations(prev => prev.filter(i => i.id !== id))
        }
    }

    async function removeMember(id: string) {
        if (!confirm('Retirer ce membre ?')) return
        const res = await fetch(`/api/team/${id}`, { method: 'DELETE' })
        if (res.ok) {
            toast.success('Membre retiré')
            setMembers(prev => prev.filter(m => m.id !== id))
        }
    }

    if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold">Gestion de l&apos;équipe</h2>
                    <p className="text-sm text-muted-foreground">Invitez des collaborateurs par email</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" asChild className="bg-transparent">
                        <Link href="/dashboard/team">Vue complète</Link>
                    </Button>
                    <Button onClick={() => setIsDialogOpen(true)} disabled={isAtLimit}>
                        <Plus className="mr-2 h-4 w-4" />
                        Inviter
                    </Button>
                </div>
            </div>

            {/* Usage */}
            <Card className="bg-gradient-to-r from-primary/5 to-transparent border-primary/20">
                <CardContent className="pt-5 pb-5">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <Crown className="h-4 w-4 text-primary" />
                            <span className="font-medium text-sm">Plan {planConfig.name}</span>
                            <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-xs">
                                {maxUsers === Infinity ? `${totalUsed} membres` : `${totalUsed} / ${maxUsers} membres`}
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
                        <Progress value={usagePercent} className={`h-1.5 ${isAtLimit ? '[&>div]:bg-orange-500' : ''}`} />
                    )}
                </CardContent>
            </Card>

            {/* Pending invitations */}
            {invitations.length > 0 && (
                <Card className="border-orange-200 bg-orange-50/30">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <Clock className="h-4 w-4 text-orange-500" />
                            {invitations.length} invitation{invitations.length > 1 ? 's' : ''} en attente
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {invitations.map(inv => (
                                <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg border border-orange-200 bg-white/60">
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-4 w-4 text-orange-500" />
                                        <span className="text-sm font-medium">{inv.email}</span>
                                        <Badge variant="outline" className={`text-xs ${roleConfig[inv.role as keyof typeof roleConfig].color}`}>
                                            {roleConfig[inv.role as keyof typeof roleConfig].label}
                                        </Badge>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                        onClick={() => cancelInvitation(inv.id)}
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Members */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm">Membres actifs ({members.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {members.length === 0 ? (
                        <div className="text-center py-8">
                            <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">Aucun membre. Invitez des collaborateurs !</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {members.map(m => {
                                const role = roleConfig[m.role as keyof typeof roleConfig]
                                const RoleIcon = role.icon
                                return (
                                    <div key={m.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                                                {(m.first_name?.[0] || m.email[0]).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">{m.first_name && m.last_name ? `${m.first_name} ${m.last_name}` : m.email}</p>
                                                <p className="text-xs text-muted-foreground">{m.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className={`text-xs ${role.color}`}>
                                                <RoleIcon className="h-3 w-3 mr-1" />
                                                {role.label}
                                            </Badge>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7">
                                                        <MoreHorizontal className="h-3.5 w-3.5" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem className="text-destructive" onClick={() => removeMember(m.id)}>
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Retirer
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

            {/* Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Send className="h-5 w-5 text-primary" />
                            Inviter un membre
                        </DialogTitle>
                        <DialogDescription>
                            Un email sera envoyé. Ils devront se connecter pour rejoindre votre équipe.
                            {maxUsers !== Infinity && (
                                <span className="block mt-1 font-medium text-primary">
                                    {totalUsed}/{maxUsers} membres (plan {planConfig.name})
                                </span>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="team-invite-email">Email *</Label>
                            <Input
                                id="team-invite-email"
                                type="email"
                                placeholder="collaborateur@exemple.com"
                                value={inviteForm.email}
                                onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                                onKeyDown={(e) => e.key === 'Enter' && sendInvitation()}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Rôle</Label>
                            <Select value={inviteForm.role} onValueChange={(v) => setInviteForm({ ...inviteForm, role: v })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admin">🔴 Administrateur</SelectItem>
                                    <SelectItem value="manager">🟣 Manager</SelectItem>
                                    <SelectItem value="member">🔵 Membre</SelectItem>
                                    <SelectItem value="viewer">⬜ Lecteur</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="bg-transparent">Annuler</Button>
                        <Button onClick={sendInvitation} disabled={sending || isAtLimit}>
                            {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                            Envoyer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
