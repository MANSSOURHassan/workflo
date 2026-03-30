'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Users, FileText, Wallet, TrendingUp, Plus, ArrowRight, Loader2 } from 'lucide-react'
import { formatCurrency, MONTHS_FR } from '@/lib/payroll/calculations'
import { PageHeader } from '@/components/dashboard/page-header'

export default function PayrollPage() {
    const [stats, setStats] = useState<any>(null)
    const [recentPayslips, setRecentPayslips] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function load() {
            try {
                const [empRes, payRes] = await Promise.all([
                    fetch('/api/payroll/employees'),
                    fetch('/api/payroll/payslips'),
                ])
                const employees = empRes.ok ? await empRes.json() : []
                const payslips = payRes.ok ? await payRes.json() : []

                const now = new Date()
                const thisMonth = payslips.filter((p: any) =>
                    p.period_month === now.getMonth() + 1 && p.period_year === now.getFullYear()
                )
                const masseSalariale = thisMonth.reduce((s: number, p: any) => s + (p.gross_salary || 0), 0)
                const netTotal = thisMonth.reduce((s: number, p: any) => s + (p.net_to_pay || 0), 0)

                setStats({
                    totalEmployees: employees.length,
                    activeEmployees: employees.filter((e: any) => e.is_active).length,
                    masseSalariale,
                    netTotal,
                    fichesMonth: thisMonth.length,
                    fichesIssued: payslips.filter((p: any) => p.status === 'issued' || p.status === 'paid').length,
                })
                setRecentPayslips(payslips.slice(0, 5))
            } catch { }
            setLoading(false)
        }
        load()
    }, [])

    const now = new Date()
    const currentMonthYear = `${MONTHS_FR[now.getMonth()]} ${now.getFullYear()}`

    const statusBadge = (status: string) => {
        const map: Record<string, { label: string, variant: any }> = {
            draft: { label: 'Brouillon', variant: 'secondary' },
            issued: { label: 'Émis', variant: 'default' },
            paid: { label: 'Payé', variant: 'outline' },
            archived: { label: 'Archivé', variant: 'outline' },
        }
        const s = map[status] || map.draft
        return <Badge variant={s.variant}>{s.label}</Badge>
    }

    if (loading) return (
        <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    )

    return (
        <div className="flex flex-col gap-6">
            <PageHeader 
                title="Gestion de la Paie" 
                description="Gérez les salaires de vos employés, générez les fiches de paie et suivez votre masse salariale."
            >
                <div className="flex gap-2">
                    <Button variant="outline" asChild>
                        <Link href="/dashboard/payroll/employees"><Users className="mr-2 h-4 w-4" />Employés</Link>
                    </Button>
                    <Button asChild>
                        <Link href="/dashboard/payroll/payslips"><Plus className="mr-2 h-4 w-4" />Nouvelle fiche</Link>
                    </Button>
                </div>
            </PageHeader>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Employés actifs</CardDescription>
                        <CardTitle className="text-3xl">{stats?.activeEmployees ?? 0}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Users className="h-4 w-4" />
                            <span>{stats?.totalEmployees ?? 0} au total</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Masse salariale brute — {currentMonthYear}</CardDescription>
                        <CardTitle className="text-2xl">{formatCurrency(stats?.masseSalariale ?? 0)}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Wallet className="h-4 w-4" />
                            <span>Net : {formatCurrency(stats?.netTotal ?? 0)}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Fiches du mois</CardDescription>
                        <CardTitle className="text-3xl">{stats?.fichesMonth ?? 0}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <FileText className="h-4 w-4" />
                            <span>{currentMonthYear}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Fiches émises (total)</CardDescription>
                        <CardTitle className="text-3xl">{stats?.fichesIssued ?? 0}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <TrendingUp className="h-4 w-4" />
                            <span>Payées / émises</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Accès rapides */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card className="hover:border-primary transition-colors cursor-pointer" onClick={() => window.location.href='/dashboard/payroll/employees'}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-primary" />Employés</CardTitle>
                        <CardDescription>Gérer la liste des employés, leur salaire et leurs informations</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/dashboard/payroll/employees">Voir les employés <ArrowRight className="ml-2 h-4 w-4" /></Link>
                        </Button>
                    </CardContent>
                </Card>

                <Card className="hover:border-primary transition-colors cursor-pointer" onClick={() => window.location.href='/dashboard/payroll/payslips'}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" />Fiches de paie</CardTitle>
                        <CardDescription>Générer, émettre et archiver les bulletins de salaire</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/dashboard/payroll/payslips">Voir les fiches <ArrowRight className="ml-2 h-4 w-4" /></Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Dernières fiches */}
            {recentPayslips.length > 0 && (
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Dernières fiches de paie</CardTitle>
                            <CardDescription>Les 5 fiches les plus récentes</CardDescription>
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/dashboard/payroll/payslips">Voir tout <ArrowRight className="ml-1 h-4 w-4" /></Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {recentPayslips.map((p: any) => (
                                <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                                    <div className="flex-1">
                                        <p className="font-medium text-sm">
                                            {p.employees?.first_name} {p.employees?.last_name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {MONTHS_FR[(p.period_month ?? 1) - 1]} {p.period_year} · {p.employees?.job_title}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {statusBadge(p.status)}
                                        <div className="text-right">
                                            <p className="text-sm font-semibold">{formatCurrency(p.net_to_pay)}</p>
                                            <p className="text-xs text-muted-foreground">net</p>
                                        </div>
                                        <Button variant="ghost" size="sm" asChild>
                                            <Link href={`/dashboard/payroll/payslips/${p.id}`}><ArrowRight className="h-4 w-4" /></Link>
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
