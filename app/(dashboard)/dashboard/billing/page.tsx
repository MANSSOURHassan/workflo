'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/dashboard/page-header'

const PLANS = [
    {
        name: 'Starter',
        description: 'Pour démarrer sereinement',
        price: '19EUR',
        priceId: 'price_1THR7ZK1ToLOXNIUzlkOqfH0', // Votre ID de test
        isPopular: false,
        buttonVariant: 'outline' as const,
        features: [
            '500 prospects',
            '1 utilisateur',
            '1 000 emails/mois',
            'Support email',
        ],
    },
    {
        name: 'Pro',
        description: 'Pour les équipes en croissance',
        price: '49EUR',
        priceId: 'price_1ProXXX', // ID à créer pour la version PRO
        isPopular: true,
        buttonVariant: 'default' as const,
        features: [
            '5 000 prospects',
            '5 utilisateurs',
            '10 000 emails/mois',
            'Scoring IA avancé',
            'Support prioritaire',
        ],
    },
    {
        name: 'Enterprise',
        description: 'Pour les grandes organisations',
        price: '139EUR',
        priceId: 'price_1EnterpriseXXX', // ID à créer pour la version Enterprise
        isPopular: false,
        buttonVariant: 'outline' as const,
        features: [
            'Prospects illimités',
            'Utilisateurs illimités',
            'API complète',
            'SSO & SAML',
            'Support dédié',
        ],
    }
]

export default function BillingPage() {
    const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    const handleSubscribe = async (priceId: string) => {
        try {
            setLoadingPlan(priceId)
            setError(null)
            
            const res = await fetch('/api/stripe/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ priceId }),
            })
            
            if (!res.ok) {
                const text = await res.text()
                throw new Error(text || 'Erreur lors de la création de la session')
            }
            
            const { url } = await res.json()
            if (url) window.location.href = url
                
        } catch (err: any) {
            console.error(err)
            setError(err.message)
            setLoadingPlan(null)
        }
    }

    return (
        <div className="flex flex-col gap-8 p-4 max-w-6xl mx-auto">
            <PageHeader title="Facturation et Abonnements" description="Gérez votre forfait et vos méthodes de paiement." />

            {error && (
                <div className="bg-destructive/15 text-destructive p-4 rounded-md text-sm font-medium">
                    {error}
                </div>
            )}

            <div className="mt-8 grid gap-8 md:grid-cols-3 max-w-5xl mx-auto w-full">
                {PLANS.map((plan) => (
                    <Card key={plan.name} className={`relative flex flex-col ${plan.isPopular ? 'border-primary ring-1 ring-primary/20 shadow-lg' : ''}`}>
                        {plan.isPopular && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                <span className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                                    Populaire
                                </span>
                            </div>
                        )}
                        <CardHeader>
                            <CardTitle className="text-foreground">{plan.name}</CardTitle>
                            <CardDescription>{plan.description}</CardDescription>
                            <div className="mt-4">
                                <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                                <span className="text-muted-foreground">/mois</span>
                            </div>
                        </CardHeader>
                        <CardContent className="flex flex-col flex-1">
                            <ul className="space-y-3 flex-1">
                                {plan.features.map((feature) => (
                                    <li key={feature} className="flex items-center gap-2 text-sm">
                                        <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
                                        <span className="text-foreground">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                            
                            <Button 
                                className={`w-full mt-6 ${plan.buttonVariant === 'outline' ? 'bg-transparent' : ''}`}
                                variant={plan.buttonVariant}
                                onClick={() => handleSubscribe(plan.priceId)}
                                disabled={loadingPlan !== null}
                            >
                                {loadingPlan === plan.priceId ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Préparation...</>
                                ) : (
                                    `Choisir ${plan.name}`
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
