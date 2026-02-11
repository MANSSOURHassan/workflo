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
import { Textarea } from '@/components/ui/textarea'
import { Plus, Loader2, X, Upload } from 'lucide-react'
import Papa from 'papaparse'
import { createInvoice, updateInvoice } from '@/lib/actions/accounting'
import { toast } from 'sonner'

interface InvoiceItem {
    id: string
    description: string
    quantity: number
    unit_price: number
    tax_rate: number
}

interface AddInvoiceModalProps {
    onSuccess: () => void
    invoiceToEdit?: any
    trigger?: React.ReactNode
}

export function AddInvoiceModal({ onSuccess, invoiceToEdit, trigger }: AddInvoiceModalProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [items, setItems] = useState<InvoiceItem[]>([
        { id: Math.random().toString(), description: '', quantity: 0, unit_price: 0, tax_rate: 20 }
    ])

    const [formData, setFormData] = useState({
        invoice_number: '',
        client_name: '',
        issue_date: '',
        due_date: '',
        notes: '',
        service_type: '',
    })

    const isEdit = !!invoiceToEdit

    useEffect(() => {
        if (invoiceToEdit && open) {
            setFormData({
                invoice_number: invoiceToEdit.invoice_number || '',
                client_name: invoiceToEdit.notes?.split('\n')[0]?.replace('Client: ', '') || '',
                issue_date: invoiceToEdit.issue_date || '',
                due_date: invoiceToEdit.due_date || '',
                notes: invoiceToEdit.notes?.split('\n').filter((l: string) => !l.startsWith('Client:') && !l.startsWith('Service:')).join('\n') || invoiceToEdit.notes || '',
                service_type: invoiceToEdit.notes?.split('\n').find((l: string) => l.startsWith('Service:'))?.replace('Service: ', '') || '',
            })
            if (invoiceToEdit.items && Array.isArray(invoiceToEdit.items)) {
                setItems(invoiceToEdit.items)
            }
        }
    }, [invoiceToEdit, open])

    const addItem = () => {
        setItems([...items, { id: Math.random().toString(), description: '', quantity: 0, unit_price: 0, tax_rate: 20 }])
    }

    const removeItem = (id: string) => {
        if (items.length > 1) {
            setItems(items.filter(i => i.id !== id))
        }
    }

    const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
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
        if (!formData.invoice_number || !formData.client_name || items.some(i => !i.description)) {
            toast.error('Veuillez remplir le numéro de facture, le client et les descriptions d\'articles')
            return
        }

        setLoading(true)
        try {
            const subtotal = calculateSubtotal()
            const taxTotal = calculateTaxTotal()
            const total = calculateTotal()

            const metaInfo = [
                `Client: ${formData.client_name}`,
                formData.service_type ? `Service: ${formData.service_type}` : null
            ].filter(Boolean).join('\n')

            const invoicePayload = {
                invoice_number: formData.invoice_number,
                prospect_id: null,
                subtotal,
                tax_rate: items[0].tax_rate,
                tax_amount: taxTotal,
                total,
                status: isEdit ? invoiceToEdit.status : 'draft',
                notes: metaInfo ? `${metaInfo}\n${formData.notes}` : formData.notes,
                due_date: formData.due_date || null,
                issue_date: formData.issue_date || new Date().toISOString().split('T')[0],
                items,
                account_code: '706',
                currency: 'EUR'
            }

            const result = isEdit
                ? await updateInvoice(invoiceToEdit.id, invoicePayload)
                : await createInvoice(invoicePayload)

            if (result.error) throw new Error(result.error)

            toast.success(isEdit ? 'Facture modifiée' : 'Facture créée')
            setOpen(false)
            onSuccess()
            if (!isEdit) {
                setFormData({
                    invoice_number: '',
                    client_name: '',
                    issue_date: '',
                    due_date: '',
                    notes: '',
                    service_type: '',
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
                    <Button className="bg-primary hover:bg-primary/90 text-white shadow-sm font-semibold">
                        <Plus className="mr-2 h-4 w-4" /> Nouvelle Facture
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-slate-900">
                        {isEdit ? `Modifier la Facture ${formData.invoice_number}` : 'Nouvelle Facture'}
                    </DialogTitle>
                    <DialogDescription>
                        {isEdit ? 'Mettez à jour les détails de cette facture.' : 'Saisissez manuellement tous les détails de la facture.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-6 border-t border-b my-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="grid gap-2">
                            <Label className="text-slate-700 font-semibold">N° de Facture</Label>
                            <Input
                                placeholder="Ex: FAC-2024-001"
                                value={formData.invoice_number}
                                onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label className="text-slate-700 font-semibold">Nom du Client</Label>
                            <Input
                                placeholder="Ex: Jean Dupont"
                                value={formData.client_name}
                                onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="grid gap-2">
                            <Label className="text-slate-700 font-semibold">Date d'émission</Label>
                            <Input
                                type="date"
                                value={formData.issue_date}
                                onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label className="text-slate-700 font-semibold">Date d'échéance</Label>
                            <Input
                                type="date"
                                value={formData.due_date}
                                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-5">
                        <div className="grid gap-2">
                            <Label className="text-slate-700 font-semibold">Type de service / Catégorie</Label>
                            <Input
                                placeholder="Ex: Audiovisuel, Formation, Vente..."
                                value={formData.service_type}
                                onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Articles */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label className="text-base font-bold text-slate-900">Articles / Services</Label>
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
                                            placeholder="Ex: Prestation..."
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
                            <Label className="text-slate-700 font-semibold">Notes & Conditions</Label>
                            <Textarea
                                className="min-h-[100px]"
                                placeholder="RIB, conditions de paiement..."
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
                                <span>Total TTC</span>
                                <span>{calculateTotal().toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</span>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-3">
                    <Button variant="ghost" onClick={() => setOpen(false)} className="font-semibold text-slate-600">Annuler</Button>
                    <Button onClick={handleSubmit} disabled={loading} className="bg-primary hover:bg-primary/90 text-white font-bold px-8 shadow-md">
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isEdit ? 'Enregistrer les modifications' : 'Valider la Facture'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
