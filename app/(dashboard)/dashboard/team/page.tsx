'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  Edit2,
  Loader2,
  Mail,
  Phone,
  Shield,
  UserCheck,
  UserX
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
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface TeamMember {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  role: 'admin' | 'manager' | 'member' | 'viewer'
  avatar_url: string | null
  phone: string | null
  department: string | null
  is_active: boolean
  created_at: string
}

const roleConfig = {
  admin: { label: 'Administrateur', color: 'bg-red-100 text-red-700', icon: Shield },
  manager: { label: 'Manager', color: 'bg-purple-100 text-purple-700', icon: UserCheck },
  member: { label: 'Membre', color: 'bg-blue-100 text-blue-700', icon: Users },
  viewer: { label: 'Lecteur', color: 'bg-slate-100 text-slate-700', icon: Users }
}

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    role: 'member' as TeamMember['role'],
    phone: '',
    department: ''
  })
  const supabase = createClient()

  useEffect(() => {
    loadMembers()
  }, [])

  async function loadMembers() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setMembers(data || [])
    } catch (error: any) {
      console.error('Erreur:', error)
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  async function saveMember() {
    if (!formData.email.trim()) {
      toast.error('Veuillez entrer un email')
      return
    }

    setSaving(true)
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) throw new Error('Non authentifié')

      // Check subscription limits if creating a new member
      if (!editingMember) {
        const { checkLimit } = await import('@/lib/utils/subscription-client')
        const limitCheck = await checkLimit('users')
        if (!limitCheck.allowed) {
          toast.error(limitCheck.error)
          setSaving(false)
          return
        }
      }

      const memberData = {
        email: formData.email.trim(),
        first_name: formData.first_name.trim() || null,
        last_name: formData.last_name.trim() || null,
        role: formData.role,
        phone: formData.phone.trim() || null,
        department: formData.department.trim() || null,
        user_id: userData.user.id
      }

      if (editingMember) {
        const { data, error } = await supabase
          .from('team_members')
          .update(memberData)
          .eq('id', editingMember.id)
          .select()
          .single()

        if (error) throw error
        setMembers(members.map(m => m.id === editingMember.id ? data : m))
        toast.success('Membre modifié!')
      } else {
        const { data, error } = await supabase
          .from('team_members')
          .insert({ ...memberData, is_active: true })
          .select()
          .single()

        if (error) throw error
        setMembers([data, ...members])
        toast.success('Membre ajouté!')
      }

      closeDialog()
    } catch (error: any) {
      console.error('Erreur:', error)
      toast.error(error.message || 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  async function toggleMemberStatus(member: TeamMember) {
    try {
      const { error } = await supabase
        .from('team_members')
        .update({ is_active: !member.is_active })
        .eq('id', member.id)

      if (error) throw error
      setMembers(members.map(m => m.id === member.id ? { ...m, is_active: !m.is_active } : m))
      toast.success(member.is_active ? 'Membre désactivé' : 'Membre activé')
    } catch (error: any) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la mise à jour')
    }
  }

  async function deleteMember(memberId: string) {
    if (!confirm('Supprimer ce membre?')) return

    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', memberId)

      if (error) throw error
      setMembers(members.filter(m => m.id !== memberId))
      toast.success('Membre supprimé')
    } catch (error: any) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la suppression')
    }
  }

  function openCreateDialog() {
    setEditingMember(null)
    setFormData({
      email: '',
      first_name: '',
      last_name: '',
      role: 'member',
      phone: '',
      department: ''
    })
    setIsDialogOpen(true)
  }

  function openEditDialog(member: TeamMember) {
    setEditingMember(member)
    setFormData({
      email: member.email,
      first_name: member.first_name || '',
      last_name: member.last_name || '',
      role: member.role,
      phone: member.phone || '',
      department: member.department || ''
    })
    setIsDialogOpen(true)
  }

  function closeDialog() {
    setIsDialogOpen(false)
    setEditingMember(null)
  }

  const stats = {
    total: members.length,
    active: members.filter(m => m.is_active).length,
    admins: members.filter(m => m.role === 'admin').length,
    managers: members.filter(m => m.role === 'manager').length
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
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Équipe</h1>
          <p className="text-muted-foreground">Gérez les membres de votre équipe</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Inviter un membre
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-sm text-muted-foreground">Total membres</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <p className="text-sm text-muted-foreground">Actifs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{stats.admins}</div>
            <p className="text-sm text-muted-foreground">Administrateurs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-600">{stats.managers}</div>
            <p className="text-sm text-muted-foreground">Managers</p>
          </CardContent>
        </Card>
      </div>

      {/* Members List */}
      <Card>
        <CardHeader>
          <CardTitle>Membres de l'équipe</CardTitle>
          <CardDescription>{members.length} membres</CardDescription>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                Aucun membre dans l'équipe.<br />
                Invitez des collaborateurs pour commencer.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {members.map((member) => {
                const role = roleConfig[member.role]
                const RoleIcon = role.icon

                return (
                  <div
                    key={member.id}
                    className={`flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors ${!member.is_active ? 'opacity-50' : ''
                      }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                        {member.first_name?.[0]?.toUpperCase() || member.email[0].toUpperCase()}
                        {member.last_name?.[0]?.toUpperCase() || ''}
                      </div>
                      <div>
                        <p className="font-medium">
                          {member.first_name && member.last_name
                            ? `${member.first_name} ${member.last_name}`
                            : member.email
                          }
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
                        {member.department && (
                          <p className="text-xs text-muted-foreground mt-1">{member.department}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge className={role.color}>
                        <RoleIcon className="h-3 w-3 mr-1" />
                        {role.label}
                      </Badge>
                      {!member.is_active && (
                        <Badge variant="outline" className="text-red-600">Inactif</Badge>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(member)}>
                            <Edit2 className="mr-2 h-4 w-4" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleMemberStatus(member)}>
                            {member.is_active ? (
                              <>
                                <UserX className="mr-2 h-4 w-4" />
                                Désactiver
                              </>
                            ) : (
                              <>
                                <UserCheck className="mr-2 h-4 w-4" />
                                Activer
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => deleteMember(member.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Supprimer
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
            <DialogTitle>{editingMember ? 'Modifier le membre' : 'Inviter un membre'}</DialogTitle>
            <DialogDescription>
              {editingMember ? 'Modifiez les informations du membre' : 'Ajoutez un nouveau membre à votre équipe'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@exemple.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="first_name">Prénom</Label>
                <Input
                  id="first_name"
                  placeholder="Jean"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="last_name">Nom</Label>
                <Input
                  id="last_name"
                  placeholder="Dupont"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Rôle</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value as TeamMember['role'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrateur</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="member">Membre</SelectItem>
                    <SelectItem value="viewer">Lecteur</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  placeholder="+33..."
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="department">Département</Label>
              <Input
                id="department"
                placeholder="Ex: Commercial, Marketing..."
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Annuler
            </Button>
            <Button onClick={saveMember} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingMember ? 'Modifier' : 'Inviter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
