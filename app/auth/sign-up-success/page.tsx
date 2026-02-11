import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, TrendingUp, CheckCircle2 } from 'lucide-react'

export default function SignUpSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-muted/30">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
          </div>
          <div className="flex items-center justify-center gap-2">
            <img src="/logo.png" alt="Workflow CRM" className="h-10 w-auto object-contain" />
            <span className="font-bold">Workflow CRM</span>
          </div>
          <CardTitle className="text-2xl font-bold">Vérifiez votre email</CardTitle>
          <CardDescription className="text-base">
            Nous avons envoyé un lien de confirmation à votre adresse email.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center gap-3 p-4 bg-muted rounded-lg">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Cliquez sur le lien dans l&apos;email pour activer votre compte
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Si vous ne trouvez pas l&apos;email, vérifiez votre dossier spam ou courrier indésirable.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button asChild variant="outline" className="w-full bg-transparent">
            <Link href="/auth/login">Retour à la connexion</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
