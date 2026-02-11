'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    CreditCard,
    Plus,
    ArrowUpRight,
    ArrowDownRight,
    RefreshCcw,
    CheckCircle2,
    ExternalLink,
    Loader2,
    Wallet
} from 'lucide-react'
import { getBankAccounts, getBankTransactions } from '@/lib/actions/banking'
import { BankAccount, BankTransaction } from '@/lib/types/database'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { ImportTransactionsModal } from '@/components/banking/import-transactions-modal'
import { AddBankAccountModal } from '@/components/banking/add-bank-account-modal'
import { syncBankData } from '@/lib/actions/banking'

export default function BankingPage() {
    const [accounts, setAccounts] = useState<BankAccount[]>([])
    const [transactions, setTransactions] = useState<BankTransaction[]>([])
    const [loading, setLoading] = useState(true)
    const [syncing, setSyncing] = useState(false)

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        setLoading(true)
        try {
            const [accountsRes, transactionsRes] = await Promise.all([
                getBankAccounts(),
                getBankTransactions()
            ])

            if (accountsRes.data) setAccounts(accountsRes.data)
            if (transactionsRes.data) setTransactions(transactionsRes.data)
        } catch (error) {
            toast.error('Erreur lors du chargement des données bancaires')
        } finally {
            setLoading(false)
        }
    }

    async function handleSync() {
        setSyncing(true)
        try {
            const res = await syncBankData()
            if (res.error) throw new Error(res.error)
            toast.success('Synchronisation terminée')
            loadData()
        } catch (error: any) {
            toast.error(error.message || 'Erreur lors de la synchronisation')
        } finally {
            setSyncing(false)
        }
    }

    const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.current_balance), 0)

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
                    <h1 className="text-3xl font-bold tracking-tight">Gestion Bancaire</h1>
                    <p className="text-muted-foreground">
                        Suivez vos soldes, vos transactions et réconciliez vos factures.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        className="gap-2"
                        onClick={handleSync}
                        disabled={syncing}
                    >
                        {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                        {syncing ? 'Synchronisation...' : 'Synchroniser'}
                    </Button>
                    <AddBankAccountModal onSuccess={loadData} />
                </div>
            </div>

            {/* Global Balance Card */}
            <Card className="bg-primary text-primary-foreground shadow-lg overflow-hidden relative">
                <div className="absolute right-0 top-0 h-full w-1/3 bg-white/10 skew-x-[-20deg] translate-x-10" />
                <CardContent className="pt-6 relative">
                    <div className="flex items-center gap-3 opacity-80">
                        <Wallet className="h-5 w-5" />
                        <span className="text-sm font-medium uppercase tracking-wider">Trésorerie Globale</span>
                    </div>
                    <div className="mt-4 flex items-baseline gap-2">
                        <span className="text-4xl font-bold">{totalBalance.toLocaleString('fr-FR')} €</span>
                        <span className="text-sm opacity-70">Disponibles sur {accounts.length} comptes</span>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Bank Accounts List */}
                <div className="md:col-span-1 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold">Mes Comptes</h2>
                    </div>
                    <div className="grid gap-3">
                        {accounts.map((account) => (
                            <Card key={account.id} className="cursor-pointer hover:border-primary/50 transition-all group">
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <CreditCard className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm">{account.name}</p>
                                            <p className="text-[10px] text-muted-foreground font-mono">{account.iban?.replace(/(.{4})/g, '$1 ') || 'Compte de paiement'}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-sm">{account.current_balance.toLocaleString('fr-FR')} €</p>
                                        <Badge variant="outline" className="text-[9px] h-4 mt-1">EUR</Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Transactions List */}
                <div className="md:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold">Dernières Opérations</h2>
                        <div className="flex items-center gap-2">
                            {accounts.length > 0 && (
                                <ImportTransactionsModal
                                    bankAccountId={accounts[0].id}
                                    onSuccess={loadData}
                                />
                            )}
                            <Button variant="link" className="text-primary text-xs h-auto p-0">Voir tout le relevé</Button>
                        </div>
                    </div>
                    <Card>
                        <CardContent className="p-0">
                            {transactions.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground italic">
                                    Aucune transaction enregistrée.
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {transactions.map((transaction) => {
                                        const isPositive = Number(transaction.amount) > 0
                                        return (
                                            <div key={transaction.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                                                <div className="flex items-center gap-4 min-w-0">
                                                    <div className={cn(
                                                        "h-9 w-9 rounded-lg flex items-center justify-center shrink-0",
                                                        isPositive ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
                                                    )}>
                                                        {isPositive ? <ArrowDownRight className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-medium text-sm truncate">{transaction.description}</p>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <p className="text-[10px] text-muted-foreground">{new Date(transaction.date).toLocaleDateString('fr-FR')}</p>
                                                            <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                                                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">{(transaction as any).bank_account?.name}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4 ml-4">
                                                    <div className="text-right">
                                                        <p className={cn(
                                                            "font-bold",
                                                            isPositive ? "text-emerald-600" : "text-foreground"
                                                        )}>
                                                            {isPositive ? '+' : ''}{transaction.amount.toLocaleString('fr-FR')} €
                                                        </p>
                                                        {transaction.status === 'reconciled' ? (
                                                            <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 text-[9px] h-4 gap-1 border-emerald-200">
                                                                <CheckCircle2 className="h-2 w-2" />
                                                                Rapproché
                                                            </Badge>
                                                        ) : (
                                                            <Button variant="ghost" size="sm" className="h-5 px-1.5 text-[9px] text-primary hover:bg-primary/5 gap-1">
                                                                <RefreshCcw className="h-2.5 w-2.5" />
                                                                Rapprocher
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
