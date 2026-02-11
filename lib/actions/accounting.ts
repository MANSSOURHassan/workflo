'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidateTag } from 'next/cache'
import { Supplier, Expense, Invoice, Quote } from '@/lib/types/database'

// --- SUPPLIERS ---

export async function getSuppliers() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { data: [], error: 'Non autorisé' }

    const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true })

    return { data: data as Supplier[], error: error?.message }
}

export async function createSupplier(supplier: Partial<Supplier>) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Non autorisé' }

    const { data, error } = await supabase
        .from('suppliers')
        .insert({ ...supplier, user_id: user.id })
        .select()
        .single()

    if (!error) revalidateTag('accounting', 'max')
    return { data: data as Supplier, error: error?.message }
}

// --- EXPENSES ---

export async function getExpenses() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { data: [], error: 'Non autorisé' }

    const { data, error } = await supabase
        .from('expenses')
        .select('*, supplier:suppliers(id, name)')
        .eq('user_id', user.id)
        .order('issue_date', { ascending: false })

    return { data: data as Expense[], error: error?.message }
}

export async function createExpense(expense: Partial<Expense>) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Non autorisé' }

    const { data, error } = await supabase
        .from('expenses')
        .insert({ ...expense, user_id: user.id })
        .select()
        .single()

    if (!error) {
        await supabase.from('audit_logs').insert({
            user_id: user.id,
            action_type: 'expense_created',
            entity_type: 'expense',
            entity_id: data.id,
            description: `Nouvelle dépense enregistrée : ${expense.description} (${expense.total_amount} ${expense.currency})`
        })
        revalidateTag('accounting', 'max')
    }
    return { data: data as Expense, error: error?.message }
}

// --- INVOICES ---

export async function getInvoices() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { data: [], error: 'Non autorisé' }

    const { data, error } = await supabase
        .from('invoices')
        .select('*, prospect:prospects(id, first_name, last_name, company, email)')
        .eq('user_id', user.id)
        .order('issue_date', { ascending: false })

    return { data: data as Invoice[], error: error?.message }
}

export async function createInvoice(invoice: Partial<Invoice>) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Non autorisé' }

    const { data, error } = await supabase
        .from('invoices')
        .insert({ ...invoice, user_id: user.id })
        .select()
        .single()

    if (!error) revalidateTag('accounting', 'max')
    return { data: data as Invoice, error: error?.message }
}

export async function updateInvoice(id: string, invoice: Partial<Invoice>) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Non autorisé' }

    const { data, error } = await supabase
        .from('invoices')
        .update({ ...invoice, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

    if (!error) revalidateTag('accounting', 'max')
    return { data: data as Invoice, error: error?.message }
}

export async function updateInvoiceStatus(id: string, status: Invoice['status']) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Non autorisé' }

    const { error } = await supabase
        .from('invoices')
        .update({ status })
        .eq('id', id)
        .eq('user_id', user.id)

    if (!error) revalidateTag('accounting', 'max')
    return { error: error?.message }
}

export async function deleteInvoice(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Non autorisé' }

    const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

    if (!error) revalidateTag('accounting', 'max')
    return { error: error?.message }
}

// --- QUOTES (DEVIS) ---

export async function getQuotes() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { data: [], error: 'Non autorisé' }

    const { data, error } = await supabase
        .from('quotes')
        .select('*, prospect:prospects(id, first_name, last_name, company, email)')
        .eq('user_id', user.id)
        .order('issue_date', { ascending: false })

    return { data: data as Quote[], error: error?.message }
}

export async function createQuote(quote: Partial<Quote>) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Non autorisé' }

    const { data, error } = await supabase
        .from('quotes')
        .insert({ ...quote, user_id: user.id })
        .select()
        .single()

    if (!error) revalidateTag('accounting', 'max')
    return { data: data as Quote, error: error?.message }
}

export async function updateQuote(id: string, quote: Partial<Quote>) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Non autorisé' }

    const { data, error } = await supabase
        .from('quotes')
        .update({ ...quote, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

    if (!error) revalidateTag('accounting', 'max')
    return { data: data as Quote, error: error?.message }
}

export async function updateQuoteStatus(id: string, status: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Non autorisé' }

    const { error } = await supabase
        .from('quotes')
        .update({ status })
        .eq('id', id)
        .eq('user_id', user.id)

    if (!error) revalidateTag('accounting', 'max')
    return { error: error?.message }
}

export async function deleteQuote(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Non autorisé' }

    const { error } = await supabase
        .from('quotes')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

    if (!error) revalidateTag('accounting', 'max')
    return { error: error?.message }
}

// --- EMAIL SENDING (SIMULATED) ---

export async function sendInvoiceByEmail(invoiceId: string, recipientEmail: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Non autorisé' }

    // Simuler un délai
    await new Promise(resolve => setTimeout(resolve, 1000))

    const { error } = await supabase
        .from('invoices')
        .update({ status: 'sent' })
        .eq('id', invoiceId)
        .eq('user_id', user.id)

    if (!error) {
        await supabase.from('audit_logs').insert({
            user_id: user.id,
            action_type: 'invoice_sent',
            entity_type: 'invoice',
            entity_id: invoiceId,
            description: `Facture envoyée à ${recipientEmail}`
        })
        revalidateTag('accounting', 'max')
    }

    return { success: true, error: error?.message }
}

export async function sendQuoteByEmail(quoteId: string, recipientEmail: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Non autorisé' }

    // Simuler un délai
    await new Promise(resolve => setTimeout(resolve, 1000))

    const { error } = await supabase
        .from('quotes')
        .update({ status: 'sent' })
        .eq('id', quoteId)
        .eq('user_id', user.id)

    if (!error) {
        await supabase.from('audit_logs').insert({
            user_id: user.id,
            action_type: 'quote_sent',
            entity_type: 'quote',
            entity_id: quoteId,
            description: `Devis envoyé à ${recipientEmail}`
        })
        revalidateTag('accounting', 'max')
    }

    return { success: true, error: error?.message }
}

// --- CHART OF ACCOUNTS ---

export async function getAccountingAccounts() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { data: [], error: 'Non autorisé' }

    const { data, error } = await supabase
        .from('accounting_accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('code', { ascending: true })

    // If no accounts, seed them
    if (!error && (data?.length === 0)) {
        await supabase.rpc('seed_default_accounts', { target_user_id: user.id })
        const { data: seededData } = await supabase
            .from('accounting_accounts')
            .select('*')
            .eq('user_id', user.id)
            .order('code', { ascending: true })
        return { data: seededData }
    }

    return { data, error: error?.message }
}

// --- FINANCIAL SUMMARY (BILAN & RÉSULTAT) ---

export async function getProFinancialSummary() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Non autorisé' }

    const { data: invoices } = await supabase
        .from('invoices')
        .select('total, account_code, status')
        .eq('user_id', user.id)
        .eq('status', 'paid')

    const { data: expenses } = await supabase
        .from('expenses')
        .select('total_amount, account_code, status')
        .eq('user_id', user.id)
        .eq('status', 'paid')

    // Grouping by Class
    const classTotals: Record<number, number> = {}

    invoices?.forEach(inv => {
        const cls = parseInt(inv.account_code?.[0] || '7')
        classTotals[cls] = (classTotals[cls] || 0) + Number(inv.total)
    })

    expenses?.forEach(exp => {
        const cls = parseInt(exp.account_code?.[0] || '6')
        classTotals[cls] = (classTotals[cls] || 0) + Number(exp.total_amount)
    })

    const income = classTotals[7] || 0
    const costs = classTotals[6] || 0

    return {
        data: {
            classes: classTotals,
            invoices: invoices || [],
            expenses: expenses || [],
            summary: {
                income,
                costs,
                result: income - costs
            }
        }
    }
}
