'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { signUp, signInWithGoogle } from '@/lib/actions/auth'
import {
  Loader2, Mail, Lock, User, Building2, Check, Globe,
  Zap, Crown, Rocket, ArrowLeft, ArrowRight, Eye, EyeOff
} from 'lucide-react'
import { PLANS } from '@/lib/config/plans'

const planDetails = [
  {
    key: 'starter',
    name: 'Starter',
    price: '19',
    icon: Zap,
    color: 'border-slate-200 hover:border-slate-400',
    selectedColor: 'border-primary bg-primary/5',
    badgeColor: 'bg-slate-100 text-slate-700',
    description: 'Idéal pour les indépendants',
    features: PLANS.starter.features,
  },
  {
    key: 'pro',
    name: 'Pro',
    price: '49',
    icon: Rocket,
    color: 'border-primary/30 hover:border-primary',
    selectedColor: 'border-primary bg-primary/5',
    badgeColor: 'bg-primary/10 text-primary',
    description: 'Pour les équipes en croissance',
    popular: true,
    features: PLANS.pro.features,
  },
  {
    key: 'enterprise',
    name: 'Enterprise',
    price: '139',
    icon: Crown,
    color: 'border-amber-200 hover:border-amber-400',
    selectedColor: 'border-amber-500 bg-amber-50/50',
    badgeColor: 'bg-amber-100 text-amber-700',
    description: 'Pour les grandes entreprises',
    features: PLANS.enterprise.features,
  },
]

export default function SignUpPage() {
  const [step, setStep] = useState<1 | 2>(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<string>('starter')
  const [showPassword, setShowPassword] = useState(false)

  // Données étape 1 stockées pour étape 2
  const [formValues, setFormValues] = useState({
    firstName: '',
    lastName: '',
    companyName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  function handleStep1Submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (formValues.password !== formValues.confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }
    if (formValues.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères')
      return
    }
    if (!formValues.email.includes('@')) {
      setError('Email invalide')
      return
    }

    setStep(2)
  }

  async function handleStep2Submit() {
    setIsLoading(true)
    setError(null)

    const formData = new FormData()
    formData.set('firstName', formValues.firstName)
    formData.set('lastName', formValues.lastName)
    formData.set('companyName', formValues.companyName)
    formData.set('email', formValues.email)
    formData.set('password', formValues.password)
    formData.set('confirmPassword', formValues.confirmPassword)
    formData.set('plan', selectedPlan)

    const result = await signUp(formData)
    if (result?.error) {
      setError(result.error)
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side */}
      <div className="hidden lg:flex lg:w-1/2 bg-sidebar text-sidebar-foreground flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Workflow CRM" className="h-16 w-auto object-contain" />
          <span className="text-2xl font-bold">Workflow CRM</span>
        </div>

        <div className="space-y-8">
          <h1 className="text-4xl font-bold leading-tight text-balance">
            {step === 1 ? 'Commencez et développez votre activité' : 'Choisissez le plan adapté à votre croissance'}
          </h1>

          {/* Stepper */}
          <div className="space-y-4">
            {[{ n: 1, label: 'Vos informations' }, { n: 2, label: 'Votre plan' }].map(({ n, label }) => (
              <div key={n} className="flex items-center gap-3">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full font-semibold text-sm transition-colors ${step >= n ? 'bg-primary text-primary-foreground' : 'bg-white/20 text-white/50'}`}>
                  {step > n ? <Check className="h-4 w-4" /> : n}
                </div>
                <span className={step >= n ? 'font-medium' : 'text-sidebar-foreground/50'}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-sm text-sidebar-foreground/60">
          Essai gratuit de 14 jours, sans carte bancaire
        </p>
      </div>

      {/* Right side */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-lg">
          {/* Mobile logo */}
          <div className="flex justify-center mb-6 lg:hidden">
            <img src="/logo.png" alt="Workflow CRM" className="h-16 w-auto object-contain" />
          </div>

          {/* Mobile stepper */}
          <div className="flex items-center justify-center gap-2 mb-6 lg:hidden">
            <div className={`h-2 w-16 rounded-full transition-colors ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`h-2 w-16 rounded-full transition-colors ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
          </div>

          {/* ─── ÉTAPE 1 : Infos ─── */}
          {step === 1 && (
            <Card className="border-0 shadow-none lg:border lg:shadow-sm">
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold text-primary">Créer un compte</CardTitle>
                <CardDescription>Étape 1 / 2 — Vos informations</CardDescription>
              </CardHeader>
              <form onSubmit={handleStep1Submit}>
                <CardContent className="space-y-4">
                  {error && (
                    <div className="p-3 text-sm text-destructive-foreground bg-destructive/10 border border-destructive/20 rounded-lg">
                      {error}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Prénom</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="firstName" placeholder="Jean" className="pl-10" required
                          value={formValues.firstName}
                          onChange={e => setFormValues({ ...formValues, firstName: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Nom</Label>
                      <Input id="lastName" placeholder="Dupont" required
                        value={formValues.lastName}
                        onChange={e => setFormValues({ ...formValues, lastName: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Entreprise</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="companyName" placeholder="Ma Société SAS" className="pl-10"
                        value={formValues.companyName}
                        onChange={e => setFormValues({ ...formValues, companyName: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email professionnel</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="email" type="email" placeholder="jean@entreprise.com" className="pl-10" required
                        value={formValues.email}
                        onChange={e => setFormValues({ ...formValues, email: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Mot de passe</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="8 caractères minimum" className="pl-10 pr-10" required
                        value={formValues.password}
                        onChange={e => setFormValues({ ...formValues, password: e.target.value })}
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="confirmPassword" type="password" placeholder="Confirmez votre mot de passe" className="pl-10" required
                        value={formValues.confirmPassword}
                        onChange={e => setFormValues({ ...formValues, confirmPassword: e.target.value })}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    En créant un compte, vous acceptez nos{' '}
                    <Link href="/terms" className="text-primary hover:underline">Conditions d&apos;utilisation</Link>{' '}
                    et notre{' '}
                    <Link href="/privacy" className="text-primary hover:underline">Politique de confidentialité</Link>.
                  </p>
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                  <Button type="submit" className="w-full">
                    Suivant — Choisir mon plan
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <div className="relative my-2">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">Ou continuer avec</span>
                    </div>
                  </div>
                  <Button type="button" variant="outline" className="w-full"
                    onClick={async () => {
                      setError(null)
                      const result = await signInWithGoogle()
                      if (result?.error) setError(result.error)
                    }}
                  >
                    <Globe className="mr-2 h-4 w-4" />
                    S&apos;inscrire avec Google
                  </Button>
                  <p className="text-sm text-center text-muted-foreground">
                    Déjà un compte ?{' '}
                    <Link href="/auth/login" className="text-primary hover:underline font-medium">Se connecter</Link>
                  </p>
                </CardFooter>
              </form>
            </Card>
          )}

          {/* ─── ÉTAPE 2 : Choix du plan ─── */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-primary">Choisissez votre plan</h2>
                <p className="text-muted-foreground text-sm mt-1">Étape 2 / 2 — Vous pourrez changer de plan à tout moment</p>
              </div>

              {error && (
                <div className="p-3 text-sm text-destructive-foreground bg-destructive/10 border border-destructive/20 rounded-lg">
                  {error}
                </div>
              )}

              <div className="space-y-3">
                {planDetails.map((plan) => {
                  const PlanIcon = plan.icon
                  const isSelected = selectedPlan === plan.key
                  return (
                    <div
                      key={plan.key}
                      onClick={() => setSelectedPlan(plan.key)}
                      className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all ${isSelected ? plan.selectedColor : plan.color}`}
                    >
                      {plan.popular && (
                        <Badge className="absolute -top-2.5 left-4 bg-primary text-primary-foreground text-xs px-2 py-0.5">
                          ⭐ Plus populaire
                        </Badge>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${plan.badgeColor}`}>
                            <PlanIcon className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-semibold">{plan.name}</p>
                            <p className="text-xs text-muted-foreground">{plan.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="text-xl font-bold">{plan.price}€</span>
                            <span className="text-xs text-muted-foreground">/mois</span>
                          </div>
                          <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors ${isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/30'}`}>
                            {isSelected && <Check className="h-3 w-3 text-white" />}
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {plan.features.map(f => (
                          <span key={f} className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Check className="h-3 w-3 text-green-500 shrink-0" />
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>

              <p className="text-xs text-center text-muted-foreground">
                🔒 Essai gratuit 14 jours — Sans carte bancaire — Résiliable à tout moment
              </p>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 bg-transparent" onClick={() => { setStep(1); setError(null) }}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Retour
                </Button>
                <Button className="flex-1" onClick={handleStep2Submit} disabled={isLoading}>
                  {isLoading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Création…</>
                  ) : (
                    <>Créer mon compte — {planDetails.find(p => p.key === selectedPlan)?.name}</>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
