'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { resetPassword } from '@/lib/actions/auth'
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react'

export default function ForgotPasswordPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isSubmitted, setIsSubmitted] = useState(false)

    async function handleSubmit(formData: FormData) {
        setIsLoading(true)
        setError(null)

        const result = await resetPassword(formData)

        if (result?.error) {
            setError(result.error)
            setIsLoading(false)
        } else {
            setIsSubmitted(true)
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-8 bg-slate-50">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <div className="flex items-center gap-2 mb-4">
                        <img src="/logo.png" alt="Workflow CRM" className="h-10 w-auto object-contain" />
                        <span className="font-bold text-lg">Workflow CRM</span>
                    </div>
                    <CardTitle className="text-2xl font-bold">Réinitialisation</CardTitle>
                    <CardDescription>
                        {isSubmitted
                            ? "Si un compte existe pour cet email, vous recevrez un lien de réinitialisation."
                            : "Entrez votre adresse email pour recevoir un lien de réinitialisation."}
                    </CardDescription>
                </CardHeader>

                {!isSubmitted ? (
                    <form action={handleSubmit}>
                        <CardContent className="space-y-4">
                            {error && (
                                <div className="p-3 text-sm text-destructive-foreground bg-destructive/10 border border-destructive/20 rounded-lg">
                                    {error}
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="email">Email professionnel</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder="nom@entreprise.com"
                                        className="pl-10"
                                        required
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-4">
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Envoi en cours...
                                    </>
                                ) : (
                                    'Envoyer le lien'
                                )}
                            </Button>
                            <Link
                                href="/auth/login"
                                className="flex items-center justify-center text-sm text-muted-foreground hover:text-primary transition-colors"
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Retour à la connexion
                            </Link>
                        </CardFooter>
                    </form>
                ) : (
                    <CardContent className="space-y-6 pt-4">
                        <div className="flex flex-col items-center text-center space-y-3">
                            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                                <CheckCircle2 className="h-6 w-6 text-green-600" />
                            </div>
                            <h3 className="font-semibold text-lg">Vérifiez votre boîte mail</h3>
                            <p className="text-sm text-muted-foreground">
                                Nous avons envoyé un lien de réinitialisation à votre adresse email.
                                Pensez à vérifier vos courriers indésirables (spams).
                            </p>
                        </div>
                        <Button asChild className="w-full" variant="outline">
                            <Link href="/auth/login">Retour à la connexion</Link>
                        </Button>
                    </CardContent>
                )}
            </Card>
        </div>
    )
}
