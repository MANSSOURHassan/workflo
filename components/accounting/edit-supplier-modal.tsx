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
import { updateSupplier } from '@/lib/actions/accounting'
import { Supplier } from '@/lib/types/database'
import { toast } from 'sonner'

interface EditSupplierModalProps {
    supplier: Supplier | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export function EditSupplierModal({ supplier, open, onOpenChange, onSuccess }: EditSupplierModalProps) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        category: 'general',
        vat_number: '',
    })

    useEffect(() => {
        if (supplier && open) {
            setFormData({
                name: supplier.name || '',
                email: supplier.email || '',
                phone: supplier.phone || '',
                category: supplier.category || 'general',
                vat_number: supplier.vat_number || '',
            })
        }
    }, [supplier, open])

    async function handleSubmit() {
        if (!supplier?.id) return
        if (!formData.name) {
            toast.error('Le nom du fournisseur est obligatoire')
            return
        }

        setLoading(true)
        try {
            const result = await updateSupplier(supplier.id, formData)
            if (result.error) throw new Error(result.error)

            toast.success('Fournisseur modifié avec succès')
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
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Modifier le Fournisseur</DialogTitle>
                    <DialogDescription>
                        Mettez à jour les coordonnées de ce partenaire commercial.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="edit-name">Nom de l'entreprise *</Label>
                        <Input
                            id="edit-name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="edit-email">Email contact</Label>
                            <Input
                                id="edit-email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-category">Catégorie</Label>
                            <Select
                                value={formData.category}
                                onValueChange={(val) => setFormData({ ...formData, category: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="general">Général</SelectItem>
                                    <SelectItem value="logistics">Logistique</SelectItem>
                                    <SelectItem value="marketing">Marketing</SelectItem>
                                    <SelectItem value="software">SaaS / Logiciel</SelectItem>
                                    <SelectItem value="rent">Loyer / Services</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="edit-vat">Numéro de TVA</Label>
                        <Input
                            id="edit-vat"
                            value={formData.vat_number}
                            onChange={(e) => setFormData({ ...formData, vat_number: e.target.value })}
                        />
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
