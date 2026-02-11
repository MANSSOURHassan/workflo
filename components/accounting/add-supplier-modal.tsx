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
import { Plus, Loader2 } from 'lucide-react'
import { createSupplier } from '@/lib/actions/accounting'
import { toast } from 'sonner'

interface AddSupplierModalProps {
    onSuccess: () => void
}

export function AddSupplierModal({ onSuccess }: AddSupplierModalProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        category: 'general',
        vat_number: '',
    })

    async function handleSubmit() {
        if (!formData.name) {
            toast.error('Le nom du fournisseur est obligatoire')
            return
        }

        setLoading(true)
        try {
            const result = await createSupplier(formData)
            if (result.error) throw new Error(result.error)

            toast.success('Fournisseur ajouté avec succès')
            setOpen(false)
            onSuccess()
            setFormData({
                name: '',
                email: '',
                phone: '',
                category: 'general',
                vat_number: '',
            })
        } catch (error: any) {
            toast.error(error.message || 'Erreur lors de l\'ajout')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Ajouter un Fournisseur
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Nouveau Fournisseur</DialogTitle>
                    <DialogDescription>
                        Ajoutez les coordonnées d'un nouveau partenaire commercial.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Nom de l'entreprise *</Label>
                        <Input
                            id="name"
                            placeholder="Ex: Amazon Web Services, Cabinet Comptable..."
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email contact</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="contact@fournisseur.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
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
                        <Label htmlFor="vat">Numéro de TVA</Label>
                        <Input
                            id="vat"
                            placeholder="FR..."
                            value={formData.vat_number}
                            onChange={(e) => setFormData({ ...formData, vat_number: e.target.value })}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
                    <Button onClick={handleSubmit} disabled={loading} className="bg-primary hover:bg-primary/90 text-white">
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Ajouter
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
