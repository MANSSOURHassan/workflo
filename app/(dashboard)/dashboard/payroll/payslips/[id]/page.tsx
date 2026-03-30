'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { ArrowLeft, Printer, Loader2, Send, Pencil, Trash2 } from 'lucide-react'
import { formatCurrency, MONTHS_FR } from '@/lib/payroll/calculations'
import { toast } from 'sonner'
import Link from 'next/link'

const STATUS_MAP: Record<string, { label: string; variant: any }> = {
    draft: { label: 'Brouillon', variant: 'secondary' },
    issued: { label: 'Émis', variant: 'default' },
    paid: { label: 'Payé', variant: 'outline' },
    archived: { label: 'Archivé', variant: 'outline' },
}

export default function PayslipDetailPage() {
    const { id } = useParams<{ id: string }>()
    const router = useRouter()
    const [payslip, setPayslip] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [editOpen, setEditOpen] = useState(false)
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [editForm, setEditForm] = useState<any>({})

    useEffect(() => {
        fetch(`/api/payroll/payslips/${id}`)
            .then(r => r.ok ? r.json() : null)
            .then(d => { setPayslip(d); setLoading(false) })
    }, [id])

    const handleSend = async () => {
        setSending(true)
        try {
            const res = await fetch(`/api/payroll/payslips/${id}/send`, { method: 'POST' })
            const d = await res.json()
            if (res.ok) {
                toast.success(`Fiche envoyée à ${d.sentTo}`)
                setPayslip({ ...payslip, status: 'issued' })
            } else toast.error(d.error || 'Erreur envoi')
        } catch { toast.error('Erreur réseau') }
        setSending(false)
    }

    const handleDelete = async () => {
        setDeleting(true)
        const res = await fetch(`/api/payroll/payslips/${id}`, { method: 'DELETE' })
        if (res.ok) { toast.success('Fiche supprimée'); router.push('/dashboard/payroll/payslips') }
        else { toast.error('Erreur lors de la suppression'); setDeleting(false) }
        setDeleteOpen(false)
    }

    const openEdit = () => {
        setEditForm({
            bonus: payslip.bonus || 0,
            bonus_label: payslip.bonus_label || '',
            meal_allowance: payslip.meal_allowance || 0,
            transport_allowance: payslip.transport_allowance || 0,
            overtime_hours: payslip.overtime_hours || 0,
            overtime_amount: payslip.overtime_amount || 0,
            leave_taken: payslip.leave_taken || 0,
            payment_date: payslip.payment_date || '',
            notes: payslip.notes || '',
            status: payslip.status,
        })
        setEditOpen(true)
    }

    const handleSave = async () => {
        setSaving(true)
        const res = await fetch(`/api/payroll/payslips/${id}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(editForm),
        })
        if (res.ok) {
            const updated = await res.json()
            setPayslip({ ...payslip, ...updated })
            toast.success('Fiche mise à jour'); setEditOpen(false)
        } else toast.error('Erreur')
        setSaving(false)
    }

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
    if (!payslip) return <div className="text-center py-20 text-muted-foreground">Fiche introuvable</div>

    const emp = payslip.employees
    const monthLabel = `${MONTHS_FR[(payslip.period_month ?? 1) - 1]} ${payslip.period_year}`
    const periodStart = `01/${String(payslip.period_month).padStart(2, '0')}/${payslip.period_year}`
    const lastDay = new Date(payslip.period_year, payslip.period_month, 0).getDate()
    const periodEnd = `${lastDay}/${String(payslip.period_month).padStart(2, '0')}/${payslip.period_year}`
    const paymentDate = payslip.payment_date ? new Date(payslip.payment_date).toLocaleDateString('fr-FR') : periodEnd
    const s = STATUS_MAP[payslip.status] || STATUS_MAP.draft
    const brut = (payslip.gross_salary || 0) + (payslip.bonus || 0) + (payslip.overtime_amount || 0)

    return (
        <div className="flex flex-col gap-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between print:hidden">
                <Button variant="ghost" asChild>
                    <Link href="/dashboard/payroll/payslips"><ArrowLeft className="mr-2 h-4 w-4" />Retour</Link>
                </Button>
                <div className="flex items-center gap-2">
                    <Badge variant={s.variant}>{s.label}</Badge>
                    <Button variant="outline" size="sm" onClick={openEdit}>
                        <Pencil className="mr-1 h-4 w-4" />Modifier
                    </Button>
                    <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10 bg-transparent" onClick={() => setDeleteOpen(true)}>
                        <Trash2 className="mr-1 h-4 w-4" />Supprimer
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleSend} disabled={sending}>
                        {sending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Send className="mr-1 h-4 w-4" />}
                        {sending ? 'Envoi…' : 'Envoyer par email'}
                    </Button>
                    <Button size="sm" onClick={() => window.print()}>
                        <Printer className="mr-1 h-4 w-4" />Imprimer / PDF
                    </Button>
                </div>
            </div>

            {/* ═══════════════ BULLETIN DE SALAIRE ═══════════════ */}
            <div id="payslip-print" className="bg-white text-black border rounded-lg shadow-sm max-w-5xl mx-auto w-full text-[11px] print:shadow-none print:border-none print:rounded-none print:text-[10px]">
                {/* ── En-tête ── */}
                <div className="flex border-b-2 border-black">
                    {/* Employeur */}
                    <div className="flex-1 p-3 border-r border-black">
                        <p className="font-bold text-[13px] uppercase">Workflow CRM</p>
                        <p className="text-[10px] text-gray-600">Votre entreprise</p>
                        <div className="mt-2 text-[10px]">
                            <p>Siret : — · Code NAF : —</p>
                        </div>
                    </div>
                    {/* Titre + période */}
                    <div className="flex-1 p-3">
                        <h1 className="text-[18px] font-black uppercase text-center tracking-wide mb-2">BULLETIN DE SALAIRE</h1>
                        <div className="grid grid-cols-2 gap-x-4 text-[10px]">
                            <div><span className="font-semibold">Période : </span>{monthLabel}</div>
                            <div><span className="font-semibold">Paiement le : </span>{paymentDate}</div>
                            <div><span className="font-semibold">Du : </span>{periodStart}</div>
                            <div><span className="font-semibold">Au : </span>{periodEnd}</div>
                        </div>
                    </div>
                </div>

                {/* CP + Employé */}
                <div className="flex border-b border-black">
                    {/* CP N-1 / CP N */}
                    <div className="w-1/3 p-3 border-r border-black text-[10px]">
                        <div className="grid grid-cols-3 gap-1 mb-2">
                            <span></span>
                            <span className="font-bold text-center">CP N-1</span>
                            <span className="font-bold text-center">CP N</span>
                            <span>Acquis :</span>
                            <span className="text-center">0.00</span>
                            <span className="text-center">{payslip.leave_remaining ?? 0}</span>
                            <span>Total pris :</span>
                            <span className="text-center">0.00</span>
                            <span className="text-center">0.00</span>
                            <span>Solde :</span>
                            <span className="text-center">0.00</span>
                            <span className="text-center">{payslip.leave_remaining ?? 0}</span>
                        </div>
                        <div className="flex gap-4">
                            <div><span className="font-semibold">Matricule : </span>{emp?.employee_number || '—'}</div>
                        </div>
                        <div><span className="font-semibold">NoSécu : </span>{emp?.social_security_number || '—'}</div>
                    </div>
                    {/* Identité employé */}
                    <div className="flex-1 p-3 text-[11px]">
                        <p className="font-bold text-[13px] uppercase">{emp?.first_name} {emp?.last_name}</p>
                        {emp?.address && <p className="text-[10px] text-gray-700 mt-1">{emp.address}</p>}
                        <p className="mt-3 text-[10px]">
                            <span className="font-semibold">Entré(e) le : </span>
                            {emp?.hire_date ? new Date(emp.hire_date).toLocaleDateString('fr-FR') : '—'}
                        </p>
                        <p className="text-[10px]">
                            <span className="font-semibold">Emploi : </span>{emp?.job_title || '—'} &nbsp;
                            <span className="font-semibold">Contrat : </span>{emp?.contract_type || '—'}
                        </p>
                    </div>
                </div>

                {/* ── Tableau principal + Colonne droite ── */}
                <div className="flex border-b border-black">
                    {/* Tableau cotisations */}
                    <div className="flex-1">
                        <table className="w-full text-[10px] border-collapse">
                            <thead>
                                <tr className="bg-yellow-300 border-b border-black">
                                    <th className="text-left p-1.5 font-bold border-r border-black">Rubriques</th>
                                    <th className="text-right p-1.5 font-bold border-r border-black w-16">Base</th>
                                    <th className="text-right p-1.5 font-bold border-r border-black w-16">Taux salarial</th>
                                    <th className="text-right p-1.5 font-bold border-r border-black w-20">Montant salarial</th>
                                    <th className="text-right p-1.5 font-bold w-20">Mt patronal</th>
                                </tr>
                            </thead>
                            <tbody className="[&_td]:p-1 [&_td]:border-r [&_td]:border-gray-200">
                                {/* Salaire de base */}
                                <tr><td>SALAIRE DE BASE</td><td className="text-right">{payslip.worked_hours?.toFixed(2)}</td><td className="text-right">12.0200</td><td className="text-right font-medium">{formatCurrency(payslip.gross_salary)}</td><td className="text-right">{formatCurrency(payslip.gross_salary * 1.142)}</td></tr>
                                {payslip.overtime_amount > 0 && <tr><td>Heures supplémentaires ({payslip.overtime_hours}h)</td><td className="text-right">{payslip.overtime_hours}</td><td className="text-right">—</td><td className="text-right">{formatCurrency(payslip.overtime_amount)}</td><td></td></tr>}
                                {payslip.bonus > 0 && <tr><td>{payslip.bonus_label || 'PRIME'}</td><td className="text-right"></td><td className="text-right"></td><td className="text-right">{formatCurrency(payslip.bonus)}</td><td></td></tr>}

                                {/* Salaire brut */}
                                <tr className="bg-gray-100 font-bold"><td className="py-1.5">SALAIRE BRUT</td><td></td><td></td><td className="text-right py-1.5">{formatCurrency(brut)}</td><td></td></tr>

                                {/* Santé */}
                                <tr className="bg-yellow-50"><td colSpan={5} className="font-bold py-0.5">Q100 SANTÉ</td></tr>
                                <tr><td className="pl-3">Sécu.Soc-Mal.Mater.Inval.Déc.</td><td className="text-right">{(brut * 0.9825).toFixed(2)}</td><td className="text-right"></td><td className="text-right">—</td><td className="text-right">{formatCurrency(brut * 0.13)}</td></tr>
                                <tr><td className="pl-3">Compl. Incap.Inval.Déc</td><td className="text-right">{(brut * 0.9825).toFixed(2)}</td><td className="text-right">0.2700</td><td className="text-right">{formatCurrency(brut * 0.9825 * 0.0027)}</td><td className="text-right">{formatCurrency(brut * 0.015)}</td></tr>

                                {/* Retraite */}
                                <tr className="bg-yellow-50"><td colSpan={5} className="font-bold py-0.5">Q300 RETRAITE</td></tr>
                                <tr><td className="pl-3">Sécu.Soc Plafonnée</td><td className="text-right">{(brut * 0.9825).toFixed(2)}</td><td className="text-right">6.9000</td><td className="text-right">{formatCurrency(payslip.cotisation_retraite_base)}</td><td className="text-right">{formatCurrency(brut * 0.0855)}</td></tr>
                                <tr><td className="pl-3">Sécu.Soc Déplafonnée</td><td className="text-right">{(brut * 0.9825).toFixed(2)}</td><td className="text-right">0.4000</td><td className="text-right">{formatCurrency(brut * 0.004)}</td><td className="text-right">{formatCurrency(brut * 0.0175)}</td></tr>
                                <tr><td className="pl-3">Complémentaire Tranche 1</td><td className="text-right">{(brut * 0.9825).toFixed(2)}</td><td className="text-right">4.0100</td><td className="text-right">{formatCurrency(payslip.cotisation_retraite_comp)}</td><td className="text-right">{formatCurrency(brut * 0.0472)}</td></tr>

                                {/* Assurance chômage */}
                                <tr className="bg-yellow-50"><td colSpan={5} className="font-bold py-0.5">Q500 ASSURANCE CHÔMAGE</td></tr>
                                <tr><td className="pl-3">Chômage</td><td className="text-right">{(brut * 0.9825).toFixed(2)}</td><td className="text-right">0.0000</td><td className="text-right">—</td><td className="text-right">{formatCurrency(brut * 0.0405)}</td></tr>
                                <tr><td className="pl-3">AGS</td><td className="text-right">{(brut * 0.9825).toFixed(2)}</td><td className="text-right">0.0000</td><td className="text-right">—</td><td className="text-right">{formatCurrency(brut * 0.0015)}</td></tr>

                                {/* CSG */}
                                <tr className="bg-yellow-50"><td colSpan={5} className="font-bold py-0.5">Q800 CSG déductible à l'IR</td></tr>
                                <tr><td className="pl-3">CSG déductible à l'IR</td><td className="text-right">{(brut * 0.9825).toFixed(2)}</td><td className="text-right">6.8000</td><td className="text-right">{formatCurrency(payslip.cotisation_csg_deductible)}</td><td></td></tr>

                                {/* Exo / Total retenues */}
                                {(payslip.meal_allowance > 0 || payslip.transport_allowance > 0) && (
                                    <tr><td>EXO., ÉCRET. ET ALLEG. COTIS</td><td></td><td></td><td className="text-right text-green-700">+{formatCurrency((payslip.meal_allowance || 0) + (payslip.transport_allowance || 0))}</td><td className="text-right text-orange-600">—{formatCurrency((payslip.meal_allowance || 0) + (payslip.transport_allowance || 0))}</td></tr>
                                )}
                                <tr className="bg-orange-50 font-semibold border-t border-gray-300">
                                    <td className="py-1.5">TOTAL DES RETENUES</td><td></td><td></td>
                                    <td className="text-right py-1.5 text-orange-700">{formatCurrency(payslip.total_cotisations_salariales)}</td>
                                    <td className="text-right py-1.5 text-blue-700">{formatCurrency(payslip.total_cotisations_patronales)}</td>
                                </tr>

                                {/* Net imposable */}
                                <tr className="bg-gray-50"><td className="font-bold">NET IMPOSABLE</td><td></td><td></td><td className="text-right font-bold">{formatCurrency(payslip.net_before_tax)}</td><td></td></tr>

                                {/* CSG non déductible */}
                                <tr className="bg-yellow-50"><td colSpan={5} className="font-bold py-0.5">Q801 CSG/CRDS non déductible à l'IR</td></tr>
                                <tr><td className="pl-3">CSG/CRDS non déductible à l'IR</td><td className="text-right">{(brut * 0.9825).toFixed(2)}</td><td className="text-right">2.9000</td><td className="text-right">{formatCurrency(payslip.cotisation_csg_crds)}</td><td></td></tr>
                            </tbody>
                        </table>

                        {/* Net social + Net à payer */}
                        <div className="border-t-2 border-black">
                            <div className="flex border-b border-black">
                                <div className="flex-1 bg-yellow-200 p-2 font-bold text-[11px] border-r border-black">MONTANT NET SOCIAL</div>
                                <div className="w-24 bg-yellow-200 p-2 font-bold text-right text-[11px]">{formatCurrency(payslip.net_before_tax)}</div>
                            </div>
                            <div className="flex border-b border-black">
                                <div className="flex-1 bg-yellow-200 p-2 font-bold text-[11px] border-r border-black">NET A PAYER AVANT IMPÔT SUR LE REVENU</div>
                                <div className="w-24 bg-yellow-200 p-2 font-bold text-right text-[11px]">{formatCurrency(payslip.net_before_tax)}</div>
                            </div>

                            {/* Impôt sur le revenu */}
                            <table className="w-full text-[10px] border-collapse border-t border-gray-300">
                                <thead>
                                    <tr className="bg-gray-100 border-b border-black">
                                        <th className="text-left p-1.5 font-bold border-r border-black">Impôt sur le revenu</th>
                                        <th className="text-right p-1.5 font-bold border-r border-black w-20">Base</th>
                                        <th className="text-right p-1.5 font-bold border-r border-black w-16">Taux</th>
                                        <th className="text-right p-1.5 font-bold border-r border-black w-20">Montant</th>
                                        <th className="text-right p-1.5 font-bold w-20">Cumul annuel</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="[&_td]:p-1 [&_td]:border-r [&_td]:border-gray-200">
                                        <td>Montant net imposable</td>
                                        <td className="text-right">{formatCurrency(payslip.net_before_tax)}</td>
                                        <td className="text-right"></td>
                                        <td className="text-right">{formatCurrency(payslip.net_before_tax)}</td>
                                        <td className="text-right">{formatCurrency(payslip.net_before_tax)}</td>
                                    </tr>
                                    <tr className="[&_td]:p-1 [&_td]:border-r [&_td]:border-gray-200">
                                        <td>Impôt sur le revenu prélevé à la source</td>
                                        <td className="text-right">{formatCurrency(payslip.net_before_tax)}</td>
                                        <td className="text-right">0.00</td>
                                        <td className="text-right text-red-600">{payslip.impot_source > 0 ? `−${formatCurrency(payslip.impot_source)}` : '0.00'}</td>
                                        <td className="text-right"></td>
                                    </tr>
                                </tbody>
                            </table>

                            {/* NET FINAL */}
                            <div className="flex border-t-2 border-black">
                                <div className="flex-1 bg-yellow-400 p-2 font-black text-[13px] border-r border-black">NET à payer au salarié (En Euros)</div>
                                <div className="w-28 bg-yellow-400 p-2 font-black text-right text-[15px]">{formatCurrency(payslip.net_to_pay)}</div>
                            </div>
                        </div>
                    </div>

                    {/* ── Colonne droite ── */}
                    <div className="w-36 border-l-2 border-black text-[10px]">
                        {/* SMIC */}
                        <div className="border-b border-black p-2">
                            <p className="font-bold">SMIC Horaire :</p>
                            <p className="text-right font-semibold">11.88</p>
                        </div>
                        <div className="border-b border-black p-2">
                            <p className="font-bold">Plafond Sécu :</p>
                            <p className="text-right font-semibold">3 864.00</p>
                        </div>

                        {/* Heures */}
                        <div className="border-b-2 border-black p-2 bg-yellow-300">
                            <p className="font-black text-[11px]">HEURES</p>
                        </div>
                        <div className="border-b border-black p-2 space-y-1">
                            <div className="flex justify-between"><span>Heures période</span></div>
                            <div className="text-right font-bold">{payslip.worked_hours?.toFixed(2)}</div>
                            <div className="flex justify-between"><span>Cumul heures</span></div>
                            <div className="text-right font-bold">{payslip.worked_hours?.toFixed(2)}</div>
                            <div className="flex justify-between"><span>Cumul h.sup</span></div>
                            <div className="text-right font-bold">{payslip.overtime_hours?.toFixed(2) || '0.00'}</div>
                        </div>

                        {/* Congés */}
                        <div className="border-b border-black p-2 space-y-1">
                            <div>Solde rep.remp.</div>
                            <div className="text-right">—</div>
                            <div>Solde rep.récup.</div>
                            <div className="text-right">—</div>
                        </div>

                        {/* Cumuls */}
                        <div className="border-b-2 border-black p-2 bg-yellow-300">
                            <p className="font-black text-[11px]">CUMULS</p>
                        </div>
                        <div className="p-2 space-y-1">
                            <div>Bases</div>
                            <div className="text-right font-bold">{(brut * 0.9825).toFixed(2)}</div>
                            <div>Bruts</div>
                            <div className="text-right font-bold">{brut.toFixed(2)}</div>
                            <div>Hrs majorées</div>
                            <div className="text-right font-bold">{payslip.overtime_hours?.toFixed(2) || '0.00'}</div>
                        </div>

                        {/* Allègement */}
                        <div className="border-t border-black p-2 space-y-1">
                            <div>Allègement Cotis. employeur</div>
                            <div className="text-right text-orange-600">−{formatCurrency((payslip.meal_allowance || 0) + (payslip.transport_allowance || 0))}</div>
                            <div className="font-bold">Total Versé employeur</div>
                            <div className="text-right font-bold">{formatCurrency((brut) + (payslip.total_cotisations_patronales || 0))}</div>
                        </div>
                        <div className="border-t-2 border-black p-2 bg-yellow-200">
                            <div className="font-bold">Paiement</div>
                            <div className="text-right font-bold text-[12px]">{formatCurrency(payslip.net_to_pay)}</div>
                        </div>
                    </div>
                </div>

                {/* Pied légal */}
                <div className="p-3 text-[9px] text-gray-500 text-center border-t border-gray-300">
                    <p>Convention collective nationale — Conservez ce bulletin de paie sans limitation de durée.</p>
                    <p>À défaut de Convention Collective : Code du travail — Durée des congés payés : art.L.3141-3.6.7.11.12 — Durée préavis : art.L.1237-1 et L.1234-1</p>
                </div>
            </div>

            {/* ── Dialog Modifier ── */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader><DialogTitle>Modifier la fiche de paie</DialogTitle></DialogHeader>
                    <div className="grid gap-3 py-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label>Prime (€)</Label>
                                <Input type="number" value={editForm.bonus} onChange={e => setEditForm({ ...editForm, bonus: parseFloat(e.target.value) || 0 })} />
                            </div>
                            <div className="space-y-1">
                                <Label>Libellé prime</Label>
                                <Input value={editForm.bonus_label} onChange={e => setEditForm({ ...editForm, bonus_label: e.target.value })} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label>Indemnité repas (€)</Label>
                                <Input type="number" value={editForm.meal_allowance} onChange={e => setEditForm({ ...editForm, meal_allowance: parseFloat(e.target.value) || 0 })} />
                            </div>
                            <div className="space-y-1">
                                <Label>Indemnité transport (€)</Label>
                                <Input type="number" value={editForm.transport_allowance} onChange={e => setEditForm({ ...editForm, transport_allowance: parseFloat(e.target.value) || 0 })} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label>Heures supp.</Label>
                                <Input type="number" value={editForm.overtime_hours} onChange={e => setEditForm({ ...editForm, overtime_hours: parseFloat(e.target.value) || 0 })} />
                            </div>
                            <div className="space-y-1">
                                <Label>Montant heures supp (€)</Label>
                                <Input type="number" value={editForm.overtime_amount} onChange={e => setEditForm({ ...editForm, overtime_amount: parseFloat(e.target.value) || 0 })} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label>Congés pris (jours)</Label>
                                <Input type="number" value={editForm.leave_taken} onChange={e => setEditForm({ ...editForm, leave_taken: parseInt(e.target.value) || 0 })} />
                            </div>
                            <div className="space-y-1">
                                <Label>Date de paiement</Label>
                                <Input type="date" value={editForm.payment_date} onChange={e => setEditForm({ ...editForm, payment_date: e.target.value })} />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <Label>Statut</Label>
                            <Select value={editForm.status} onValueChange={v => setEditForm({ ...editForm, status: v })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {Object.entries(STATUS_MAP).map(([v, { label }]) => <SelectItem key={v} value={v}>{label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditOpen(false)} className="bg-transparent">Annuler</Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Enregistrer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Dialog Supprimer ── */}
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader><DialogTitle>Supprimer cette fiche ?</DialogTitle></DialogHeader>
                    <p className="text-sm text-muted-foreground">Cette action est irréversible. La fiche de paie de <strong>{emp?.first_name} {emp?.last_name}</strong> pour <strong>{monthLabel}</strong> sera définitivement supprimée.</p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteOpen(false)} className="bg-transparent">Annuler</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                            {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}Supprimer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Print CSS */}
            <style jsx global>{`
                @media print {
                    nav, header, aside, .print\\:hidden, button { display: none !important; }
                    body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    #payslip-print { box-shadow: none !important; border: none !important; }
                }
            `}</style>
        </div>
    )
}
