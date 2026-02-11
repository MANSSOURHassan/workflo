'use client'

import React, { useState, useEffect } from 'react'
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
import { Plus, Loader2, X, Upload } from 'lucide-react'
import Papa from 'papaparse'
import { createQuote, updateQuote } from '@/lib/actions/accounting'
import { getProspects } from '@/lib/actions/prospects'
import { Prospect } from '@/lib/types/database'
import { toast } from 'sonner'

interface QuoteItem {
    id: string
    description: string
    quantity: number
    unit_price: number
    tax_rate: number
}

interface AddQuoteModalProps {
    onSuccess: () => void
    quoteToEdit?: any
    trigger?: React.ReactNode
}

export function AddQuoteModal({ onSuccess, quoteToEdit, trigger }: AddQuoteModalProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [prospects, setProspects] = useState<Prospect[]>([])
    const [items, setItems] = useState<QuoteItem[]>([
        { id: Math.random().toString(), description: '', quantity: 0, unit_price: 0, tax_rate: 20 }
    ])

    const [formData, setFormData] = useState({
        quote_number: '',
        client_name: '', // Manual client name
        prospect_id: '',
        issue_date: '',
        valid_until: '',
        notes: '',
    })

    const isEdit = !!quoteToEdit

    useEffect(() => {
        if (open) {
            loadProspects()
            if (quoteToEdit) {
                setFormData({
                    quote_number: quoteToEdit.quote_number || '',
                    client_name: quoteToEdit.notes?.split('\n')[0]?.replace('Client: ', '') || '',
                    prospect_id: quoteToEdit.prospect_id || '',
                    issue_date: quoteToEdit.issue_date || '',
                    valid_until: quoteToEdit.valid_until || '',
                    notes: quoteToEdit.notes?.split('\n').filter((l: string) => !l.startsWith('Client:')).join('\n') || quoteToEdit.notes || '',
                })
                if (quoteToEdit.items && Array.isArray(quoteToEdit.items)) {
                    setItems(quoteToEdit.items)
                }
            }
        }
    }, [open, quoteToEdit])

    async function loadProspects() {
        const { data } = await getProspects({ limit: 100 })
        if (data) setProspects(data)
    }

    const addItem = () => {
        setItems([...items, { id: Math.random().toString(), description: '', quantity: 0, unit_price: 0, tax_rate: 20 }])
    }

    const removeItem = (id: string) => {
        if (items.length > 1) {
            setItems(items.filter(i => i.id !== id))
        }
    }

    const updateItem = (id: string, field: keyof QuoteItem, value: any) => {
        setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i))
    }

    const handleCsvImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const importedItems = results.data.map((row: any) => ({
                    id: Math.random().toString(),
                    description: row.description || row.Description || row.item || '',
                    quantity: parseFloat(row.quantity || row.Quantity || row.qty || '1'),
                    unit_price: parseFloat(row.price || row.unit_price || row.Price || '0'),
                    tax_rate: parseFloat(row.tax || row.tax_rate || row.Tax || '20')
                })).filter(item => item.description)

                if (importedItems.length > 0) {
                    setItems([...items.filter(i => i.description), ...importedItems])
                    toast.success(`${importedItems.length} articles importés`)
                } else {
                    toast.error("Format CSV non reconnu")
                }
            }
        })
    }

    const calculateSubtotal = () => {
        return items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
    }

    const calculateTaxTotal = () => {
        return items.reduce((sum, item) => sum + (item.quantity * item.unit_price * (item.tax_rate / 100)), 0)
    }

    const calculateTotal = () => {
        return calculateSubtotal() + calculateTaxTotal()
    }

    async function handleSubmit() {
        if (!formData.quote_number || (!formData.client_name && !formData.prospect_id) || items.some(i => !i.description)) {
            toast.error('Veuillez remplir le numéro de devis, le client et les descriptions d\'articles')
            return
        }

        setLoading(true)
        try {
            const subtotal = calculateSubtotal()
            const taxTotal = calculateTaxTotal()
            const total = calculateTotal()

            const quotePayload = {
                quote_number: formData.quote_number,
                prospect_id: formData.prospect_id || null,
                subtotal,
                tax_rate: items[0].tax_rate,
                tax_amount: taxTotal,
                total,
                status: isEdit ? quoteToEdit.status : 'draft',
                notes: formData.client_name ? `Client: ${formData.client_name}\n${formData.notes}` : formData.notes,
                valid_until: formData.valid_until || null,
                issue_date: formData.issue_date || new Date().toISOString().split('T')[0],
                items,
                currency: 'EUR'
            }

            const result = isEdit
                ? await updateQuote(quoteToEdit.id, quotePayload)
                : await createQuote(quotePayload)

            if (result.error) throw new Error(result.error)

            toast.success(isEdit ? 'Devis modifié' : 'Devis créé')
            setOpen(false)
            onSuccess()
            if (!isEdit) {
                setFormData({
                    quote_number: '',
                    client_name: '',
                    prospect_id: '',
                    issue_date: '',
                    valid_until: '',
                    notes: '',
                })
                setItems([{ id: Math.random().toString(), description: '', quantity: 0, unit_price: 0, tax_rate: 20 }])
            }
        } catch (error: any) {
            toast.error(error.message || 'Erreur lors de l\'enregistrement')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button className="bg-primary hover:bg-primary/90 text-white shadow-sm font-semibold border-none">
                        <Plus className="mr-2 h-4 w-4" /> Nouveau Devis
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-slate-900">
                        {isEdit ? `Modifier le Devis ${formData.quote_number}` : 'Nouveau Devis'}
                    </DialogTitle>
                    <DialogDescription>
                        {isEdit ? 'Mettez à jour les détails de ce devis.' : 'Préparez un devis personnalisé. Saisissez le nom du client ou sélectionnez-le.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-6 border-t border-b my-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="grid gap-2">
                            <Label className="text-slate-700 font-semibold">N° de Devis</Label>
                            <Input
                                placeholder="Ex: DEV-2024-001"
                                value={formData.quote_number}
                                onChange={(e) => setFormData({ ...formData, quote_number: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label className="text-slate-700 font-semibold">Nom du Client</Label>
                            <Input
                                placeholder="Saisir le nom du client (ex: Entreprise ABC)"
                                value={formData.client_name}
                                onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="grid gap-2">
                            <Label className="text-slate-700 font-semibold">Ou sélectionner un Client existant</Label>
                            <Select
                                value={formData.prospect_id}
                                onValueChange={(val) => setFormData({ ...formData, prospect_id: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Choisir un client..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {prospects.map(p => (
                                        <SelectItem key={p.id} value={p.id}>
                                            {p.first_name} {p.last_name} {p.company ? `(${p.company})` : ''}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label className="text-slate-700 font-semibold">Date du devis</Label>
                            <Input
                                type="date"
                                value={formData.issue_date}
                                onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="grid gap-2">
                            <Label className="text-slate-700 font-semibold">Valable jusqu'au</Label>
                            <Input
                                type="date"
                                value={formData.valid_until}
                                onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label className="text-base font-bold text-slate-900">Articles / Prestations</Label>
                            <div className="flex gap-2">
                                <label className="flex items-center gap-2 cursor-pointer bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-md text-xs font-medium border border-slate-200 transition-colors">
                                    <Upload className="h-3.5 w-3.5" />
                                    <span>CSV</span>
                                    <input type="file" accept=".csv" onChange={handleCsvImport} className="hidden" />
                                </label>
                                <Button size="sm" variant="outline" onClick={addItem} className="text-xs font-medium h-8 border-slate-200">
                                    <Plus className="h-3.5 w-3.5 mr-1" /> Ajouter
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {items.map((item, index) => (
                                <div key={item.id} className="grid grid-cols-12 gap-3 pb-4 relative border-b last:border-b-0 border-slate-100 group">
                                    <div className="col-span-12 md:col-span-5 space-y-1.5">
                                        <Label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Description</Label>
                                        <Input
                                            placeholder="Ex: Conception..."
                                            value={item.description}
                                            onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                                        />
                                    </div>
                                    <div className="col-span-4 md:col-span-2 space-y-1.5">
                                        <Label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Qté</Label>
                                        <Input
                                            type="number"
                                            placeholder="0"
                                            value={item.quantity === 0 ? '' : item.quantity}
                                            onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                                        />
                                    </div>
                                    <div className="col-span-4 md:col-span-3 space-y-1.5">
                                        <Label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Prix Unit. (€)</Label>
                                        <Input
                                            type="number"
                                            placeholder="0.00"
                                            value={item.unit_price === 0 ? '' : item.unit_price}
                                            onChange={(e) => updateItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                                        />
                                    </div>
                                    <div className="col-span-4 md:col-span-2 space-y-1.5">
                                        <Label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">TVA (%)</Label>
                                        <Input
                                            type="number"
                                            placeholder="20"
                                            value={item.tax_rate}
                                            onChange={(e) => updateItem(item.id, 'tax_rate', parseFloat(e.target.value) || 0)}
                                        />
                                    </div>
                                    {items.length > 1 && (
                                        <button
                                            onClick={() => removeItem(item.id)}
                                            className="absolute -right-2 top-0 text-slate-400 hover:text-rose-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                        <div className="grid gap-2">
                            <Label className="text-slate-700 font-semibold">Conditions</Label>
                            <Textarea
                                className="min-h-[100px]"
                                placeholder="Validité du devis, acompte..."
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            />
                        </div>

                        <div className="bg-slate-50 p-5 rounded-xl space-y-4 border border-slate-100">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500 font-medium">Sous-total HT</span>
                                <span className="font-semibold text-slate-900">{calculateSubtotal().toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500 font-medium">Total TVA</span>
                                <span className="font-semibold text-slate-900">{calculateTaxTotal().toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</span>
                            </div>
                            <div className="border-t border-slate-200 pt-3 flex justify-between items-center font-bold text-xl text-primary">
                                <span>Total EUR</span>
                                <span>{calculateTotal().toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</span>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-3">
                    <Button variant="ghost" onClick={() => setOpen(false)} className="font-semibold text-slate-600">Annuler</Button>
                    <Button onClick={handleSubmit} disabled={loading} className="bg-primary hover:bg-primary/90 text-white font-bold px-8 shadow-md">
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isEdit ? 'Enregistrer les modifications' : 'Générer le Devis'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
