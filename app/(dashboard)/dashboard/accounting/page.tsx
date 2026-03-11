'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    BarChart3,
    BookOpen,
    Receipt,
    TrendingUp,
    TrendingDown,
    Wallet,
    Building2,
    Table as TableIcon,
    Loader2,
    Info,
    Download,
    Send,
    FileText,
    MoreHorizontal,
    Trash2,
    Euro,
    Mail,
    Share2,
    MessageCircle,
    FileDown,
    Landmark
} from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { generateAccountingPDF, generateInvoicePDF, generateQuotePDF } from '@/lib/utils/pdf-generator'
import { generateInvoiceWord, generateQuoteWord } from '@/lib/utils/word-generator'
import {
    getProFinancialSummary,
    getAccountingAccounts,
    getExpenses,
    getSuppliers,
    getInvoices,
    getQuotes,
    updateInvoiceStatus,
    updateQuoteStatus,
    deleteInvoice,
    deleteQuote,
    sendInvoiceByEmail,
    sendQuoteByEmail,
    deleteExpense,
    deleteSupplier,
    getUrssafDeclarations,
    updateUrssafStatus,
    deleteUrssafDeclaration
} from '@/lib/actions/accounting'
import { Expense, Supplier, Invoice, Quote, UrssafDeclaration } from '@/lib/types/database'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { AddExpenseModal } from '@/components/accounting/add-expense-modal'
import { AddSupplierModal } from '@/components/accounting/add-supplier-modal'
import { AddInvoiceModal } from '@/components/accounting/add-invoice-modal'
import { AddQuoteModal } from '@/components/accounting/add-quote-modal'
import { AddUrssafModal } from '@/components/accounting/add-urssaf-modal'
import { EditSupplierModal } from '@/components/accounting/edit-supplier-modal'
import { EditExpenseModal } from '@/components/accounting/edit-expense-modal'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

const classLabels: Record<number, string> = {
    1: 'Capitaux (Classe 1)',
    2: 'Immobilisations (Classe 2)',
    3: 'Stocks (Classe 3)',
    4: 'Tiers / Clients / Fournisseurs (Classe 4)',
    5: 'Comptes Financiers / Banque (Classe 5)',
    6: 'Charges / Dépenses (Classe 6)',
    7: 'Produits / Revenus (Classe 7)',
}

const invoiceStatusConfig: Record<string, { label: string, color: string }> = {
    draft: { label: 'Brouillon', color: 'bg-slate-100 text-slate-700' },
    sent: { label: 'Envoyée', color: 'bg-blue-100 text-blue-700' },
    paid: { label: 'Payée', color: 'bg-green-100 text-green-700' },
    overdue: { label: 'En retard', color: 'bg-red-100 text-red-700' },
    pending: { label: 'En attente', color: 'bg-orange-100 text-orange-700' },
    cancelled: { label: 'Annulée', color: 'bg-gray-100 text-gray-700' }
}

const quoteStatusConfig: Record<string, { label: string, color: string }> = {
    draft: { label: 'Brouillon', color: 'bg-slate-100 text-slate-700' },
    sent: { label: 'Envoyé', color: 'bg-blue-100 text-blue-700' },
    accepted: { label: 'Accepté', color: 'bg-green-100 text-green-700' },
    rejected: { label: 'Refusé', color: 'bg-red-100 text-red-700' },
    pending: { label: 'En attente', color: 'bg-orange-100 text-orange-700' },
    expired: { label: 'Expiré', color: 'bg-gray-100 text-gray-700' }
}

export default function AccountingPage() {
    const [proSummary, setProSummary] = useState<any>(null)
    const [accounts, setAccounts] = useState<any[]>([])
    const [expenses, setExpenses] = useState<Expense[]>([])
    const [invoices, setInvoices] = useState<Invoice[]>([])
    const [quotes, setQuotes] = useState<Quote[]>([])
    const [suppliers, setSuppliers] = useState<Supplier[]>([])
    const [urssafDeclarations, setUrssafDeclarations] = useState<UrssafDeclaration[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('bilan')

    // Modals states
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
    const [isEditExpenseOpen, setIsEditExpenseOpen] = useState(false)
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
    const [isEditSupplierOpen, setIsEditSupplierOpen] = useState(false)

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        setLoading(true)
        try {
            const [summaryRes, accountsRes, expensesRes, suppliersRes, invoicesRes, quotesRes, urssafRes] = await Promise.all([
                getProFinancialSummary(),
                getAccountingAccounts(),
                getExpenses(),
                getSuppliers(),
                getInvoices(),
                getQuotes(),
                getUrssafDeclarations()
            ])

            if (summaryRes.data) setProSummary(summaryRes.data)
            if (accountsRes.data) setAccounts(accountsRes.data)
            if (expensesRes.data) setExpenses(expensesRes.data)
            if (suppliersRes.data) setSuppliers(suppliersRes.data)
            if (invoicesRes.data) setInvoices(invoicesRes.data)
            if (quotesRes.data) setQuotes(quotesRes.data as any)
            if (urssafRes?.data) setUrssafDeclarations(urssafRes.data)
        } catch (error) {
            toast.error('Erreur lors du chargement des données comptables')
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteInvoice = async (id: string) => {
        if (!confirm('Supprimer cette facture ?')) return
        const res = await deleteInvoice(id)
        if (res.error) toast.error(res.error)
        else {
            toast.success('Facture supprimée')
            loadData()
        }
    }

    const handleShare = (doc: any, platform: 'whatsapp' | 'linkedin') => {
        const text = `Bonjour, voici votre ${doc.invoice_number ? 'facture' : 'devis'} ${doc.invoice_number || doc.quote_number} d'un montant de ${doc.total.toLocaleString('fr-FR')} €.`
        const url = window.location.origin

        if (platform === 'whatsapp') {
            window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank')
        } else {
            window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank')
        }
    }

    const handleDeleteQuote = async (id: string) => {
        if (!confirm('Supprimer ce devis ?')) return
        const res = await deleteQuote(id)
        if (res.error) toast.error(res.error)
        else {
            toast.success('Devis supprimé')
            loadData()
        }
    }

    const handleSendInvoice = async (invoice: Invoice) => {
        const email = invoice.prospect?.email
        if (!email) {
            toast.error('Aucun email associé à ce client')
            return
        }
        toast.promise(sendInvoiceByEmail(invoice.id, email), {
            loading: 'Envoi en cours...',
            success: 'Facture envoyée avec succès',
            error: 'Erreur lors de l\'envoi'
        })
        loadData()
    }

    const handleSendQuote = async (quote: Quote) => {
        const email = quote.prospect?.email
        if (!email) {
            toast.error('Aucun email associé à ce client')
            return
        }
        toast.promise(sendQuoteByEmail(quote.id, email), {
            loading: 'Envoi en cours...',
            success: 'Devis envoyé avec succès',
            error: 'Erreur lors de l\'envoi'
        })
        loadData()
    }

    const handleDeleteExpense = async (id: string) => {
        if (!confirm('Supprimer cette dépense ?')) return
        const res = await deleteExpense(id)
        if (res.error) toast.error(res.error)
        else {
            toast.success('Dépense supprimée')
            loadData()
        }
    }

    const handleDeleteSupplier = async (id: string) => {
        if (!confirm('Supprimer ce fournisseur ? (Attention : Impossible sil est lié à des dépenses)')) return
        const res = await deleteSupplier(id)
        if (res.error) toast.error("Erreur de suppression. Ce fournisseur est peut-être lié à une dépense.")
        else {
            toast.success('Fournisseur supprimé')
            loadData()
        }
    }

    const handleDeleteUrssaf = async (id: string) => {
        if (!confirm('Supprimer cette déclaration URSSAF ?')) return
        const res = await deleteUrssafDeclaration(id)
        if (res.error) toast.error(res.error)
        else {
            toast.success('Déclaration supprimée')
            loadData()
        }
    }

    const handleUpdateUrssafStatus = async (id: string, status: 'pending' | 'declared' | 'paid') => {
        const res = await updateUrssafStatus(id, status)
        if (res.error) toast.error(res.error)
        else {
            toast.success('Statut mis à jour')
            loadData()
        }
    }

    if (loading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Comptabilité Professionnelle</h1>
                    <p className="text-muted-foreground">
                        Bilan, Compte de Résultat et Plan Comptable Général (PCG).
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => generateAccountingPDF({ proSummary, accounts, expenses })}
                    >
                        <Download className="h-4 w-4" />
                        Exporter PDF
                    </Button>
                    <Button variant="outline" className="gap-2">
                        <BookOpen className="h-4 w-4" />
                        Grand Livre
                    </Button>
                </div>
            </div>

            {/* Summary Row */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-emerald-500/5 border-emerald-500/10">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-emerald-500" />
                            Total Produits (Classe 7)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-600">
                            {proSummary?.summary?.income?.toLocaleString('fr-FR')} €
                        </div>
                        <Button
                            variant="link"
                            className="p-0 h-auto text-xs text-emerald-600 hover:text-emerald-700"
                            onClick={() => setActiveTab('sales')}
                        >
                            Détail des ventes →
                        </Button>
                    </CardContent>
                </Card>

                <Card className="bg-rose-500/5 border-rose-500/10">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <TrendingDown className="h-4 w-4 text-rose-500" />
                            Total Charges (Classe 6)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-rose-600">
                            {proSummary?.summary?.costs?.toLocaleString('fr-FR')} €
                        </div>
                        <Button
                            variant="link"
                            className="p-0 h-auto text-xs text-rose-600 hover:text-rose-700"
                            onClick={() => setActiveTab('expenses')}
                        >
                            Détail des achats →
                        </Button>
                    </CardContent>
                </Card>

                <Card className={cn(
                    "bg-primary/5 border-primary/10",
                    proSummary?.summary?.result < 0 && "bg-rose-500/10 border-rose-500/20"
                )}>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Wallet className="h-4 w-4 text-primary" />
                            Résultat de l'Exercice
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={cn(
                            "text-2xl font-bold",
                            proSummary?.summary?.result >= 0 ? "text-emerald-700" : "text-rose-700"
                        )}>
                            {proSummary?.summary?.result?.toLocaleString('fr-FR')} €
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="bg-muted/50 p-1">
                    <TabsTrigger value="bilan" className="gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Bilan & Résultat
                    </TabsTrigger>
                    <TabsTrigger value="sales" className="gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Ventes (Client)
                    </TabsTrigger>
                    <TabsTrigger value="expenses" className="gap-2">
                        <Receipt className="h-4 w-4" />
                        Dépenses (Fournisseur)
                    </TabsTrigger>
                    <TabsTrigger value="pce" className="gap-2">
                        <TableIcon className="h-4 w-4" />
                        Plan Comptable
                    </TabsTrigger>
                    <TabsTrigger value="suppliers" className="gap-2">
                        <Building2 className="h-4 w-4" />
                        Tiers
                    </TabsTrigger>
                    <TabsTrigger value="urssaf" className="gap-2">
                        <Landmark className="h-4 w-4" />
                        URSSAF
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="bilan" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Compte de Résultat (P&L)</CardTitle>
                                    <CardDescription>Vue détaillée des revenus et des charges.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm font-bold uppercase text-emerald-600 border-b pb-1">
                                            <span>Produits (Revenus)</span>
                                            <span>Montant</span>
                                        </div>
                                        <div className="flex justify-between text-sm py-1">
                                            <span>Ventes de marchandises (707)</span>
                                            <span>0.00 €</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm py-1 font-medium bg-emerald-50/50 px-2 rounded hover:bg-emerald-100/50 transition-colors cursor-pointer" onClick={() => setActiveTab('sales')}>
                                            <span>Prestations de services (706)</span>
                                            <div className="flex items-center gap-2">
                                                <span>{proSummary?.summary?.income?.toLocaleString('fr-FR')} €</span>
                                                <TrendingUp className="h-3 w-3 text-emerald-500" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm font-bold uppercase text-rose-600 border-b pb-1">
                                            <span>Charges (Dépenses)</span>
                                            <span>Montant</span>
                                        </div>
                                        <div className="flex justify-between text-sm py-1">
                                            <span>Achats de matières premières (601)</span>
                                            <span>0.00 €</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm py-1 font-medium bg-rose-50/50 px-2 rounded hover:bg-rose-100/50 transition-colors cursor-pointer" onClick={() => setActiveTab('expenses')}>
                                            <span>Services extérieurs (606/61/62)</span>
                                            <div className="flex items-center gap-2">
                                                <span>{proSummary?.summary?.costs?.toLocaleString('fr-FR')} €</span>
                                                <TrendingDown className="h-3 w-3 text-rose-500" />
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary">
                                        <Receipt className="h-4 w-4" />
                                        Pièces justificatives (Payées)
                                    </CardTitle>
                                    <CardDescription>Détail des factures et dépenses validées.</CardDescription>
                                </CardHeader>
                                <CardContent className="max-h-[300px] overflow-y-auto pt-2">
                                    <div className="space-y-3">
                                        {/* Invoices in Bilan */}
                                        {proSummary?.invoices?.map((inv: any, idx: number) => (
                                            <div key={inv.id || `inv-${idx}`} className="flex items-center justify-between text-xs p-2 rounded border border-emerald-100 bg-emerald-50/30">
                                                <div className="flex items-center gap-2">
                                                    <Badge className="bg-emerald-500/20 text-emerald-700 hover:bg-emerald-500/20 text-[9px] border-none">VENTE</Badge>
                                                    <span className="font-mono font-bold text-slate-700">{inv.invoice_number}</span>
                                                </div>
                                                <span className="font-bold">+{inv.total.toLocaleString('fr-FR')} €</span>
                                            </div>
                                        ))}
                                        {/* Expenses in Bilan */}
                                        {proSummary?.expenses?.map((exp: any, idx: number) => (
                                            <div key={exp.id || `exp-${idx}`} className="flex items-center justify-between text-xs p-2 rounded border border-rose-100 bg-rose-50/30">
                                                <div className="flex items-center gap-2">
                                                    <Badge className="bg-rose-500/20 text-rose-700 hover:bg-rose-500/20 text-[9px] border-none">ACHAT</Badge>
                                                    <span className="text-slate-700">{exp.description}</span>
                                                </div>
                                                <span className="font-bold text-rose-600">-{exp.total_amount.toLocaleString('fr-FR')} €</span>
                                            </div>
                                        ))}
                                        {(!proSummary?.invoices?.length && !proSummary?.expenses?.length) && (
                                            <p className="text-center text-muted-foreground italic py-4">Aucune pièce payée pour le moment.</p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Bilan par Classe (PCG)</CardTitle>
                                <CardDescription>Répartition des masses selon le plan comptable.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                                        <div key={num} className="p-3 rounded-xl border border-primary/5 bg-accent/5 hover:bg-accent/10 transition-colors">
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-2">
                                                    <span className="h-6 w-6 rounded bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                                                        {num}
                                                    </span>
                                                    <span className="text-sm font-medium">{classLabels[num]}</span>
                                                </div>
                                                <span className="font-bold text-sm">
                                                    {proSummary?.classes[num]?.toLocaleString('fr-FR') || '0.00'} €
                                                </span>
                                            </div>
                                            <div className="mt-2 h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className={cn(
                                                        "h-full transition-all duration-700",
                                                        num >= 6 ? (num === 7 ? "bg-emerald-500" : "bg-rose-500") : "bg-primary"
                                                    )}
                                                    style={{ width: `${Math.min((proSummary?.classes[num] || 0) / (proSummary?.summary?.income || 1) * 100, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="sales" className="space-y-4">
                    <div className="flex gap-4 items-center justify-end">
                        <AddQuoteModal onSuccess={loadData} />
                        <AddInvoiceModal onSuccess={loadData} />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        {/* Factures Clients */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <FileText className="h-5 w-5 text-primary" />
                                    Dernières Factures Émises
                                </CardTitle>
                                <CardDescription>Factures envoyées aux prospects et clients.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {invoices.length === 0 ? (
                                        <p className="text-muted-foreground italic text-center py-4">Aucune facture émise.</p>
                                    ) : (
                                        invoices.map((inv) => (
                                            <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:shadow-sm transition-all">
                                                <div>
                                                    <p className="font-semibold">{inv.invoice_number}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Badge variant="outline" className={cn("text-[10px]", invoiceStatusConfig[inv.status].color)}>
                                                            {invoiceStatusConfig[inv.status].label}
                                                        </Badge>
                                                        <span className="text-[10px] text-muted-foreground uppercase">
                                                            {inv.prospect ? `${inv.prospect.first_name} ${inv.prospect.last_name}` : 'Client Inconnu'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="text-right">
                                                        <p className="font-bold">{inv.total.toLocaleString('fr-FR')} €</p>
                                                        <p className="text-[10px] text-muted-foreground">{new Date(inv.issue_date).toLocaleDateString('fr-FR')}</p>
                                                    </div>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => generateInvoicePDF(inv)}>
                                                                <Download className="mr-2 h-4 w-4" /> Télécharger PDF
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => generateInvoiceWord(inv)}>
                                                                <FileDown className="mr-2 h-4 w-4 text-blue-600" /> Télécharger Word
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleSendInvoice(inv)}>
                                                                <Send className="mr-2 h-4 w-4" /> Envoyer par mail
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleShare(inv, 'whatsapp')}>
                                                                <MessageCircle className="mr-2 h-4 w-4 text-green-600" /> WhatsApp
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleShare(inv, 'linkedin')}>
                                                                <Share2 className="mr-2 h-4 w-4 text-blue-600" /> LinkedIn
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => updateInvoiceStatus(inv.id, 'paid')}>
                                                                <Euro className="mr-2 h-4 w-4" /> Marquer payée
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem className="text-rose-600" onClick={() => handleDeleteInvoice(inv.id)}>
                                                                <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Devis */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <TrendingUp className="h-5 w-5 text-orange-500" />
                                    Derniers Devis (Propositions)
                                </CardTitle>
                                <CardDescription>Suivez vos opportunités commerciales en cours.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {quotes.length === 0 ? (
                                        <p className="text-muted-foreground italic text-center py-4">Aucun devis créé.</p>
                                    ) : (
                                        quotes.map((q) => (
                                            <div key={q.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:shadow-sm transition-all">
                                                <div>
                                                    <p className="font-semibold">{q.quote_number}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Badge variant="outline" className={cn("text-[10px]", quoteStatusConfig[q.status].color)}>
                                                            {quoteStatusConfig[q.status].label}
                                                        </Badge>
                                                        <span className="text-[10px] text-muted-foreground uppercase">
                                                            {q.prospect ? `${q.prospect.first_name} ${q.prospect.last_name}` : 'Prospect Inconnu'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="text-right">
                                                        <p className="font-bold">{q.total.toLocaleString('fr-FR')} €</p>
                                                        <p className="text-[10px] text-muted-foreground">{new Date(q.issue_date).toLocaleDateString('fr-FR')}</p>
                                                    </div>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => generateQuotePDF(q)}>
                                                                <Download className="mr-2 h-4 w-4" /> Télécharger PDF
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => generateQuoteWord(q)}>
                                                                <FileDown className="mr-2 h-4 w-4 text-orange-600" /> Télécharger Word
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleSendQuote(q)}>
                                                                <Send className="mr-2 h-4 w-4" /> Envoyer par mail
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleShare(q, 'whatsapp')}>
                                                                <MessageCircle className="mr-2 h-4 w-4 text-green-600" /> WhatsApp
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleShare(q, 'linkedin')}>
                                                                <Share2 className="mr-2 h-4 w-4 text-blue-600" /> LinkedIn
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => updateQuoteStatus(q.id, 'accepted')}>
                                                                <TrendingUp className="mr-2 h-4 w-4" /> Accepter
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem className="text-rose-600" onClick={() => handleDeleteQuote(q.id)}>
                                                                <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="expenses" className="space-y-4">
                    <div className="flex justify-end">
                        <AddExpenseModal suppliers={suppliers} onSuccess={loadData} />
                    </div>
                    <Card>
                        <CardHeader>
                            <CardTitle>Journal des Dépenses (Fournisseurs)</CardTitle>
                            <CardDescription>Liste de toutes vos factures d'achats et frais de fonctionnement.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {expenses.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground italic">
                                    Aucune donnée disponible.
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {expenses.map((expense, idx) => (
                                        <div key={expense.id || `exp-main-${idx}`} className="flex items-center justify-between p-4 rounded-xl border border-primary/5 bg-card hover:shadow-sm transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "h-10 w-10 rounded-lg flex items-center justify-center transition-colors",
                                                    expense.status === 'paid' ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
                                                )}>
                                                    <Receipt className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold">{expense.description}</p>
                                                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest flex items-center gap-2">
                                                        <span className="text-primary">{expense.account_code || '606'}</span>
                                                        • {expense.supplier?.name || 'Fournisseur inconnu'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="text-right">
                                                    <p className="font-bold text-lg">{expense.total_amount.toLocaleString('fr-FR')} €</p>
                                                    <p className="text-[10px] text-muted-foreground">
                                                        {new Date(expense.issue_date).toLocaleDateString('fr-FR')}
                                                    </p>
                                                </div>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => {
                                                            setEditingExpense(expense)
                                                            setIsEditExpenseOpen(true)
                                                        }}>
                                                            Modifier
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="text-rose-600" onClick={() => handleDeleteExpense(expense.id)}>
                                                            <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                    <EditExpenseModal
                        open={isEditExpenseOpen}
                        onOpenChange={setIsEditExpenseOpen}
                        expense={editingExpense}
                        suppliers={suppliers}
                        onSuccess={loadData}
                    />
                </TabsContent>

                <TabsContent value="pce" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Plan Comptable de l'Entreprise</CardTitle>
                                    <CardDescription>Liste des comptes utilisés pour la ventilation de vos écritures.</CardDescription>
                                </div>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                                <Info className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-[300px]">
                                            <p>Le Plan Comptable Général (PCG) définit les règles de comptabilisation en France. Les classes 1 à 5 concernent le Bilan, les classes 6 et 7 concernent le Résultat.</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-xl border border-primary/10 overflow-hidden shadow-sm">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/50 border-b">
                                        <tr>
                                            <th className="text-left p-3 font-bold">Code</th>
                                            <th className="text-left p-3 font-bold">Libellé du compte</th>
                                            <th className="text-left p-3 font-bold">Classe</th>
                                            <th className="text-right p-3 font-bold">Statut</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {accounts.map((acc) => (
                                            <tr key={acc.id} className="hover:bg-accent/5 transition-colors group">
                                                <td className="p-3 font-mono font-bold text-primary">{acc.code}</td>
                                                <td className="p-3 font-medium group-hover:pl-4 transition-all">{acc.label}</td>
                                                <td className="p-3">
                                                    <span className="px-2 py-0.5 rounded-full bg-muted text-[10px] font-bold">
                                                        {acc.class_number}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-right">
                                                    <div className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="suppliers" className="space-y-4">
                    <div className="flex justify-end gap-2">
                        <AddSupplierModal onSuccess={loadData} />
                    </div>
                    <Card>
                        <CardHeader>
                            <CardTitle>Fournisseurs & Tiers</CardTitle>
                            <CardDescription>Gérez votre base de fournisseurs.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-3">
                                {suppliers.map((s) => (
                                    <div key={s.id} className="p-4 rounded-xl border bg-card hover:shadow-md transition-all flex justify-between items-start">
                                        <div>
                                            <h3 className="font-bold">{s.name}</h3>
                                            <p className="text-sm text-muted-foreground">{s.email || 'Pas d\'email'}</p>
                                            <div className="mt-2 text-xs uppercase tracking-widest text-primary font-bold">{s.category || 'Général'}</div>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 -mt-2 -mr-2">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => {
                                                    setEditingSupplier(s)
                                                    setIsEditSupplierOpen(true)
                                                }}>
                                                    Modifier
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-rose-600" onClick={() => handleDeleteSupplier(s.id)}>
                                                    <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                    <EditSupplierModal
                        open={isEditSupplierOpen}
                        onOpenChange={setIsEditSupplierOpen}
                        supplier={editingSupplier}
                        onSuccess={loadData}
                    />
                </TabsContent>

                <TabsContent value="urssaf" className="space-y-4">
                    <div className="flex justify-end gap-2">
                        <AddUrssafModal onSuccess={loadData} />
                    </div>
                    <Card>
                        <CardHeader>
                            <CardTitle>Déclarations URSSAF</CardTitle>
                            <CardDescription>Gérez vos déclarations de chiffre d'affaires et suivez vos cotisations.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {urssafDeclarations.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground italic">
                                    Aucune déclaration URSSAF.
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {urssafDeclarations.map((decl) => (
                                        <div key={decl.id} className="flex items-center justify-between p-4 rounded-xl border bg-card hover:shadow-sm transition-all">
                                            <div>
                                                <p className="font-semibold text-lg">Période du {new Date(decl.period_start).toLocaleDateString('fr-FR')} au {new Date(decl.period_end).toLocaleDateString('fr-FR')}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge variant="outline" className={cn("text-xs font-medium",
                                                        decl.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                                                            decl.status === 'declared' ? 'bg-blue-100 text-blue-700' :
                                                                'bg-orange-100 text-orange-700'
                                                    )}>
                                                        {decl.status === 'paid' ? 'Payé' : decl.status === 'declared' ? 'Déclaré' : 'À déclarer'}
                                                    </Badge>
                                                    <span className="text-sm text-muted-foreground">
                                                        CA: {(decl.sales_revenue + decl.services_revenue).toLocaleString('fr-FR')} €
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="text-right">
                                                    <p className="font-bold text-xl text-primary">{decl.tax_amount.toLocaleString('fr-FR')} €</p>
                                                    <p className="text-[10px] text-muted-foreground">de cotisations</p>
                                                </div>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handleUpdateUrssafStatus(decl.id, 'declared')}>
                                                            Marquer comme Déclaré
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleUpdateUrssafStatus(decl.id, 'paid')}>
                                                            Marquer comme Payé
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleUpdateUrssafStatus(decl.id, 'pending')}>
                                                            Repasser 'À déclarer'
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="text-rose-600" onClick={() => handleDeleteUrssaf(decl.id)}>
                                                            <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
