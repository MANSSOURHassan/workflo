'use client'

import React, { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { updateExpense } from '@/lib/actions/accounting'
import { Supplier, Expense } from '@/lib/types/database'
import { toast } from 'sonner'

interface EditExpenseModalProps {
    expense: Expense | null
    suppliers: Supplier[]
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export function EditExpenseModal({ expense, suppliers, open, onOpenChange, onSuccess }: EditExpenseModalProps) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        description: '',
        supplier_id: '',
        amount: '',
        tax_amount: '0',
        category: 'software',
        account_code: '606',
        status: 'pending' as 'pending' | 'paid' | 'cancelled',
        issue_date: new Date().toISOString().split('T')[0],
    })

    useEffect(() => {
        if (expense && open) {
            setFormData({
                description: expense.description || '',
                supplier_id: expense.supplier_id || '',
                amount: expense.amount?.toString() || '',
                tax_amount: expense.tax_amount?.toString() || '0',
                category: expense.category || 'software',
                account_code: expense.account_code || '606',
                status: expense.status || 'pending',
                issue_date: expense.issue_date || new Date().toISOString().split('T')[0],
            })
        }
    }, [expense, open])

    async function handleSubmit() {
        if (!expense?.id) return
        if (!formData.description || !formData.amount) {
            toast.error('Veuillez remplir les champs obligatoires')
            return
        }

        setLoading(true)
        try {
            const amount = parseFloat(formData.amount)
            const taxAmount = parseFloat(formData.tax_amount)

            const result = await updateExpense(expense.id, {
                description: formData.description,
                supplier_id: formData.supplier_id || null,
                amount,
                tax_amount: taxAmount,
                total_amount: amount + taxAmount,
                category: formData.category,
                account_code: formData.account_code,
                status: formData.status,
                issue_date: formData.issue_date,
            })

            if (result.error) throw new Error(result.error)

            toast.success('Dépense modifiée avec succès')
            onOpenChange(false)
            onSuccess()
        } catch (error: any) {
            toast.error(error.message || 'Erreur lors de la modification')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Mettre à jour la Dépense</DialogTitle>
                    <DialogDescription>
                        Modifiez les détails de votre facture fournisseur ou frais.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="edit-desc">Description *</Label>
                        <Input
                            id="edit-desc"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="edit-supplier">Fournisseur</Label>
                            <Select
                                value={formData.supplier_id}
                                onValueChange={(val) => setFormData({ ...formData, supplier_id: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Sélectionner..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none" disabled>Aucun</SelectItem>
                                    {suppliers.map((s) => (
                                        <SelectItem key={s.id} value={s.id}>
                                            {s.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-cat">Catégorie</Label>
                            <Select
                                value={formData.category}
                                onValueChange={(val) => setFormData({ ...formData, category: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="software">Logiciels / SaaS</SelectItem>
                                    <SelectItem value="marketing">Marketing / Pub</SelectItem>
                                    <SelectItem value="rent">Loyer / Bureaux</SelectItem>
                                    <SelectItem value="logistics">Logistique</SelectItem>
                                    <SelectItem value="services">Services / Freelance</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="edit-account">Compte Comptable</Label>
                            <Select
                                value={formData.account_code}
                                onValueChange={(val) => setFormData({ ...formData, account_code: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="601">601 - Achats matières premières</SelectItem>
                                    <SelectItem value="606">606 - Achats non stockés</SelectItem>
                                    <SelectItem value="616">616 - Primes d'assurance</SelectItem>
                                    <SelectItem value="623">623 - Publicité</SelectItem>
                                    <SelectItem value="626">626 - Frais Télécoms</SelectItem>
                                    <SelectItem value="641">641 - Salaires</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-amount">Montant HT (€) *</Label>
                            <Input
                                id="edit-amount"
                                type="number"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="edit-date">Date de facture</Label>
                            <Input
                                id="edit-date"
                                type="date"
                                value={formData.issue_date}
                                onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-tax">TVA (€)</Label>
                            <Input
                                id="edit-tax"
                                type="number"
                                value={formData.tax_amount}
                                onChange={(e) => setFormData({ ...formData, tax_amount: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="edit-status">Statut</Label>
                        <Select
                            value={formData.status}
                            onValueChange={(val: any) => setFormData({ ...formData, status: val })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="pending">À payer (En attente)</SelectItem>
                                <SelectItem value="paid">Payé</SelectItem>
                                <SelectItem value="cancelled">Annulé</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
                    <Button onClick={handleSubmit} disabled={loading} className="bg-primary hover:bg-primary/90 text-white">
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Enregistrer
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
