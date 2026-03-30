'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
    CreditCard,
    Download,
    CheckCircle2,
    Zap,
    Users,
    Mail,
    HardDrive,
    ArrowUpRight,
    Receipt,
    Calendar,
    Loader2
} from 'lucide-react'
import { updateSubscriptionPlan } from '@/lib/actions/subscription'
import { PlanType, PLANS } from '@/lib/config/plans'
import { toast } from 'sonner'
import { Profile } from '@/lib/types/database'
import { CheckoutDialog } from './checkout-dialog'
import { PageHeader } from '@/components/dashboard/page-header'

interface BillingClientProps {
    profile: Profile | null;
    stats: any;
}

export function BillingClient({ profile, stats }: BillingClientProps) {
    const [isChanging, setIsChanging] = useState(false)
    const [showCheckout, setShowCheckout] = useState(false)
    const [checkoutMode, setCheckoutMode] = useState<'payment_method' | 'checkout'>('checkout')
    const [selectedPlan, setSelectedPlan] = useState<{ name: string, price: string, features?: string[] } | null>(null)

    const currentPlanKey = (profile?.plan as PlanType) || 'starter'
    const currentPlanConfig = PLANS[currentPlanKey]

    const usage = {
        contacts: { used: stats.totalProspects || 0, limit: currentPlanConfig.maxProspects },
        users: { used: stats.teamCount || 1, limit: currentPlanConfig.maxUsers },
        emails: { used: stats.emailsSentThisMonth || 0, limit: currentPlanConfig.maxEmailsPerMonth },
        storage: { used: 0, limit: 10 }, // Placeholder for storage
    }

    const plans = [
        {
            name: 'Starter',
            price: '19',
            features: PLANS.starter.features,
            current: currentPlanKey === 'starter'
        },
        {
            name: 'Pro',
            price: '49',
            features: PLANS.pro.features,
            current: currentPlanKey === 'pro',
            popular: true
        },
        {
            name: 'Enterprise',
            price: '139',
            features: PLANS.enterprise.features,
            current: currentPlanKey === 'enterprise'
        },
    ]

    const openPaymentMethod = () => {
        setCheckoutMode('payment_method')
        setSelectedPlan(null)
        setShowCheckout(true)
    }

    const openCheckout = (plan: typeof plans[0]) => {

        const planKey = plan.name.toLowerCase() as PlanType
        if (planKey === currentPlanKey) return

        setCheckoutMode('checkout')
        setSelectedPlan({ name: plan.name, price: plan.price, features: plan.features })
        setShowCheckout(true)
    }

    const handleCheckoutConfirm = async () => {
        if (checkoutMode === 'payment_method') {
            toast.success("Moyen de paiement mis à jour avec succès")
            return
        }

        if (checkoutMode === 'checkout' && selectedPlan) {
            const planKey = selectedPlan.name.toLowerCase() as PlanType

            const result = await updateSubscriptionPlan(planKey)
            if (result.error) {
                toast.error(`Erreur: ${result.error}`)
                throw new Error(result.error)
            } else {
                toast.success(`Plan ${selectedPlan.name} activé !`)
                window.location.reload()
            }
        }
    }

    return (
        <div className="space-y-6">
            <PageHeader 
                title="Facturation & Abonnements" 
                description="Gérez votre forfait, vos moyens de paiement et consultez l'historique de vos factures."
            >
                <Button variant="outline" className="bg-transparent border-primary/20 hover:bg-primary/5 transition-all font-semibold" onClick={openPaymentMethod}>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Mettre à jour le paiement
                </Button>
            </PageHeader>

            {/* Current Plan */}
            <Card className="bg-gradient-to-r from-primary/5 to-transparent border-primary/20">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
                                <Zap className="h-6 w-6 text-primary-foreground" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <CardTitle>Votre Forfait Actuel: {currentPlanConfig.name}</CardTitle>
                                    <Badge variant="secondary" className="bg-primary/10 text-primary border-none">
                                        Mensuel
                                    </Badge>
                                </div>
                                <CardDescription suppressHydrationWarning>
                                    Votre prochaine facture est de {currentPlanKey === 'starter' ? '19' : currentPlanKey === 'pro' ? '49' : '139'}€ le {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toLocaleDateString('fr-FR')}
                                </CardDescription>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-3xl font-bold">{currentPlanKey === 'enterprise' ? '139' : currentPlanKey === 'pro' ? '49' : '19'}€</p>
                            <p className="text-sm text-muted-foreground">par mois</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        <UsageItem
                            icon={Users}
                            label="Prospects"
                            used={usage.contacts.used}
                            limit={usage.contacts.limit}
                            unit="contacts"
                        />
                        <UsageItem
                            icon={Users}
                            label="Utilisateurs"
                            used={usage.users.used}
                            limit={usage.users.limit}
                            unit="membres"
                        />
                        <UsageItem
                            icon={Mail}
                            label="Emails"
                            used={usage.emails.used}
                            limit={usage.emails.limit}
                            unit="emails/mois"
                        />
                        <UsageItem
                            icon={HardDrive}
                            label="Stockage"
                            used={usage.storage.used}
                            limit={usage.storage.limit}
                            unit="Go"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Plans Comparison */}
            <div className="grid gap-6 md:grid-cols-3">
                {plans.map((plan) => (
                    <Card key={plan.name} className={`relative flex flex-col ${plan.popular ? 'border-primary shadow-lg shadow-primary/10' : ''}`}>
                        {plan.popular && (
                            <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-primary-foreground">
                                Plus populaire
                            </Badge>
                        )}
                        <CardHeader>
                            <CardTitle>{plan.name}</CardTitle>
                            <div className="mt-2 flex items-baseline gap-1">
                                <span className="text-3xl font-bold">{plan.price}</span>
                                {plan.price !== 'Sur devis' && <span className="text-muted-foreground">€/mois</span>}
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <ul className="space-y-3">
                                {plan.features.map((feature) => (
                                    <li key={feature} className="flex items-center gap-2 text-sm">
                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                        <CardContent className="pt-0">
                            {plan.current ? (
                                <Button className="w-full" disabled>
                                    Plan actuel
                                </Button>
                            ) : (
                                <Button
                                    variant="outline"
                                    className="w-full bg-transparent"
                                    disabled={isChanging}
                                    onClick={() => openCheckout(plan)}
                                >
                                    {isChanging && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Passer au plan
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Invoice History */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Historique des factures</CardTitle>
                            <CardDescription>Téléchargez vos factures passées</CardDescription>
                        </div>
                        <Button variant="ghost" size="sm">
                            <Receipt className="mr-2 h-4 w-4" />
                            Tout télécharger
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[
                            { id: 'INV-2026-001', date: '2026-01-01', amount: currentPlanKey === 'pro' ? 49 : 19, status: 'payé' },
                        ].map((invoice) => (
                            <div key={invoice.id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                                        <Receipt className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="font-medium">{invoice.id}</p>
                                        <p className="text-sm text-muted-foreground">{invoice.date}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <p className="font-medium text-primary">{invoice.amount}€</p>
                                        <Badge variant="outline" className="text-xs uppercase bg-green-50 text-green-700 border-green-200">
                                            {invoice.status}
                                        </Badge>
                                    </div>
                                    <Button variant="ghost" size="icon">
                                        <Download className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>


            <CheckoutDialog
                open={showCheckout}
                onOpenChange={setShowCheckout}
                mode={checkoutMode}
                plan={selectedPlan}
                onConfirm={handleCheckoutConfirm}
            />
        </div >
    )
}

function UsageItem({ icon: Icon, label, used, limit, unit }: any) {
    const percentage = Math.min(Math.round((used / limit) * 100), 100)
    const isOverLimit = used >= limit && limit !== Infinity

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Icon className="h-4 w-4" />
                    {label}
                </div>
                <span className={isOverLimit ? 'text-destructive font-medium' : ''}>
                    {used} / {limit === Infinity ? '∞' : limit}
                </span>
            </div>
            <Progress value={limit === Infinity ? 0 : percentage} className={`h-1.5 ${isOverLimit ? 'bg-destructive/20' : ''}`} />
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{unit}</p>
        </div>
    )
}
