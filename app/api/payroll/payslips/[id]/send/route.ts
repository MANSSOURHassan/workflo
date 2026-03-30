import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendPayslipEmail } from '@/lib/email/payslip'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { id } = await params

    const { data: payslip } = await supabase
        .from('payslips')
        .select('*, employees(*)')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

    if (!payslip) return NextResponse.json({ error: 'Fiche introuvable' }, { status: 404 })

    const emp = payslip.employees
    const employeeEmail = emp?.email
    if (!employeeEmail) return NextResponse.json({ error: 'L\'employé n\'a pas d\'adresse email enregistrée' }, { status: 400 })

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const payslipUrl = `${siteUrl}/dashboard/payroll/payslips/${id}`

    const result = await sendPayslipEmail({
        to: employeeEmail,
        employeeName: `${emp.first_name} ${emp.last_name}`,
        month: payslip.period_month,
        year: payslip.period_year,
        netToPay: payslip.net_to_pay,
        grossSalary: payslip.gross_salary,
        payslipUrl,
    })

    if (!result.success) return NextResponse.json({ error: result.error || 'Erreur envoi email' }, { status: 500 })

    // Passer le statut à "issued" automatiquement
    await supabase.from('payslips').update({ status: 'issued' }).eq('id', id)

    return NextResponse.json({ success: true, sentTo: employeeEmail })
}
