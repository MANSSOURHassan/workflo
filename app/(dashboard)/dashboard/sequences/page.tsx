import { Suspense } from 'react'
import { getSequences } from '@/lib/actions/sequences'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Play, Pause, MoreHorizontal, Mail, Clock, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

export default async function SequencesPage() {
    const { data: sequences, error } = await getSequences()

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Séquences Automatisées</h1>
                    <p className="text-muted-foreground">
                        Automatisez votre prospection avec des séquences d'emails et de tâches.
                    </p>
                </div>
                <Button asChild>
                    <Link href="/dashboard/sequences/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Nouvelle Séquence
                    </Link>
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {sequences?.length === 0 ? (
                    <Card className="col-span-full py-12">
                        <CardContent className="flex flex-col items-center justify-center text-center">
                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                                <Mail className="h-6 w-6 text-primary" />
                            </div>
                            <h3 className="text-lg font-semibold">Aucune séquence</h3>
                            <p className="text-muted-foreground max-w-sm mb-6">
                                Créez votre première séquence pour automatiser vos relances et gagner du temps.
                            </p>
                            <Button asChild variant="outline">
                                <Link href="/dashboard/sequences/new">Démarrer maintenant</Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    sequences?.map((sequence) => (
                        <Card key={sequence.id} className="group hover:shadow-md transition-shadow">
                            <CardHeader className="pb-2">
                                <div className="flex items-start justify-between">
                                    <Badge variant={sequence.is_active ? "default" : "secondary"}>
                                        {sequence.is_active ? "Active" : "Brouillon"}
                                    </Badge>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </div>
                                <CardTitle className="mt-2">{sequence.name}</CardTitle>
                                <CardDescription className="line-clamp-2">
                                    {sequence.description || "Aucune description"}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                                    <div className="flex items-center gap-1">
                                        <CheckCircle2 className="h-4 w-4" />
                                        <span>{sequence.steps?.length || 0} étapes</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Clock className="h-4 w-4" />
                                        <span>{sequence.enrollments_count || 0} inscrits</span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button className="flex-1" variant="outline" asChild>
                                        <Link href={`/dashboard/sequences/${sequence.id}`}>Modifier</Link>
                                    </Button>
                                    <Button size="icon" variant={sequence.is_active ? "outline" : "default"}>
                                        {sequence.is_active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
