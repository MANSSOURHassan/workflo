'use client'

import React, { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createUrssafDeclaration } from '@/lib/actions/accounting'
import { toast } from 'sonner'
import { Calculator, FileText, Loader2, Plus } from 'lucide-react'

interface AddUrssafModalProps {
    onSuccess?: () => void
}

export function AddUrssafModal({ onSuccess }: AddUrssafModalProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    // Form state
    const [periodStart, setPeriodStart] = useState('')
    const [periodEnd, setPeriodEnd] = useState('')
    const [salesRevenue, setSalesRevenue] = useState('')
    const [servicesRevenue, setServicesRevenue] = useState('')

    // Auto-entrepreneur tax rates (estimates as of 2024/2025)
    // Adjust as needed: ~12.3% for sales (vente marchandises), ~21.1% for services (prestations de services)
    const SALES_RATE = 0.123
    const SERVICES_RATE = 0.211

    const salesAmt = parseFloat(salesRevenue) || 0
    const servicesAmt = parseFloat(servicesRevenue) || 0
    const estimatedTax = (salesAmt * SALES_RATE) + (servicesAmt * SERVICES_RATE)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!periodStart || !periodEnd) {
            toast.error('Veuillez renseigner la période')
            return
        }

        setLoading(true)

        const res = await createUrssafDeclaration({
            period_start: periodStart,
            period_end: periodEnd,
            sales_revenue: salesAmt,
            services_revenue: servicesAmt,
            tax_amount: estimatedTax,
            status: 'pending' // default status
        })

        setLoading(false)

        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success('Déclaration URSSAF enregistrée')
            setOpen(false)
            // Reset form
            setPeriodStart('')
            setPeriodEnd('')
            setSalesRevenue('')
            setServicesRevenue('')
            if (onSuccess) onSuccess()
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Nouvelle Déclaration
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-primary" />
                            Déclaration URSSAF
                        </DialogTitle>
                        <DialogDescription>
                            Saisissez votre chiffre d'affaires pour estimer et enregistrer vos cotisations.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="periodStart">Début de période</Label>
                                <Input
                                    id="periodStart"
                                    type="date"
                                    value={periodStart}
                                    onChange={(e) => setPeriodStart(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="periodEnd">Fin de période</Label>
                                <Input
                                    id="periodEnd"
                                    type="date"
                                    value={periodEnd}
                                    onChange={(e) => setPeriodEnd(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="salesRevenue">Vente de marchandises (12.3%)</Label>
                            <Input
                                id="salesRevenue"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={salesRevenue}
                                onChange={(e) => setSalesRevenue(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="servicesRevenue">Prestations de services (21.1%)</Label>
                            <Input
                                id="servicesRevenue"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={servicesRevenue}
                                onChange={(e) => setServicesRevenue(e.target.value)}
                            />
                        </div>

                        <div className="mt-4 p-4 bg-muted/50 rounded-lg flex items-center justify-between border">
                            <div className="flex items-center gap-2 text-primary font-medium">
                                <Calculator className="h-5 w-5" />
                                <span>Cotisations estimées :</span>
                            </div>
                            <span className="text-xl font-bold">{estimatedTax.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</span>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Annuler
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Enregistrer
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
