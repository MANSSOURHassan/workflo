'use client'

import React, { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
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
import { Textarea } from '@/components/ui/textarea'
import { Plus, Loader2 } from 'lucide-react'
import { createExpense } from '@/lib/actions/accounting'
import { Supplier } from '@/lib/types/database'
import { toast } from 'sonner'

interface AddExpenseModalProps {
    suppliers: Supplier[]
    onSuccess: () => void
}

export function AddExpenseModal({ suppliers, onSuccess }: AddExpenseModalProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        description: '',
        supplier_id: '',
        amount: '',
        tax_amount: '0',
        category: 'software',
        account_code: '606',
        status: 'pending' as 'pending' | 'paid',
        issue_date: new Date().toISOString().split('T')[0],
    })

    async function handleSubmit() {
        if (!formData.description || !formData.amount) {
            toast.error('Veuillez remplir les champs obligatoires')
            return
        }

        setLoading(true)
        try {
            const amount = parseFloat(formData.amount)
            const taxAmount = parseFloat(formData.tax_amount)

            const result = await createExpense({
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

            toast.success('Dépense enregistrée avec succès')
            setOpen(false)
            onSuccess()
            setFormData({
                description: '',
                supplier_id: '',
                amount: '',
                tax_amount: '0',
                category: 'software',
                account_code: '606',
                status: 'pending',
                issue_date: new Date().toISOString().split('T')[0],
            })
        } catch (error: any) {
            toast.error(error.message || 'Erreur lors de l\'enregistrement')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 text-white">
                    <Plus className="mr-2 h-4 w-4" />
                    Nouvelle Dépense
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Enregistrer une Dépense</DialogTitle>
                    <DialogDescription>
                        Saisissez les détails de votre facture fournisseur ou frais de fonctionnement.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="description">Description *</Label>
                        <Input
                            id="description"
                            placeholder="Ex: Abonnement SaaS, Loyer, Pub LinkedIn..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="supplier">Fournisseur</Label>
                            <Select
                                value={formData.supplier_id}
                                onValueChange={(val) => setFormData({ ...formData, supplier_id: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Sélectionner..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {suppliers.map((s) => (
                                        <SelectItem key={s.id} value={s.id}>
                                            {s.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="category">Catégorie</Label>
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
                            <Label htmlFor="account">Compte Comptable</Label>
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
                            <Label htmlFor="amount">Montant HT (€) *</Label>
                            <Input
                                id="amount"
                                type="number"
                                placeholder="0.00"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="date">Date de facture</Label>
                            <Input
                                id="date"
                                type="date"
                                value={formData.issue_date}
                                onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="tax_amount">TVA (€)</Label>
                            <Input
                                id="tax_amount"
                                type="number"
                                placeholder="0.00"
                                value={formData.tax_amount}
                                onChange={(e) => setFormData({ ...formData, tax_amount: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="status">Statut</Label>
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
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
                    <Button onClick={handleSubmit} disabled={loading} className="bg-primary hover:bg-primary/90 text-white">
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Enregistrer
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
