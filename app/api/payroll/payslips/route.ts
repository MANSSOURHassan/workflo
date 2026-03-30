import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculerCotisations } from '@/lib/payroll/calculations'

export async function GET(request: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const url = new URL(request.url)
    const employeeId = url.searchParams.get('employee_id')
    const year = url.searchParams.get('year')

    let query = supabase
        .from('payslips')
        .select('*, employees(first_name, last_name, job_title, employee_number)')
        .eq('user_id', user.id)
        .order('period_year', { ascending: false })
        .order('period_month', { ascending: false })

    if (employeeId) query = query.eq('employee_id', employeeId)
    if (year) query = query.eq('period_year', parseInt(year))

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const body = await request.json()
    const {
        employee_id, period_month, period_year,
        gross_salary, bonus = 0, bonus_label,
        meal_allowance = 0, transport_allowance = 0,
        overtime_hours = 0, overtime_amount = 0,
        taux_impot = 0, worked_hours = 151.67,
        leave_taken = 0, notes
    } = body

    // Calcul automatique des cotisations
    const calc = calculerCotisations(gross_salary, bonus, meal_allowance, transport_allowance, overtime_amount, taux_impot)

    // Récupérer les congés restants de l'employé
    const { data: employee } = await supabase.from('employees').select('paid_leave_days').eq('id', employee_id).single()
    const leaveRemaining = (employee?.paid_leave_days ?? 25) - leave_taken

    const { data, error } = await supabase
        .from('payslips')
        .insert({
            user_id: user.id,
            employee_id,
            period_month,
            period_year,
            gross_salary,
            worked_hours,
            overtime_hours,
            overtime_amount,
            bonus,
            bonus_label,
            meal_allowance,
            transport_allowance,
            cotisation_retraite_base: calc.retraiteBase,
            cotisation_retraite_comp: calc.retraiteComp,
            cotisation_prevoyance: calc.prevoyance,
            cotisation_csg_deductible: calc.csgDeductible,
            cotisation_csg_crds: calc.csgCrds,
            total_cotisations_salariales: calc.totalSalarial,
            total_cotisations_patronales: calc.totalPatronal,
            net_before_tax: calc.netAvantImpot,
            impot_source: calc.netAvantImpot * (taux_impot / 100),
            net_to_pay: calc.netAPayer,
            leave_taken,
            leave_remaining: leaveRemaining,
            notes,
            status: 'draft',
        })
        .select('*, employees(first_name, last_name, job_title, employee_number)')
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
}
