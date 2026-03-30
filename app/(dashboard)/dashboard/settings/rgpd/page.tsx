'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    Shield,
    Download,
    Trash2,
    Eye,
    FileText,
    CheckCircle,
    AlertTriangle,
    Clock,
    Loader2
} from 'lucide-react'
import { exportUserData, deleteUserAccount } from '@/lib/actions/settings'
import { toast } from 'sonner'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RGPDPage() {
    const [isExporting, setIsExporting] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const router = useRouter()

    async function handleExport() {
        setIsExporting(true)
        try {
            const { data, error } = await exportUserData()
            if (error) {
                toast.error('Erreur lors de l\'export')
            } else if (data) {
                // Create download link
                const blob = new Blob([data], { type: 'application/json' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `workflow-crm-export-${new Date().toISOString().split('T')[0]}.json`
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                URL.revokeObjectURL(url)
                toast.success('Export réussi')
            }
        } catch (error) {
            toast.error('Erreur inattendue')
        } finally {
            setIsExporting(false)
        }
    }

    async function handleDeleteAccount() {
        const confirmText = prompt('Pour confirmer la suppression, tapez "SUPPRIMER" :')
        if (confirmText !== 'SUPPRIMER') return

        setIsDeleting(true)
        try {
            const { success, error } = await deleteUserAccount()
            if (error) {
                toast.error(error)
            } else {
                toast.success('Compte supprimé')
                router.push('/')
            }
        } catch (error) {
            toast.error('Erreur inattendue')
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <div className="p-6 space-y-6">

            {/* Statut de conformité */}
            <Card className="border-success/50 bg-success/5">
                <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-success/20">
                            <CheckCircle className="h-6 w-6 text-success" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-success">Conforme RGPD</h3>
                            <p className="text-sm text-muted-foreground">
                                Votre utilisation de Workflow CRM est conforme aux exigences du RGPD
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Vos droits */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-primary" />
                        Vos droits RGPD
                    </CardTitle>
                    <CardDescription>
                        Conformément au Règlement Général sur la Protection des Données
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                    <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-3 mb-2">
                            <Eye className="h-5 w-5 text-primary" />
                            <h4 className="font-medium">Droit d'accès</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Vous pouvez demander une copie de toutes vos données personnelles
                        </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-3 mb-2">
                            <FileText className="h-5 w-5 text-primary" />
                            <h4 className="font-medium">Droit de rectification</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Vous pouvez modifier vos informations à tout moment
                        </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-3 mb-2">
                            <Trash2 className="h-5 w-5 text-primary" />
                            <h4 className="font-medium">Droit à l'effacement</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Vous pouvez demander la suppression de vos données
                        </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-3 mb-2">
                            <Download className="h-5 w-5 text-primary" />
                            <h4 className="font-medium">Droit à la portabilité</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Vous pouvez exporter vos données dans un format standard
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Actions */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Exporter mes données</CardTitle>
                        <CardDescription>
                            Téléchargez une copie de toutes vos données personnelles
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            L'export inclut : vos informations de profil, prospects, opportunités,
                            campagnes, et historique d'activité.
                        </p>
                        <div className="flex gap-2">
                            <Button variant="outline">
                                <Download className="h-4 w-4 mr-2" />
                                Export CSV
                            </Button>
                            <Button variant="outline" onClick={handleExport} disabled={isExporting}>
                                {isExporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                                Export JSON (Complet)
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-destructive/30">
                    <CardHeader>
                        <CardTitle className="text-destructive">Supprimer mon compte</CardTitle>
                        <CardDescription>
                            Suppression définitive de toutes vos données
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-start gap-3 p-3 bg-destructive/10 rounded-lg">
                            <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                            <div className="text-sm">
                                <p className="font-medium text-destructive">Action irréversible</p>
                                <p className="text-muted-foreground">
                                    Toutes vos données seront définitivement supprimées et ne pourront pas être récupérées.
                                </p>
                            </div>
                        </div>
                        <Button variant="destructive" onClick={handleDeleteAccount} disabled={isDeleting}>
                            {isDeleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                            Supprimer mon compte
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Consentements */}
            <Card>
                <CardHeader>
                    <CardTitle>Gestion des consentements</CardTitle>
                    <CardDescription>
                        Gérez vos préférences de communication et de traitement des données
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                            <h4 className="font-medium">Emails de service</h4>
                            <p className="text-sm text-muted-foreground">
                                Notifications importantes concernant votre compte
                            </p>
                        </div>
                        <span className="text-sm text-muted-foreground">Obligatoire</span>
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                            <h4 className="font-medium">Newsletter produit</h4>
                            <p className="text-sm text-muted-foreground">
                                Nouveautés et mises à jour de Workflow CRM
                            </p>
                        </div>
                        <Button variant="outline" size="sm">Se désabonner</Button>
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                            <h4 className="font-medium">Communications marketing</h4>
                            <p className="text-sm text-muted-foreground">
                                Offres promotionnelles et événements
                            </p>
                        </div>
                        <Button variant="outline" size="sm">Se désabonner</Button>
                    </div>
                </CardContent>
            </Card>

            {/* Historique des demandes */}
            <Card>
                <CardHeader>
                    <CardTitle>Historique des demandes RGPD</CardTitle>
                    <CardDescription>
                        Suivi de vos demandes liées à vos droits
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                        <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Aucune demande RGPD en cours</p>
                    </div>
                </CardContent>
            </Card>

            {/* Contact DPO */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-medium">Contacter le DPO</h4>
                            <p className="text-sm text-muted-foreground">
                                Pour toute question relative à la protection de vos données
                            </p>
                        </div>
                        <Button variant="outline">
                            Contacter le DPO
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
