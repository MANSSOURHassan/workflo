'use client'

import React, { useEffect, useState } from 'react'
import { Sparkles, RefreshCw } from 'lucide-react'
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
            <CardContent className="p-4 flex items-center justify-between gap-4">
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
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={fetchAdvice}
                    disabled={isLoading}
                    className="shrink-0 rounded-full hover:bg-primary/10 h-8 w-8"
                >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
            </CardContent>
        </Card>
    )
}
