'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  Plus,
  MoreHorizontal,
  Trash2,
  Loader2,
  Download,
  Send,
  Euro,
  Mail,
  Share2,
  MessageCircle,
  FileDown,
  TrendingUp,
  Receipt,
  Wallet,
  TrendingDown,
  Edit,
  Clock
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { generateInvoicePDF, generateQuotePDF } from '@/lib/utils/pdf-generator'
import { generateInvoiceWord, generateQuoteWord } from '@/lib/utils/word-generator'
import {
  getInvoices,
  getQuotes,
  updateInvoiceStatus,
  updateQuoteStatus,
  deleteInvoice,
  deleteQuote,
  sendInvoiceByEmail,
  sendQuoteByEmail
} from '@/lib/actions/accounting'
import { Invoice, Quote } from '@/lib/types/database'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { AddInvoiceModal } from '@/components/accounting/add-invoice-modal'
import { AddQuoteModal } from '@/components/accounting/add-quote-modal'
import { PageHeader } from '@/components/dashboard/page-header'

const invoiceStatusConfig: Record<string, { label: string, color: string }> = {
  draft: { label: 'Brouillon', color: 'bg-slate-100 text-slate-700' },
  sent: { label: 'Envoyée', color: 'bg-blue-100 text-blue-700' },
  paid: { label: 'Payée', color: 'bg-green-100 text-green-700' },
  pending: { label: 'En attente', color: 'bg-orange-100 text-orange-700' },
  overdue: { label: 'En retard', color: 'bg-red-100 text-red-700' },
  cancelled: { label: 'Annulée', color: 'bg-gray-100 text-gray-700' }
}

const quoteStatusConfig: Record<string, { label: string, color: string }> = {
  draft: { label: 'Brouillon', color: 'bg-slate-100 text-slate-700' },
  sent: { label: 'Envoyé', color: 'bg-blue-100 text-blue-700' },
  accepted: { label: 'Accepté', color: 'bg-green-100 text-green-700' },
  pending: { label: 'En attente', color: 'bg-orange-100 text-orange-700' },
  rejected: { label: 'Refusé', color: 'bg-red-100 text-red-700' },
  expired: { label: 'Expiré', color: 'bg-gray-100 text-gray-700' }
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [invoicesRes, quotesRes] = await Promise.all([
        getInvoices(),
        getQuotes()
      ])

      if (invoicesRes.data) setInvoices(invoicesRes.data)
      if (quotesRes.data) setQuotes(quotesRes.data as any)
    } catch (error) {
      toast.error('Erreur lors du chargement des documents')
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

  const handleShare = (doc: any, platform: 'whatsapp' | 'linkedin') => {
    const text = `Bonjour, voici votre ${doc.invoice_number ? 'facture' : 'devis'} ${doc.invoice_number || doc.quote_number} d'un montant de ${doc.total.toLocaleString('fr-FR')} €.`
    const url = window.location.origin

    if (platform === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank')
    } else {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank')
    }
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

  const stats = {
    total: invoices.reduce((sum, inv) => sum + inv.total, 0),
    paid: invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.total, 0),
    pending: invoices.filter(inv => ['draft', 'sent'].includes(inv.status)).reduce((sum, inv) => sum + inv.total, 0),
    quotes: quotes.filter(q => q.status === 'accepted').reduce((sum, q) => sum + q.total, 0)
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
      <PageHeader 
        title="Devis & Factures" 
        description="Gérez vos documents commerciaux, transformez vos devis en factures et suivez vos paiements clients."
      >
        <div className="flex gap-2">
          <AddQuoteModal onSuccess={loadData} />
          <AddInvoiceModal onSuccess={loadData} />
        </div>
      </PageHeader>

      {/* Simple Stats Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Facturé</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total.toLocaleString('fr-FR')} €</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-emerald-600">Encaissé (Payé)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{stats.paid.toLocaleString('fr-FR')} €</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-600">En attente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.pending.toLocaleString('fr-FR')} €</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-600">Devis Acceptés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.quotes.toLocaleString('fr-FR')} €</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="invoices" className="space-y-4">
        <TabsList>
          <TabsTrigger value="invoices" className="gap-2">
            <FileText className="h-4 w-4" />
            Factures
          </TabsTrigger>
          <TabsTrigger value="quotes" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Devis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Journal des Factures</CardTitle>
              <CardDescription>Liste exhaustive des factures émises depuis le CRM.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {invoices.length === 0 ? (
                  <p className="text-muted-foreground italic text-center py-8">Aucune facture trouvée.</p>
                ) : (
                  invoices.map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between p-4 rounded-xl border bg-card hover:bg-accent/5 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Receipt className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-bold">{inv.invoice_number}</p>
                          <p className="text-xs text-muted-foreground uppercase font-semibold">
                            {inv.prospect ? `${inv.prospect.first_name} ${inv.prospect.last_name}` : 'Client Inconnu'}
                            {inv.prospect?.company && ` • ${inv.prospect.company}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="font-bold text-lg">{inv.total.toLocaleString('fr-FR')} €</p>
                          <div className="flex items-center justify-end gap-2 mt-1">
                            <Badge variant="outline" className={cn("text-[10px]", invoiceStatusConfig[inv.status].color)}>
                              {invoiceStatusConfig[inv.status].label}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(inv.issue_date).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
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
                            <DropdownMenuItem onClick={() => updateInvoiceStatus(inv.id, 'pending')}>
                              <Clock className="mr-2 h-4 w-4" /> Marquer en attente
                            </DropdownMenuItem>
                            <AddInvoiceModal
                              onSuccess={loadData}
                              invoiceToEdit={inv}
                              trigger={
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                  <Edit className="mr-2 h-4 w-4" /> Modifier
                                </DropdownMenuItem>
                              }
                            />
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
        </TabsContent>

        <TabsContent value="quotes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Journal des Devis</CardTitle>
              <CardDescription>Suivi des propositions commerciales envoyées.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {quotes.length === 0 ? (
                  <p className="text-muted-foreground italic text-center py-8">Aucun devis trouvé.</p>
                ) : (
                  quotes.map((q) => (
                    <div key={q.id} className="flex items-center justify-between p-4 rounded-xl border bg-card hover:bg-accent/5 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="font-bold">{q.quote_number}</p>
                          <p className="text-xs text-muted-foreground uppercase font-semibold">
                            {q.prospect ? `${q.prospect.first_name} ${q.prospect.last_name}` : 'Prospect Inconnu'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="font-bold text-lg">{q.total.toLocaleString('fr-FR')} €</p>
                          <div className="flex items-center justify-end gap-2 mt-1">
                            <Badge variant="outline" className={cn("text-[10px]", quoteStatusConfig[q.status].color)}>
                              {quoteStatusConfig[q.status].label}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(q.issue_date).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
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
                            <DropdownMenuItem onClick={() => updateQuoteStatus(q.id, 'pending')}>
                              <Clock className="mr-2 h-4 w-4" /> Marquer en attente
                            </DropdownMenuItem>
                            <AddQuoteModal
                              onSuccess={loadData}
                              quoteToEdit={q}
                              trigger={
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                  <Edit className="mr-2 h-4 w-4" /> Modifier
                                </DropdownMenuItem>
                              }
                            />
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
        </TabsContent>
      </Tabs>
    </div>
  )
}
