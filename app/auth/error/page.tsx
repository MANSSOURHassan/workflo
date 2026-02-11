import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, TrendingUp } from 'lucide-react'

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-muted/30">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
          </div>
          <div className="flex items-center justify-center gap-2">
            <img src="/logo.png" alt="Workflow CRM" className="h-10 w-auto object-contain" />
            <span className="font-bold">Workflow CRM</span>
          </div>
          <CardTitle className="text-2xl font-bold">Erreur d&apos;authentification</CardTitle>
          <CardDescription className="text-base">
            Une erreur est survenue lors de la connexion. Veuillez réessayer.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Si le problème persiste, contactez notre support technique.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button asChild className="w-full">
            <Link href="/auth/login">Retour à la connexion</Link>
          </Button>
          <Button asChild variant="outline" className="w-full bg-transparent">
            <Link href="/support">Contacter le support</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
