'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Plus, Loader2, MoreHorizontal, Pencil, Trash2, Users, Euro } from 'lucide-react'
import { formatCurrency } from '@/lib/payroll/calculations'
import { toast } from 'sonner'

const CONTRACT_TYPES = ['CDI', 'CDD', 'Stage', 'Apprentissage', 'Freelance']

const EMPTY_FORM = {
    first_name: '', last_name: '', employee_number: '',
    job_title: '', department: '', contract_type: 'CDI',
    gross_salary: '', email: '', phone: '',
    hire_date: '', weekly_hours: '35', paid_leave_days: '25',
}

export default function EmployeesPage() {
    const [employees, setEmployees] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [form, setForm] = useState({ ...EMPTY_FORM })
    const [search, setSearch] = useState('')

    const load = useCallback(async () => {
        setLoading(true)
        const res = await fetch('/api/payroll/employees')
        if (res.ok) setEmployees(await res.json())
        setLoading(false)
    }, [])

    useEffect(() => { load() }, [load])

    const openCreate = () => { setEditingId(null); setForm({ ...EMPTY_FORM }); setDialogOpen(true) }
    const openEdit = (emp: any) => {
        setEditingId(emp.id)
        setForm({
            first_name: emp.first_name || '', last_name: emp.last_name || '',
            employee_number: emp.employee_number || '', job_title: emp.job_title || '',
            department: emp.department || '', contract_type: emp.contract_type || 'CDI',
            gross_salary: emp.gross_salary?.toString() || '', email: emp.email || '',
            phone: emp.phone || '', hire_date: emp.hire_date || '',
            weekly_hours: emp.weekly_hours?.toString() || '35',
            paid_leave_days: emp.paid_leave_days?.toString() || '25',
        })
        setDialogOpen(true)
    }

    const handleSave = async () => {
        if (!form.first_name || !form.last_name || !form.job_title || !form.gross_salary) {
            toast.error('Remplissez les champs obligatoires (prénom, nom, poste, salaire)')
            return
        }
        setSaving(true)
        try {
            const payload = { ...form, gross_salary: parseFloat(form.gross_salary), weekly_hours: parseFloat(form.weekly_hours), paid_leave_days: parseInt(form.paid_leave_days) }
            const url = editingId ? `/api/payroll/employees/${editingId}` : '/api/payroll/employees'
            const method = editingId ? 'PUT' : 'POST'
            const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
            if (res.ok) {
                toast.success(editingId ? 'Employé mis à jour' : 'Employé ajouté')
                setDialogOpen(false); load()
            } else {
                const d = await res.json(); toast.error(d.error || 'Erreur')
            }
        } catch { toast.error('Erreur réseau') }
        setSaving(false)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Supprimer cet employé ?')) return
        const res = await fetch(`/api/payroll/employees/${id}`, { method: 'DELETE' })
        if (res.ok) { toast.success('Employé supprimé'); load() }
        else toast.error('Erreur lors de la suppression')
    }

    const filtered = employees.filter(e =>
        `${e.first_name} ${e.last_name} ${e.job_title} ${e.department}`.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Employés</h1>
                    <p className="text-sm text-muted-foreground mt-1">{employees.length} employé{employees.length > 1 ? 's' : ''}</p>
                </div>
                <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Ajouter un employé</Button>
            </div>

            <div className="flex gap-3">
                <Input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : filtered.length === 0 ? (
                <Card><CardContent className="py-16 text-center text-muted-foreground">
                    <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p>Aucun employé trouvé.</p>
                    <Button className="mt-4" onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Ajouter le premier employé</Button>
                </CardContent></Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filtered.map(emp => (
                        <Card key={emp.id} className="hover:border-primary/50 transition-colors">
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle className="text-base">{emp.first_name} {emp.last_name}</CardTitle>
                                        <p className="text-sm text-muted-foreground">{emp.job_title}</p>
                                        {emp.department && <p className="text-xs text-muted-foreground">{emp.department}</p>}
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => openEdit(emp)}><Pencil className="mr-2 h-4 w-4" />Modifier</DropdownMenuItem>
                                            <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(emp.id)}><Trash2 className="mr-2 h-4 w-4" />Supprimer</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Badge variant="secondary">{emp.contract_type}</Badge>
                                    <span className="font-semibold text-sm flex items-center gap-1"><Euro className="h-3 w-3" />{formatCurrency(emp.gross_salary)} / mois</span>
                                </div>
                                {emp.hire_date && <p className="text-xs text-muted-foreground">Embauché le {new Date(emp.hire_date).toLocaleDateString('fr-FR')}</p>}
                                {emp.email && <p className="text-xs text-muted-foreground truncate">{emp.email}</p>}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Dialog Ajout/Édition */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingId ? 'Modifier l\'employé' : 'Ajouter un employé'}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label>Prénom *</Label>
                                <Input value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} placeholder="Jean" />
                            </div>
                            <div className="space-y-1">
                                <Label>Nom *</Label>
                                <Input value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} placeholder="Dupont" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label>Matricule</Label>
                                <Input value={form.employee_number} onChange={e => setForm({ ...form, employee_number: e.target.value })} placeholder="EMP001" />
                            </div>
                            <div className="space-y-1">
                                <Label>Contrat</Label>
                                <Select value={form.contract_type} onValueChange={v => setForm({ ...form, contract_type: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>{CONTRACT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <Label>Poste *</Label>
                            <Input value={form.job_title} onChange={e => setForm({ ...form, job_title: e.target.value })} placeholder="Développeur senior" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label>Département</Label>
                                <Input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} placeholder="IT" />
                            </div>
                            <div className="space-y-1">
                                <Label>Salaire brut mensuel (€) *</Label>
                                <Input type="number" value={form.gross_salary} onChange={e => setForm({ ...form, gross_salary: e.target.value })} placeholder="2000" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label>Email</Label>
                                <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="jean@entreprise.com" />
                            </div>
                            <div className="space-y-1">
                                <Label>Date d'embauche</Label>
                                <Input type="date" value={form.hire_date} onChange={e => setForm({ ...form, hire_date: e.target.value })} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label>Heures hebdo</Label>
                                <Input type="number" value={form.weekly_hours} onChange={e => setForm({ ...form, weekly_hours: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                                <Label>Jours congés / an</Label>
                                <Input type="number" value={form.paid_leave_days} onChange={e => setForm({ ...form, paid_leave_days: e.target.value })} />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)} className="bg-transparent">Annuler</Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            {editingId ? 'Enregistrer' : 'Ajouter'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
