import Link from "next/link"
import { ArrowRight, BarChart3, Users, Zap, Shield, Target, Mail, TrendingUp, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const features = [
  {
    title: "Gestion des prospects",
    description: "Centralisez tous vos contacts et prospects avec des fiches detaillees, historique d'interactions et scoring intelligent.",
    icon: Users,
  },
  {
    title: "Scoring IA",
    description: "Notre algorithme analyse vos prospects et attribue un score de qualification pour prioriser vos actions commerciales.",
    icon: Target,
  },
  {
    title: "Pipeline de ventes",
    description: "Visualisez vos opportunites avec une vue Kanban intuitive. Suivez chaque etape du cycle de vente.",
    icon: TrendingUp,
  },
  {
    title: "Campagnes marketing",
    description: "Creez et automatisez vos campagnes email, SMS et LinkedIn avec des templates personnalisables.",
    icon: Mail,
  },
  {
    title: "Rapports & Analytics",
    description: "Tableaux de bord en temps reel, rapports detailles et KPIs pour piloter votre activite commerciale.",
    icon: BarChart3,
  },
  {
    title: "Conforme RGPD",
    description: "Respectez la reglementation europeenne avec nos outils de gestion des consentements et d'export de donnees.",
    icon: Shield,
  },
]

const benefits = [
  "Interface intuitive, aucune formation requise",
  "Import/export CSV illimite",
  "Automatisation des taches repetitives",
  "Support client reactif",
  "Mises a jour regulieres",
  "API disponible pour les integrations",
]

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 md:px-6 flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center">
            <img src="/logo.png" alt="Workflow CRM" className="h-16 md:h-20 w-auto object-contain" />
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Fonctionnalites
            </Link>
            <Link href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Tarifs
            </Link>
            <Link href="/auth/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Connexion
            </Link>
            <Button asChild>
              <Link href="/auth/sign-up">
                Essai gratuit
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden py-20 md:py-32">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
          <div className="container mx-auto px-4 md:px-6 relative">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-4xl font-bold tracking-tight text-primary sm:text-5xl md:text-6xl text-balance">
                Gérez vos prospects avec l'intelligence artificielle
              </h1>
              <p className="mt-6 text-lg text-muted-foreground text-pretty">
                Workflow CRM est la solution SaaS polyvalente conçue pour les entreprises de tous secteurs d'activité.
                Centralisez vos contacts, automatisez vos processus et accélérez votre croissance avec une plateforme adaptable.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button size="lg" asChild>
                  <Link href="/auth/sign-up">
                    Demarrer gratuitement
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="#features">
                    Decouvrir les fonctionnalites
                  </Link>
                </Button>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                14 jours d'essai gratuit - Aucune carte bancaire requise
              </p>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-20 bg-muted/30">
          <div className="container mx-auto px-4 md:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">
                Tout ce dont vous avez besoin pour booster votre croissance
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Une suite complète d'outils adaptables pour gérer votre activité quel que soit votre domaine d'expertise.
              </p>
            </div>

            <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <Card key={feature.title} className="bg-card">
                  <CardHeader>
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-foreground">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-20">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid gap-12 lg:grid-cols-2 items-center">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  Pourquoi choisir Workflow CRM ?
                </h2>
                <p className="mt-4 text-lg text-muted-foreground">
                  Nous avons concu Workflow CRM pour etre simple, puissant et accessible a tous.
                </p>
                <ul className="mt-8 space-y-4">
                  {benefits.map((benefit) => (
                    <li key={benefit} className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                      <span className="text-foreground">{benefit}</span>
                    </li>
                  ))}
                </ul>
                <Button className="mt-8" asChild>
                  <Link href="/auth/sign-up">
                    Commencer maintenant
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <div className="relative">
                <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary/20 via-accent/20 to-primary/10 p-8">
                  <div className="h-full w-full rounded-xl bg-card shadow-xl border flex items-center justify-center">
                    <div className="text-center p-8">
                      <BarChart3 className="h-16 w-16 text-primary mx-auto mb-4" />
                      <h3 className="text-2xl font-bold text-foreground">+45%</h3>
                      <p className="text-muted-foreground">de productivite en moyenne</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-20 bg-muted/30">
          <div className="container mx-auto px-4 md:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">
                Des tarifs simples et transparents
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Choisissez l'offre adaptee a votre activite. Toutes les fonctionnalites incluses.
              </p>
            </div>

            <div className="mt-16 grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
              {/* Starter */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-foreground">Starter</CardTitle>
                  <CardDescription>Pour demarrer sereinement</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-foreground">19EUR</span>
                    <span className="text-muted-foreground">/mois</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span className="text-foreground">500 prospects</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span className="text-foreground">1 utilisateur</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span className="text-foreground">1 000 emails/mois</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span className="text-foreground">Support email</span>
                    </li>
                  </ul>
                  <Button className="w-full mt-6 bg-transparent" variant="outline" asChild>
                    <Link href="/auth/sign-up">Choisir Starter</Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Pro */}
              <Card className="border-primary relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                    Populaire
                  </span>
                </div>
                <CardHeader>
                  <CardTitle className="text-foreground">Pro</CardTitle>
                  <CardDescription>Pour les equipes en croissance</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-foreground">49EUR</span>
                    <span className="text-muted-foreground">/mois</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span className="text-foreground">5 000 prospects</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span className="text-foreground">5 utilisateurs</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span className="text-foreground">10 000 emails/mois</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span className="text-foreground">Scoring IA avance</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span className="text-foreground">Support prioritaire</span>
                    </li>
                  </ul>
                  <Button className="w-full mt-6" asChild>
                    <Link href="/auth/sign-up">Choisir Pro</Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Enterprise */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-foreground">Enterprise</CardTitle>
                  <CardDescription>Pour les grandes organisations</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-foreground">Sur devis</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span className="text-foreground">Prospects illimites</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span className="text-foreground">Utilisateurs illimites</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span className="text-foreground">API complete</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span className="text-foreground">SSO & SAML</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span className="text-foreground">Support dedie</span>
                    </li>
                  </ul>
                  <Button className="w-full mt-6 bg-transparent" variant="outline" asChild>
                    <Link href="/auth/sign-up">Nous contacter</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20">
          <div className="container mx-auto px-4 md:px-6">
            <div className="rounded-2xl bg-primary p-8 md:p-12 text-center">
              <h2 className="text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
                Prêt à booster votre activité ?
              </h2>
              <p className="mt-4 text-lg text-primary-foreground/80 max-w-2xl mx-auto">
                Rejoignez des milliers de professionnels qui utilisent Workflow CRM
                pour atteindre leurs objectifs plus rapidement.
              </p>
              <Button size="lg" variant="secondary" className="mt-8" asChild>
                <Link href="/auth/sign-up">
                  Commencer l'essai gratuit
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <Link href="/" className="flex items-center">
                <img src="/logo.png" alt="Workflow CRM" className="h-16 w-auto object-contain" />
              </Link>
              <p className="mt-4 text-sm text-muted-foreground">
                La solution CRM intelligente et universelle pour les entreprises de tous secteurs.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground">Produit</h4>
              <ul className="mt-4 space-y-2">
                <li><Link href="#features" className="text-sm text-muted-foreground hover:text-foreground">Fonctionnalites</Link></li>
                <li><Link href="#pricing" className="text-sm text-muted-foreground hover:text-foreground">Tarifs</Link></li>
                <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground">Integrations</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground">Support</h4>
              <ul className="mt-4 space-y-2">
                <li><Link href="/dashboard/support" className="text-sm text-muted-foreground hover:text-foreground">Centre d'aide</Link></li>
                <li><Link href="/dashboard/support" className="text-sm text-muted-foreground hover:text-foreground">FAQ</Link></li>
                <li><Link href="/dashboard/support" className="text-sm text-muted-foreground hover:text-foreground">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground">Légal</h4>
              <ul className="mt-4 space-y-2">
                <li><Link href="/legal" className="text-sm text-muted-foreground hover:text-foreground">Mentions légales</Link></li>
                <li><Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">Politique de confidentialité</Link></li>
                <li><Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground">CGU</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t pt-8 text-center">
            <p className="text-sm text-muted-foreground">
              © 2026 Workflow CRM. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
