'use client'

import React, { useEffect, useState } from 'react'
import { Sparkles, ArrowRight, Lightbulb, Users, RefreshCw, BarChart3, Target, Calendar, ClipboardList, Database } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getAIAdvice } from '@/lib/actions/copilot'

export function AIAdvice() {
    const [advice, setAdvice] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    const fetchAdvice = async () => {
        setIsLoading(true)
        const result = await getAIAdvice()
        if (result.data) {
            setAdvice(result.data)
        }
        setIsLoading(false)
    }

    useEffect(() => {
        fetchAdvice()
    }, [])

    return (
        <Card className="overflow-hidden border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
            <CardContent className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex flex-col gap-3 flex-1">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-full">
                            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-0.5">Conseil IA du moment</p>
                            <p className="text-sm text-foreground">
                                {isLoading ? (
                                    <span className="opacity-50 animate-pulse italic">L'IA prépare votre prochain conseil...</span>
                                ) : (
                                    advice || "Bienvenue dans votre dashboard IA !"
                                )}
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <Button size="sm" className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 hover:translate-y-[-1px] transition-all" asChild>
                            <Link href="/dashboard/prospects" className="flex items-center gap-2 font-semibold">
                                <Users className="h-4 w-4" />
                                Voir mes prospects
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </Button>
                        <Button size="sm" variant="outline" className="border-primary/20 hover:bg-primary/5" asChild>
                            <Link href="/dashboard/leads" className="flex items-center gap-2">
                                <Lightbulb className="h-4 w-4 text-yellow-500" />
                                Trouver des clients
                            </Link>
                        </Button>
                    </div>
                </div>

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => fetchAdvice()}
                    disabled={isLoading}
                    className="self-end md:self-center shrink-0 rounded-full hover:bg-primary/10 h-8 w-8"
                >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
            </CardContent>
        </Card>
    )
}
