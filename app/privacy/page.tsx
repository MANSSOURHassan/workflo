'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen bg-background">
            <div className="container max-w-4xl py-12">
                <Button variant="ghost" asChild className="mb-8">
                    <Link href="/">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Retour à l'accueil
                    </Link>
                </Button>

                <h1 className="text-4xl font-bold text-foreground mb-8">Politique de Confidentialité</h1>

                <div className="prose prose-gray max-w-none space-y-8">
                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">1. Introduction</h2>
                        <p className="text-muted-foreground">
                            La présente politique de confidentialité décrit comment Workflow CRM collecte, utilise,
                            stocke et protège vos données personnelles conformément au Règlement Général sur la
                            Protection des Données (RGPD) et à la loi française Informatique et Libertés.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">2. Données collectées</h2>
                        <p className="text-muted-foreground">Nous collectons les types de données suivants :</p>
                        <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-2">
                            <li><strong>Données d'identification :</strong> nom, prénom, email, numéro de téléphone</li>
                            <li><strong>Données professionnelles :</strong> entreprise, fonction, secteur d'activité</li>
                            <li><strong>Données de connexion :</strong> adresse IP, logs de connexion, appareil utilisé</li>
                            <li><strong>Données d'utilisation :</strong> actions effectuées sur la plateforme</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">3. Finalités du traitement</h2>
                        <p className="text-muted-foreground">Vos données sont utilisées pour :</p>
                        <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-2">
                            <li>Fournir et améliorer nos services CRM</li>
                            <li>Gérer votre compte utilisateur</li>
                            <li>Vous envoyer des communications relatives au service</li>
                            <li>Assurer la sécurité de la plateforme</li>
                            <li>Respecter nos obligations légales</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">4. Base légale</h2>
                        <p className="text-muted-foreground">
                            Le traitement de vos données repose sur :
                        </p>
                        <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-2">
                            <li>L'exécution du contrat de service</li>
                            <li>Votre consentement explicite</li>
                            <li>Notre intérêt légitime à améliorer nos services</li>
                            <li>Le respect de nos obligations légales</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">5. Durée de conservation</h2>
                        <p className="text-muted-foreground">
                            Vos données sont conservées pendant la durée de votre abonnement, puis archivées pendant
                            une durée de 3 ans à compter de la fin de la relation commerciale, sauf obligation légale
                            de conservation plus longue.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">6. Vos droits</h2>
                        <p className="text-muted-foreground">Conformément au RGPD, vous disposez des droits suivants :</p>
                        <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-2">
                            <li><strong>Droit d'accès :</strong> obtenir une copie de vos données</li>
                            <li><strong>Droit de rectification :</strong> corriger vos données inexactes</li>
                            <li><strong>Droit à l'effacement :</strong> demander la suppression de vos données</li>
                            <li><strong>Droit à la portabilité :</strong> récupérer vos données dans un format structuré</li>
                            <li><strong>Droit d'opposition :</strong> vous opposer au traitement de vos données</li>
                            <li><strong>Droit à la limitation :</strong> limiter le traitement de vos données</li>
                        </ul>
                        <p className="text-muted-foreground mt-4">
                            Pour exercer ces droits, contactez-nous à : [email de contact]
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">7. Sécurité des données</h2>
                        <p className="text-muted-foreground">
                            Nous mettons en œuvre des mesures de sécurité appropriées pour protéger vos données :
                        </p>
                        <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-2">
                            <li>Chiffrement AES-256 des données au repos</li>
                            <li>Chiffrement TLS 1.3 pour les communications</li>
                            <li>Authentification sécurisée avec 2FA optionnel</li>
                            <li>Accès restreint aux données selon le principe du moindre privilège</li>
                            <li>Sauvegardes régulières et chiffrées</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">8. Transfert de données</h2>
                        <p className="text-muted-foreground">
                            Vos données peuvent être transférées vers des serveurs situés en dehors de l'UE.
                            Dans ce cas, nous nous assurons que des garanties appropriées sont en place
                            (clauses contractuelles types, certification Privacy Shield, etc.).
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">9. Cookies</h2>
                        <p className="text-muted-foreground">
                            Nous utilisons des cookies essentiels au fonctionnement du service et des cookies
                            analytiques pour améliorer votre expérience. Vous pouvez gérer vos préférences
                            de cookies dans les paramètres de votre navigateur.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">10. Contact DPO</h2>
                        <p className="text-muted-foreground">
                            Pour toute question concernant la protection de vos données, vous pouvez contacter
                            notre Délégué à la Protection des Données (DPO) :<br />
                            Email : dpo@[votre-domaine].com
                        </p>
                        <p className="text-muted-foreground mt-4">
                            Vous avez également le droit d'introduire une réclamation auprès de la CNIL
                            (Commission Nationale de l'Informatique et des Libertés).
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
