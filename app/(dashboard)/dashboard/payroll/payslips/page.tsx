'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Loader2, FileText, ArrowRight, Eye } from 'lucide-react'
import { formatCurrency, MONTHS_FR, calculerCotisations } from '@/lib/payroll/calculations'
import { toast } from 'sonner'

const STATUS_MAP: Record<string, { label: string; variant: any }> = {
    draft: { label: 'Brouillon', variant: 'secondary' },
    issued: { label: 'Émis', variant: 'default' },
    paid: { label: 'Payé', variant: 'outline' },
    archived: { label: 'Archivé', variant: 'outline' },
}

export default function PayslipsPage() {
    const [payslips, setPayslips] = useState<any[]>([])
    const [employees, setEmployees] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString())

    const now = new Date()
    const [form, setForm] = useState({
        employee_id: '', period_month: (now.getMonth() + 1).toString(),
        period_year: now.getFullYear().toString(),
        bonus: '0', bonus_label: '', meal_allowance: '0',
        transport_allowance: '0', overtime_hours: '0', overtime_amount: '0',
        taux_impot: '0', leave_taken: '0', notes: '',
    })

    const load = useCallback(async () => {
        setLoading(true)
        const [pRes, eRes] = await Promise.all([
            fetch(`/api/payroll/payslips?year=${filterYear}`),
            fetch('/api/payroll/employees'),
        ])
        if (pRes.ok) setPayslips(await pRes.json())
        if (eRes.ok) setEmployees(await eRes.json())
        setLoading(false)
    }, [filterYear])

    useEffect(() => { load() }, [load])

    const selectedEmployee = employees.find(e => e.id === form.employee_id)
    const preview = selectedEmployee
        ? calculerCotisations(
            selectedEmployee.gross_salary, parseFloat(form.bonus || '0'),
            parseFloat(form.meal_allowance || '0'), parseFloat(form.transport_allowance || '0'),
            parseFloat(form.overtime_amount || '0'), parseFloat(form.taux_impot || '0'),
        ) : null

    const handleGenerate = async () => {
        if (!form.employee_id) { toast.error('Sélectionnez un employé'); return }
        setSaving(true)
        try {
            const res = await fetch('/api/payroll/payslips', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    period_month: parseInt(form.period_month),
                    period_year: parseInt(form.period_year),
                    gross_salary: selectedEmployee?.gross_salary,
                    bonus: parseFloat(form.bonus || '0'),
                    meal_allowance: parseFloat(form.meal_allowance || '0'),
                    transport_allowance: parseFloat(form.transport_allowance || '0'),
                    overtime_hours: parseFloat(form.overtime_hours || '0'),
                    overtime_amount: parseFloat(form.overtime_amount || '0'),
                    taux_impot: parseFloat(form.taux_impot || '0'),
                    leave_taken: parseInt(form.leave_taken || '0'),
                }),
            })
            if (res.ok) { toast.success('Fiche de paie générée !'); setDialogOpen(false); load() }
            else { const d = await res.json(); toast.error(d.error || 'Erreur') }
        } catch { toast.error('Erreur réseau') }
        setSaving(false)
    }

    const years = [now.getFullYear(), now.getFullYear() - 1, now.getFullYear() - 2]

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Fiches de paie</h1>
                    <p className="text-sm text-muted-foreground mt-1">{payslips.length} fiche{payslips.length > 1 ? 's' : ''}</p>
                </div>
                <Button onClick={() => setDialogOpen(true)}><Plus className="mr-2 h-4 w-4" />Générer une fiche</Button>
            </div>

            <div className="flex gap-3">
                <Select value={filterYear} onValueChange={setFilterYear}>
                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>{years.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent>
                </Select>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : payslips.length === 0 ? (
                <Card><CardContent className="py-16 text-center text-muted-foreground">
                    <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p>Aucune fiche de paie pour {filterYear}.</p>
                    <Button className="mt-4" onClick={() => setDialogOpen(true)}><Plus className="mr-2 h-4 w-4" />Générer la première fiche</Button>
                </CardContent></Card>
            ) : (
                <Card>
                    <CardHeader><CardTitle>Fiches {filterYear}</CardTitle></CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {payslips.map(p => {
                                const s = STATUS_MAP[p.status] || STATUS_MAP.draft
                                return (
                                    <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                                        <div className="flex-1">
                                            <p className="font-medium text-sm">{p.employees?.first_name} {p.employees?.last_name}</p>
                                            <p className="text-xs text-muted-foreground">{MONTHS_FR[(p.period_month ?? 1) - 1]} {p.period_year} · {p.employees?.job_title}</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <Badge variant={s.variant}>{s.label}</Badge>
                                            <div className="text-right min-w-[80px]">
                                                <p className="text-sm font-semibold">{formatCurrency(p.net_to_pay)}</p>
                                                <p className="text-xs text-muted-foreground">brut : {formatCurrency(p.gross_salary)}</p>
                                            </div>
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={`/dashboard/payroll/payslips/${p.id}`}><Eye className="mr-1 h-4 w-4" />Voir</Link>
                                            </Button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Dialog Génération */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader><DialogTitle>Générer une fiche de paie</DialogTitle></DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-1">
                            <Label>Employé *</Label>
                            <Select value={form.employee_id} onValueChange={v => setForm({ ...form, employee_id: v })}>
                                <SelectTrigger><SelectValue placeholder="Sélectionner un employé" /></SelectTrigger>
                                <SelectContent>{employees.map(e => <SelectItem key={e.id} value={e.id}>{e.first_name} {e.last_name} — {formatCurrency(e.gross_salary)}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label>Mois</Label>
                                <Select value={form.period_month} onValueChange={v => setForm({ ...form, period_month: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>{MONTHS_FR.map((m, i) => <SelectItem key={i + 1} value={(i + 1).toString()}>{m}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <Label>Année</Label>
                                <Select value={form.period_year} onValueChange={v => setForm({ ...form, period_year: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>{years.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label>Prime (€)</Label>
                                <Input type="number" value={form.bonus} onChange={e => setForm({ ...form, bonus: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                                <Label>Libellé prime</Label>
                                <Input value={form.bonus_label} onChange={e => setForm({ ...form, bonus_label: e.target.value })} placeholder="Prime de performance" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label>Ticket repas (€)</Label>
                                <Input type="number" value={form.meal_allowance} onChange={e => setForm({ ...form, meal_allowance: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                                <Label>Transport (€)</Label>
                                <Input type="number" value={form.transport_allowance} onChange={e => setForm({ ...form, transport_allowance: e.target.value })} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label>Heures supplémentaires</Label>
                                <Input type="number" value={form.overtime_hours} onChange={e => setForm({ ...form, overtime_hours: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                                <Label>Montant heures supp (€)</Label>
                                <Input type="number" value={form.overtime_amount} onChange={e => setForm({ ...form, overtime_amount: e.target.value })} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label>Prélèvement à la source (%)</Label>
                                <Input type="number" value={form.taux_impot} onChange={e => setForm({ ...form, taux_impot: e.target.value })} placeholder="0" />
                            </div>
                            <div className="space-y-1">
                                <Label>Congés pris (jours)</Label>
                                <Input type="number" value={form.leave_taken} onChange={e => setForm({ ...form, leave_taken: e.target.value })} />
                            </div>
                        </div>

                        {/* Aperçu calcul */}
                        {preview && selectedEmployee && (
                            <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 space-y-2">
                                <p className="font-semibold text-sm">Aperçu du calcul</p>
                                <div className="grid grid-cols-3 gap-2 text-sm">
                                    <div className="text-center p-2 bg-background rounded border">
                                        <p className="text-xs text-muted-foreground">Salaire brut</p>
                                        <p className="font-bold">{formatCurrency(selectedEmployee.gross_salary + parseFloat(form.bonus || '0'))}</p>
                                    </div>
                                    <div className="text-center p-2 bg-background rounded border">
                                        <p className="text-xs text-muted-foreground">Cotisations sal.</p>
                                        <p className="font-bold text-orange-600">−{formatCurrency(preview.totalSalarial)}</p>
                                    </div>
                                    <div className="text-center p-2 bg-green-50 rounded border border-green-200">
                                        <p className="text-xs text-muted-foreground">Net à payer</p>
                                        <p className="font-bold text-green-700">{formatCurrency(preview.netAPayer)}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)} className="bg-transparent">Annuler</Button>
                        <Button onClick={handleGenerate} disabled={saving}>
                            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                            Générer la fiche
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
