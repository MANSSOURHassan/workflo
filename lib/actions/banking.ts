'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidateTag } from 'next/cache'
import { BankAccount, BankTransaction } from '@/lib/types/database'

// --- BANK ACCOUNTS ---

export async function getBankAccounts() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { data: [], error: 'Non autorisé' }

    const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true })

    return { data: data as BankAccount[], error: error?.message }
}

export async function createBankAccount(account: Partial<BankAccount>) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Non autorisé' }

    const { data, error } = await supabase
        .from('bank_accounts')
        .insert({
            ...account,
            user_id: user.id,
            current_balance: account.initial_balance || 0
        })
        .select()
        .single()

    if (!error) revalidateTag('accounting', 'max')
    return { data: data as BankAccount, error: error?.message }
}

// --- BANK TRANSACTIONS ---

export async function getBankTransactions(accountId?: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { data: [], error: 'Non autorisé' }

    let query = supabase
        .from('bank_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })

    if (accountId) {
        query = query.eq('bank_account_id', accountId)
    }

    const { data: transactionsData, error } = await query
    const transactions = (transactionsData as BankTransaction[]) || []

    if (!error && transactions.length > 0) {
        try {
            const accountIds = [...new Set(transactions.map(t => t.bank_account_id).filter(Boolean))] as string[]
            if (accountIds.length > 0) {
                const { data: accounts } = await supabase
                    .from('bank_accounts')
                    .select('id, name')
                    .in('id', accountIds)
                
                if (accounts) {
                    transactions.forEach(t => {
                        const acc = accounts.find(a => a.id === t.bank_account_id)
                        if (acc) {
                            (t as any).bank_account = { name: acc.name }
                        }
                    })
                }
            }
        } catch (joinErr) {
            console.warn('Banking in-memory join failed:', joinErr)
        }
    }

    return { data: transactions, error: error?.message }
}

export async function createBankTransaction(transaction: Partial<BankTransaction>) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Non autorisé' }

    const { data, error } = await supabase
        .from('bank_transactions')
        .insert({ ...transaction, user_id: user.id })
        .select()
        .single()

    if (!error) revalidateTag('accounting', 'max')
    return { data: data as BankTransaction, error: error?.message }
}

// --- RECONCILIATION ---

export async function reconcileTransaction(transactionId: string, entityType: 'invoice' | 'expense', entityId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Non autorisé' }

    // 1. Mark transaction as reconciled
    const { error: transError } = await supabase
        .from('bank_transactions')
        .update({
            status: 'reconciled',
            linked_entity_type: entityType,
            linked_entity_id: entityId
        })
        .eq('id', transactionId)
        .eq('user_id', user.id)

    if (transError) return { error: transError.message }

    // 2. Mark entity as paid
    const tableName = entityType === 'invoice' ? 'invoices' : 'expenses'
    const { error: entityError } = await supabase
        .from(tableName)
        .update({ status: 'paid' })
        .eq('id', entityId)
        .eq('user_id', user.id)

    if (entityError) return { error: entityError.message }

    revalidateTag('accounting', 'max')
    return { success: true }
}

export async function syncBankData() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Non autorisé' }

    // logic to fetch from external API or recalculate internal state
    // For now we revalidate to refresh data
    revalidateTag('accounting', 'max')

    // Simulate a bit of work
    await new Promise(resolve => setTimeout(resolve, 1500))

    return { success: true }
}
