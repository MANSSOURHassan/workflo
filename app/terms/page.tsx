'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-background">
            <div className="container max-w-4xl py-12">
                <Button variant="ghost" asChild className="mb-8">
                    <Link href="/">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Retour à l'accueil
                    </Link>
                </Button>

                <h1 className="text-4xl font-bold text-foreground mb-8">Conditions Générales d'Utilisation</h1>

                <div className="prose prose-gray max-w-none space-y-8">
                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">1. Objet</h2>
                        <p className="text-muted-foreground">
                            Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation
                            de la plateforme Workflow CRM, un service de gestion de la relation client proposé en
                            mode SaaS (Software as a Service).
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">2. Acceptation des conditions</h2>
                        <p className="text-muted-foreground">
                            L'utilisation de Workflow CRM implique l'acceptation pleine et entière des présentes CGU.
                            Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser notre service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">3. Description du service</h2>
                        <p className="text-muted-foreground">Workflow CRM offre les fonctionnalités suivantes :</p>
                        <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-2">
                            <li>Gestion centralisée des prospects et contacts</li>
                            <li>Scoring intelligent des leads par intelligence artificielle</li>
                            <li>Gestion du pipeline commercial</li>
                            <li>Automatisation des campagnes marketing</li>
                            <li>Tableaux de bord et analytics</li>
                            <li>Intégrations avec outils tiers</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">4. Inscription et compte</h2>
                        <p className="text-muted-foreground">
                            Pour utiliser Workflow CRM, vous devez créer un compte en fournissant des informations
                            exactes et à jour. Vous êtes responsable de la confidentialité de vos identifiants et
                            de toutes les activités effectuées sous votre compte.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">5. Abonnements et tarification</h2>
                        <p className="text-muted-foreground">
                            Workflow CRM propose différentes formules d'abonnement (Starter, Pro, Enterprise).
                            Les tarifs sont indiqués sur notre page de tarification. Les abonnements sont
                            renouvelés automatiquement sauf résiliation préalable.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">6. Utilisation acceptable</h2>
                        <p className="text-muted-foreground">Vous vous engagez à :</p>
                        <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-2">
                            <li>Respecter la législation en vigueur, notamment le RGPD</li>
                            <li>Ne pas utiliser le service à des fins illégales ou non autorisées</li>
                            <li>Ne pas tenter de compromettre la sécurité du service</li>
                            <li>Ne pas envoyer de spam ou de contenu malveillant</li>
                            <li>Respecter les droits de propriété intellectuelle</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">7. Propriété intellectuelle</h2>
                        <p className="text-muted-foreground">
                            Tous les droits de propriété intellectuelle relatifs à Workflow CRM (logiciel, design,
                            marques, etc.) restent la propriété exclusive de [Nom de la société]. Vous obtenez
                            uniquement une licence d'utilisation non exclusive et non transférable.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">8. Données utilisateur</h2>
                        <p className="text-muted-foreground">
                            Vous restez propriétaire de toutes les données que vous importez ou créez dans
                            Workflow CRM. Nous nous engageons à protéger ces données conformément à notre
                            <Link href="/privacy" className="text-primary hover:underline"> Politique de Confidentialité</Link>.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">9. Disponibilité du service</h2>
                        <p className="text-muted-foreground">
                            Nous nous efforçons de maintenir une disponibilité de 99,9% du service. Des interruptions
                            peuvent survenir pour maintenance ou mises à jour. Nous vous informerons à l'avance
                            dans la mesure du possible.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">10. Limitation de responsabilité</h2>
                        <p className="text-muted-foreground">
                            Workflow CRM est fourni "tel quel". Nous ne garantissons pas que le service sera
                            ininterrompu ou exempt d'erreurs. Notre responsabilité est limitée au montant des
                            abonnements payés au cours des 12 derniers mois.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">11. Résiliation</h2>
                        <p className="text-muted-foreground">
                            Vous pouvez résilier votre abonnement à tout moment depuis les paramètres de votre compte.
                            La résiliation prendra effet à la fin de la période d'abonnement en cours. Nous nous
                            réservons le droit de suspendre ou résilier votre compte en cas de violation des présentes CGU.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">12. Modifications des CGU</h2>
                        <p className="text-muted-foreground">
                            Nous nous réservons le droit de modifier ces CGU à tout moment. Les modifications
                            seront notifiées par email ou via la plateforme. La poursuite de l'utilisation du
                            service après modification vaut acceptation des nouvelles conditions.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">13. Droit applicable</h2>
                        <p className="text-muted-foreground">
                            Les présentes CGU sont régies par le droit français. Tout litige sera soumis aux
                            tribunaux compétents de [Ville].
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">14. Contact</h2>
                        <p className="text-muted-foreground">
                            Pour toute question concernant ces CGU :<br />
                            Email : contact@[votre-domaine].com<br />
                            Adresse : [Adresse postale]
                        </p>
                    </section>
                </div>

                <p className="text-sm text-muted-foreground mt-12">
                    Dernière mise à jour : Janvier 2026
                </p>
            </div>
        </div>
    )
}
