import { Suspense } from 'react'
import Link from 'next/link'
import { SearchPageInput } from '@/components/dashboard/search-page-input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { globalSearch, SearchResult } from '@/lib/actions/search'
import { User, Building2, Mail, FileText, ArrowRight, ArrowLeft, Search as SearchIcon } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function SearchPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string }>
}) {
    const { q } = await searchParams
    const query = q || ''

    let results: SearchResult[] = []
    if (query) {
        const { data } = await globalSearch(query)
        results = data || []
    }

    const prospects = results.filter(r => r.type === 'prospect')
    const deals = results.filter(r => r.type === 'deal')
    const campaigns = results.filter(r => r.type === 'campaign')
    const others = results.filter(r => !['prospect', 'deal', 'campaign'].includes(r.type))

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Recherche</h1>
                    <p className="text-muted-foreground">
                        Trouvez rapidement ce que vous cherchez dans votre CRM
                    </p>
                </div>
            </div>

            <div className="mb-8">
                <Suspense fallback={<div className="h-12 bg-muted rounded animate-pulse" />}>
                    <SearchPageInput />
                </Suspense>
            </div>

            {!query ? (
                <div className="text-center py-20 text-muted-foreground">
                    <SearchIcon className="h-16 w-16 mx-auto mb-4 opacity-10" />
                    <h2 className="text-lg font-medium mb-1">Commencez votre recherche</h2>
                    <p>Tapez un nom, une entreprise ou un montant pour voir les résultats.</p>
                </div>
            ) : results.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground">
                    <SearchIcon className="h-16 w-16 mx-auto mb-4 opacity-10" />
                    <h2 className="text-lg font-medium mb-1">Aucun résultat trouvé</h2>
                    <p>Essayez avec d'autres mots-clés ou vérifiez l'orthographe.</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Prospects */}
                    {prospects.length > 0 && (
                        <section>
                            <div className="flex items-center gap-2 mb-4">
                                <User className="h-5 w-5 text-primary" />
                                <h2 className="text-xl font-semibold">Prospects ({prospects.length})</h2>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {prospects.map(result => (
                                    <ResultCard key={result.id} result={result} icon={User} />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Deals */}
                    {deals.length > 0 && (
                        <section>
                            <div className="flex items-center gap-2 mb-4">
                                <Building2 className="h-5 w-5 text-primary" />
                                <h2 className="text-xl font-semibold">Opportunités ({deals.length})</h2>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {deals.map(result => (
                                    <ResultCard key={result.id} result={result} icon={Building2} />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Campaigns */}
                    {campaigns.length > 0 && (
                        <section>
                            <div className="flex items-center gap-2 mb-4">
                                <Mail className="h-5 w-5 text-primary" />
                                <h2 className="text-xl font-semibold">Campagnes ({campaigns.length})</h2>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {campaigns.map(result => (
                                    <ResultCard key={result.id} result={result} icon={Mail} />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Others */}
                    {others.length > 0 && (
                        <section>
                            <div className="flex items-center gap-2 mb-4">
                                <FileText className="h-5 w-5 text-primary" />
                                <h2 className="text-xl font-semibold">Autres ({others.length})</h2>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {others.map(result => (
                                    <ResultCard key={result.id} result={result} icon={FileText} />
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            )}
        </div>
    )
}

function ResultCard({ result, icon: Icon }: { result: any, icon: any }) {
    return (
        <Link href={result.url} className="block group">
            <Card className="h-full transition-colors hover:border-primary/50 hover:bg-muted/30">
                <CardHeader className="p-4">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                <Icon className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle className="text-base line-clamp-1">{result.title}</CardTitle>
                                {result.subtitle && (
                                    <CardDescription className="line-clamp-1">{result.subtitle}</CardDescription>
                                )}
                            </div>
                        </div>
                    </div>
                </CardHeader>
                {result.status && (
                    <CardContent className="p-4 pt-0">
                        <Badge variant="outline" className="text-xs font-normal">
                            {result.status}
                        </Badge>
                    </CardContent>
                )}
            </Card>
        </Link>
    )
}
