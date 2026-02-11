'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function MentionsLegalesPage() {
    return (
        <div className="min-h-screen bg-background">
            <div className="container max-w-4xl py-12">
                <Button variant="ghost" asChild className="mb-8">
                    <Link href="/">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Retour à l'accueil
                    </Link>
                </Button>

                <h1 className="text-4xl font-bold text-foreground mb-8">Mentions Légales</h1>

                <div className="prose prose-gray max-w-none space-y-8">
                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">1. Éditeur du site</h2>
                        <p className="text-muted-foreground">
                            Le site Workflow CRM est édité par :<br />
                            <strong>[Nom de votre société]</strong><br />
                            [Forme juridique] au capital de [montant] euros<br />
                            Siège social : [Adresse complète]<br />
                            RCS : [Ville] [Numéro]<br />
                            SIRET : [Numéro SIRET]<br />
                            TVA Intracommunautaire : [Numéro TVA]<br />
                            Directeur de la publication : [Nom du responsable]
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">2. Hébergement</h2>
                        <p className="text-muted-foreground">
                            Le site est hébergé par :<br />
                            Vercel Inc.<br />
                            440 N Barranca Ave #4133<br />
                            Covina, CA 91723, États-Unis<br />
                            <br />
                            Base de données hébergée par :<br />
                            Supabase Inc.<br />
                            970 Toa Payoh North #07-04<br />
                            Singapore 318992
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">3. Propriété intellectuelle</h2>
                        <p className="text-muted-foreground">
                            L'ensemble du contenu de ce site (textes, images, vidéos, logos, icônes, sons, logiciels, etc.)
                            est protégé par le droit d'auteur et le droit des marques. Toute reproduction, représentation,
                            modification, publication, ou adaptation de tout ou partie des éléments du site, quel que soit
                            le moyen ou le procédé utilisé, est interdite, sauf autorisation écrite préalable.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">4. Protection des données personnelles</h2>
                        <p className="text-muted-foreground">
                            Conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique
                            et Libertés, vous disposez d'un droit d'accès, de rectification, de suppression et d'opposition
                            aux données personnelles vous concernant. Pour exercer ces droits, veuillez nous contacter à
                            l'adresse : [email de contact].
                        </p>
                        <p className="text-muted-foreground mt-4">
                            Pour plus d'informations, consultez notre{' '}
                            <Link href="/privacy" className="text-primary hover:underline">
                                Politique de Confidentialité
                            </Link>.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">5. Cookies</h2>
                        <p className="text-muted-foreground">
                            Ce site utilise des cookies pour améliorer l'expérience utilisateur et à des fins statistiques.
                            En poursuivant votre navigation, vous acceptez l'utilisation de cookies conformément à notre
                            politique de cookies.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">6. Contact</h2>
                        <p className="text-muted-foreground">
                            Pour toute question concernant ces mentions légales, vous pouvez nous contacter :<br />
                            Email : [email de contact]<br />
                            Téléphone : [numéro de téléphone]<br />
                            Formulaire de contact : <Link href="/dashboard/support" className="text-primary hover:underline">Page Support</Link>
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
