'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  ArrowRight, 
  FileText, 
  TrendingUp, 
  CheckCircle2, 
  Users, 
  Zap,
  Info,
  Layers,
  ArrowBigRight
} from 'lucide-react'
import { PageHeader } from '@/components/dashboard/page-header'
import { Badge } from '@/components/ui/badge'

export default function WorkflowGuidePage() {
    const steps = [
        {
            title: "1. Capture du Client",
            description: "Ajoutez un nouveau prospect dans la section 'Contacts'. Remplissez ses coordonnées pour préparer le terrain.",
            icon: Users,
            color: "text-blue-600",
            bgColor: "bg-blue-100",
            details: "Indispensable pour lier vos futurs documents à une identité."
        },
        {
            title: "2. Émission du Devis",
            description: "Créez un devis depuis 'Devis & Factures'. Choisissez le prospect.",
            icon: FileText,
            color: "text-orange-600",
            bgColor: "bg-orange-100",
            automation: "Dès validation, une opportunité (Deal) est créée AUTOMATIQUEMENT dans votre Pipeline.",
            details: "Étape : 'Proposition'"
        },
        {
            title: "3. Suivi Pipeline",
            description: "Retrouvez votre devis sous forme de carte dans le 'Pipeline'. Vous pouvez le déplacer manuellement si besoin.",
            icon: Layers,
            color: "text-purple-600",
            bgColor: "bg-purple-100",
            details: "Suivi visuel de votre progression commerciale."
        },
        {
            title: "4. Facturation & Succès",
            description: "Transformez le devis en facture. Dès que la facture est enregistrée...",
            icon: Zap,
            color: "text-green-600",
            bgColor: "bg-green-100",
            automation: "L'opportunité passe AUTOMATIQUEMENT en statut 'GAGNÉ' et se ferme.",
            details: "Calcul automatique du CA encaissé."
        }
    ]

    return (
        <div className="space-y-8 max-w-5xl mx-auto pb-12 animate-in fade-in duration-700">
            <PageHeader 
                title="Guide du Workflow CRM" 
                description="Découvrez comment vos documents comptables pilotent automatiquement votre pipeline commercial."
            >
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                    <Zap className="mr-2 h-4 w-4" />
                    Automatisations Actives
                </Badge>
            </PageHeader>

            {/* Introduction Card */}
            <Card className="border-none shadow-sm bg-gradient-to-br from-slate-900 to-slate-800 text-white">
                <CardContent className="pt-8">
                    <div className="flex flex-col md:flex-row gap-6 items-center">
                        <div className="h-20 w-20 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                            <Layers className="h-10 w-10 text-primary-foreground" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold mb-2">Un Workflow Intelligent</h2>
                            <p className="text-slate-300 leading-relaxed">
                                Finies les doubles saisies. Dans MAMISOUR CRM, vos documents comptables (Devis et Factures) sont les chefs d'orchestre de votre activité. 
                                Ce guide vous explique comment passer d'un simple contact à une vente réussie en un minimum de clics.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Steps Visualization */}
            <div className="grid gap-6">
                {steps.map((step, index) => (
                    <div key={index} className="relative group">
                        {index < steps.length - 1 && (
                            <div className="absolute left-8 top-16 bottom-0 w-0.5 bg-slate-100 group-hover:bg-primary/20 transition-colors hidden md:block" />
                        )}
                        
                        <Card className="border-border/60 hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex flex-col md:flex-row gap-6">
                                    <div className={`h-16 w-16 rounded-xl ${step.bgColor} flex items-center justify-center shrink-0`}>
                                        <step.icon className={`h-8 w-8 ${step.color}`} />
                                    </div>
                                    <div className="flex-1 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-lg font-bold">{step.title}</h3>
                                            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest bg-muted px-2 py-0.5 rounded">Étape {index + 1}</span>
                                        </div>
                                        <p className="text-muted-foreground leading-relaxed">
                                            {step.description}
                                        </p>
                                        
                                        {step.automation && (
                                            <div className="bg-primary/5 border border-primary/10 rounded-lg p-3 flex items-start gap-3">
                                                <Zap className="h-4 w-4 text-primary mt-0.5" />
                                                <p className="text-sm font-semibold text-primary">
                                                    {step.automation}
                                                </p>
                                            </div>
                                        )}
                                        
                                        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 italic">
                                            <Info className="h-3.3 w-3.5" />
                                            {step.details}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                ))}
            </div>

            {/* Footer Tip */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-8 flex items-center gap-6">
                <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-6 w-6 text-white" />
                </div>
                <div>
                    <h4 className="font-bold text-blue-900">Astuce de productivité</h4>
                    <p className="text-blue-700 text-sm mt-1">
                        Utilisez le bouton "Envoyer par email" sur vos factures pour que le CRM détecte l'envoi et mette à jour le statut en 'Envoyée' automatiquement.
                    </p>
                </div>
            </div>
        </div>
    )
}
