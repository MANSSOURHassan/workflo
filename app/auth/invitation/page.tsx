'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, CheckCircle2, XCircle, Users, LogIn } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

function InvitationContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const token = searchParams.get('token')

    const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'login_required'>('loading')
    const [message, setMessage] = useState('')

    useEffect(() => {
        if (!token) {
            setStatus('error')
            setMessage('Lien d\'invitation invalide ou manquant.')
            return
        }

        async function acceptInvitation() {
            try {
                const res = await fetch('/api/team/invite/accept', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token }),
                })

                let data: any = {}
                try {
                    data = await res.json()
                } catch {
                    setStatus('error')
                    setMessage('Réponse invalide du serveur. Réessayez.')
                    return
                }

                if (res.status === 401 || data.requiresLogin) {
                    // Rediriger vers login puis revenir ici
                    setStatus('login_required')
                    setMessage('Vous devez vous connecter ou créer un compte pour accepter cette invitation.')
                } else if (!res.ok) {
                    setStatus('error')
                    setMessage(data.error || 'Erreur lors de l\'acceptation de l\'invitation')
                } else {
                    setStatus('success')
                    setMessage(data.message || 'Invitation acceptée avec succès !')
                    setTimeout(() => router.push('/dashboard'), 3000)
                }
            } catch (err) {
                console.error('Fetch error:', err)
                setStatus('error')
                setMessage('Erreur de connexion au serveur. Vérifiez que vous êtes connecté à internet.')
            }
        }

        acceptInvitation()
    }, [token, router])

    const loginUrl = `/auth/login?next=${encodeURIComponent(`/auth/invitation?token=${token}`)}`

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-primary/5 p-4">
            <Card className="w-full max-w-md shadow-xl border-border/50">
                <CardHeader className="text-center pb-2">
                    <div className="flex justify-center mb-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                            <Users className="h-8 w-8 text-primary" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl">Invitation d&apos;équipe</CardTitle>
                    <CardDescription>Workflow CRM</CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-6 pt-4">

                    {status === 'loading' && (
                        <div className="space-y-3">
                            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                            <p className="text-muted-foreground">Vérification de votre invitation…</p>
                        </div>
                    )}

                    {status === 'login_required' && (
                        <div className="space-y-4">
                            <div className="flex justify-center">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                                    <LogIn className="h-8 w-8 text-blue-600" />
                                </div>
                            </div>
                            <div>
                                <p className="font-semibold text-blue-700 text-lg">Connexion requise</p>
                                <p className="text-muted-foreground text-sm mt-1">{message}</p>
                            </div>
                            <div className="space-y-2">
                                <Button asChild className="w-full">
                                    <Link href={loginUrl}>Se connecter</Link>
                                </Button>
                                <Button variant="outline" asChild className="w-full bg-transparent">
                                    <Link href={`/auth/sign-up?next=${encodeURIComponent(`/auth/invitation?token=${token}`)}`}>
                                        Créer un compte
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="space-y-4">
                            <div className="flex justify-center">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                                </div>
                            </div>
                            <div>
                                <p className="font-semibold text-green-700 text-lg">Bienvenue dans l&apos;équipe !</p>
                                <p className="text-muted-foreground text-sm mt-1">{message}</p>
                                <p className="text-muted-foreground text-xs mt-2">Redirection dans quelques secondes…</p>
                            </div>
                            <Button asChild className="w-full">
                                <Link href="/dashboard">Aller au dashboard</Link>
                            </Button>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="space-y-4">
                            <div className="flex justify-center">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                                    <XCircle className="h-8 w-8 text-red-600" />
                                </div>
                            </div>
                            <div>
                                <p className="font-semibold text-red-700 text-lg">Invitation invalide</p>
                                <p className="text-muted-foreground text-sm mt-1">{message}</p>
                            </div>
                            <div className="space-y-2">
                                <Button asChild className="w-full">
                                    <Link href="/dashboard">Aller au dashboard</Link>
                                </Button>
                                <Button variant="outline" asChild className="w-full bg-transparent">
                                    <Link href="/auth/login">Se connecter</Link>
                                </Button>
                            </div>
                        </div>
                    )}

                </CardContent>
            </Card>
        </div>
    )
}

export default function InvitationPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center p-4"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
            <InvitationContent />
        </Suspense>
    )
}
