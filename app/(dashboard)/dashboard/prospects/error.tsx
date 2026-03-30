'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, RefreshCw, Database } from 'lucide-react'
import Link from 'next/link'

export default function ProspectsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="max-w-md w-full border-destructive/20 shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto bg-destructive/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-xl">Une erreur est survenue</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <p className="text-sm text-muted-foreground">
            Nous avons rencontré un problème lors du chargement des prospects. 
            Cela est souvent dû à des tables manquantes dans la base de données.
          </p>
          
          <div className="bg-muted p-4 rounded-lg text-left text-xs font-mono overflow-auto max-h-[100px]">
            {error.message || "Erreur de connexion à la base de données"}
          </div>

          <div className="flex flex-col gap-3">
            <Button onClick={() => reset()} className="w-full font-semibold">
              <RefreshCw className="mr-2 h-4 w-4" />
              Réessayer
            </Button>
            <Button asChild variant="secondary" className="w-full">
              <Link href="/dashboard/debug">
                <Database className="mr-2 h-4 w-4" />
                Diagnostiquer la base de données
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard">Retour au Tableau de Bord</Link>
            </Button>
          </div>

          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-2">
              <Database className="h-3 w-3" />
              Pensez à exécuter <code className="bg-muted px-1 rounded">final_repair.sql</code> dans Supabase
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
