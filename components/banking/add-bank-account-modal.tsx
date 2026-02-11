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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Loader2 } from 'lucide-react'
import { createBankAccount } from '@/lib/actions/banking'
import { toast } from 'sonner'

interface AddBankAccountModalProps {
    onSuccess: () => void
}

export function AddBankAccountModal({ onSuccess }: AddBankAccountModalProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        bank_name: '',
        iban: '',
        bic: '',
        initial_balance: '0',
        account_type: 'checking' as 'checking' | 'savings' | 'credit' | 'payment_processor'
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const result = await createBankAccount({
                ...formData,
                initial_balance: parseFloat(formData.initial_balance),
                currency: 'EUR',
                is_active: true
            })

            if (result.error) throw new Error(result.error)

            toast.success('Compte bancaire créé avec succès')
            setOpen(false)
            setFormData({
                name: '',
                bank_name: '',
                iban: '',
                bic: '',
                initial_balance: '0',
                account_type: 'checking'
            })
            onSuccess()
        } catch (error: any) {
            toast.error(error.message || 'Erreur lors de la création du compte')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Nouveau Compte
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Ajouter un compte bancaire</DialogTitle>
                    <DialogDescription>
                        Configurez un nouveau compte pour suivre vos transactions et soldes.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nom du compte</Label>
                            <Input
                                id="name"
                                placeholder="ex: Compte Courant"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="bank_name">Nom de la banque</Label>
                            <Input
                                id="bank_name"
                                placeholder="ex: Crédit Agricole"
                                value={formData.bank_name}
                                onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="account_type">Type de compte</Label>
                        <Select
                            value={formData.account_type}
                            onValueChange={(val: any) => setFormData({ ...formData, account_type: val })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Sélectionnez un type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="checking">Compte Courant</SelectItem>
                                <SelectItem value="savings">Compte d'Épargne</SelectItem>
                                <SelectItem value="credit">Carte de Crédit</SelectItem>
                                <SelectItem value="payment_processor">Processeur de paiement (Stripe/PayPal)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="iban">IBAN</Label>
                        <Input
                            id="iban"
                            placeholder="FR76 ..."
                            value={formData.iban}
                            onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="bic">BIC / SWIFT</Label>
                            <Input
                                id="bic"
                                placeholder="Optional"
                                value={formData.bic}
                                onChange={(e) => setFormData({ ...formData, bic: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="initial_balance">Solde Initial (€)</Label>
                            <Input
                                id="initial_balance"
                                type="number"
                                step="0.01"
                                value={formData.initial_balance}
                                onChange={(e) => setFormData({ ...formData, initial_balance: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Créer le compte
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
