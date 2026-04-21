'use client'

import React, { useState } from 'react'
import {
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { 
  Users, 
  Sparkles, 
  FileText, 
  Zap, 
  HelpCircle,
  BarChart2,
  Send,
  Activity,
  FolderOpen,
  ArrowLeft,
  Mail,
  Search,
  MessageSquare,
  BrainCircuit,
  Share2,
  Clock,
  Package,
  CreditCard,
  Wallet,
  CheckCircle2,
  TrendingUp,
  FileCode,
  GraduationCap,
  Bot,
  ShieldCheck
} from 'lucide-react'
import { cn } from '@/lib/utils'

type Module = {
  id: string
  label: string
  icon: React.ElementType
  color: string
  bg: string
  description: string
  items: { title: string; desc: string; icon: React.ElementType }[]
}

const modules: Module[] = [
  {
    id: 'crm',
    label: 'CRM',
    icon: Users,
    color: 'text-blue-600',
    bg: 'bg-blue-50 hover:bg-blue-100',
    description: 'Gérez vos contacts, leads et opportunités de vente.',
    items: [
      { title: 'Contacts', icon: Users, desc: 'Base de données centrale : stockez noms, emails, entreprises et documents.' },
      { title: 'Trouver des clients', icon: Search, desc: 'Moteur de prospection : identifiez de nouvelles cibles selon vos critères.' },
      { title: 'Opportunités (Pipeline)', icon: BarChart2, desc: 'Vision Kanban de vos ventes : de "Contact" à "Vendu", suivez votre CA prévisionnel.' },
      { title: 'Activités', icon: Activity, desc: 'Journal historique : retrouvez tous les appels, notes et emails par client.' },
    ]
  },
  {
    id: 'ia',
    label: 'IA & Auto',
    icon: Sparkles,
    color: 'text-cyan-600',
    bg: 'bg-cyan-50 hover:bg-cyan-100',
    description: 'Automatisez vos tâches répétitives grâce à l\'IA.',
    items: [
      { title: 'Campagnes', icon: Mail, desc: 'Prospection de masse : envoyez des séquences d\'emails à des centaines de prospects.' },
      { title: 'Autopilot', icon: Bot, desc: 'Robot de relance : envoie automatiquement des emails selon des conditions prédéfinies.' },
      { title: 'Chatbot', icon: MessageSquare, desc: 'Capturez des clients 24h/24 depuis votre site web et envoyez-les directement dans le CRM.' },
      { title: 'Assistant IA', icon: BrainCircuit, desc: 'Posez des questions sur vos données et obtenez des réponses instantanées.' },
    ]
  },
  {
    id: 'com',
    label: 'Communication',
    icon: Send,
    color: 'text-pink-600',
    bg: 'bg-pink-50 hover:bg-pink-100',
    description: 'Emails, calendrier et réseaux sociaux unifiés.',
    items: [
      { title: 'Emails', icon: Mail, desc: 'Synchronisez Gmail ou Outlook pour ne jamais quitter votre CRM.' },
      { title: 'Calendrier', icon: Clock, desc: 'Gérez vos rendez-vous et rappels prospects depuis une interface unifiée.' },
      { title: 'Réseaux Sociaux', icon: Share2, desc: 'Publiez sur LinkedIn et Meta directement depuis une seule interface.' },
    ]
  },
  {
    id: 'prod',
    label: 'Productivité',
    icon: Activity,
    color: 'text-green-600',
    bg: 'bg-green-50 hover:bg-green-100',
    description: 'Organisez votre équipe et analysez vos performances.',
    items: [
      { title: 'Tâches', icon: CheckCircle2, desc: 'To-do list intelligente : affectez des tâches liées à vos prospects.' },
      { title: 'Analytics', icon: TrendingUp, desc: 'Statistiques de vente : taux de conversion et performances de votre équipe.' },
      { title: 'Rapports', icon: FileText, desc: 'Générateur PDF pour des synthèses d\'activité destinées à la direction.' },
    ]
  },
  {
    id: 'compta',
    label: 'Comptabilité',
    icon: FileText,
    color: 'text-slate-700',
    bg: 'bg-slate-50 hover:bg-slate-100',
    description: 'Devis, factures et bilan financier en temps réel.',
    items: [
      { title: 'Bilan', icon: TrendingUp, desc: 'Revenus, charges et bénéfice net calculés automatiquement en temps réel.' },
      { title: 'Devis & Factures', icon: FileText, desc: 'Créez des PDFs et transformez vos devis en factures en 1 clic. Lien automatique au Pipeline.' },
      { title: 'Banques', icon: CreditCard, desc: 'Connectez vos comptes pour vérifier les paiements reçus par vos clients.' },
      { title: 'Catalogue', icon: Package, desc: 'Listez vos produits avec prix et TVA pour une saisie ultra-rapide lors de la facturation.' },
      { title: 'Paie', icon: Wallet, desc: 'Préparez les éléments variables pour les fiches de paie de vos collaborateurs.' },
    ]
  },
  {
    id: 'res',
    label: 'Ressources',
    icon: FolderOpen,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50 hover:bg-indigo-100',
    description: 'Documents, modèles et formations en ligne.',
    items: [
      { title: 'Documents', icon: FolderOpen, desc: 'Stockage sécurisé de vos contrats, pièces d\'identité et fichiers techniques.' },
      { title: 'Modèles', icon: FileCode, desc: 'Templates réutilisables d\'emails et de contrats pour gagner des heures chaque semaine.' },
      { title: 'Academy', icon: GraduationCap, desc: 'Centre de formation avec tutoriels vidéo pour maîtriser chaque module du CRM.' },
    ]
  },
]

export function HelpCenter() {
  const [selected, setSelected] = useState<Module | null>(null)

  return (
    <SheetContent className="w-full sm:max-w-2xl flex flex-col p-0 border-l shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-transparent p-5 border-b shrink-0">
        <SheetHeader>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shadow-md">
              <HelpCircle className="h-4.5 w-4.5 text-primary-foreground" />
            </div>
            <div>
              <SheetTitle className="text-lg font-bold leading-tight">Guide complet Workflow</SheetTitle>
              <SheetDescription className="text-xs">Cliquez sur un module pour voir les détails</SheetDescription>
            </div>
          </div>
        </SheetHeader>
      </div>

      {/* Module Grid View */}
      {!selected && (
        <div className="p-6 grid grid-cols-2 gap-4 overflow-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
          {modules.map((mod) => {
            const Icon = mod.icon
            return (
              <button
                key={mod.id}
                onClick={() => setSelected(mod)}
                className={cn(
                  'flex flex-col items-start gap-3 p-5 rounded-2xl text-left transition-all duration-200 border border-transparent hover:border-primary/20 hover:shadow-md',
                  mod.bg
                )}
              >
                <div className={cn('h-12 w-12 rounded-xl flex items-center justify-center bg-white shadow-sm')}>
                  <Icon className={cn('h-6 w-6', mod.color)} />
                </div>
                <div>
                  <p className={cn('font-extrabold text-[15px]', mod.color)}>{mod.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{mod.description}</p>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Detail View */}
      {selected && (
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Back + Section Header */}
          <div className={cn('px-6 py-4 border-b flex items-center gap-4 shrink-0', selected.bg.split(' ')[0])}>
            <button onClick={() => setSelected(null)} className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" /> Retour
            </button>
            <div className="flex items-center gap-2">
              <selected.icon className={cn('h-5 w-5', selected.color)} />
              <span className={cn('font-extrabold text-base', selected.color)}>{selected.label}</span>
            </div>
          </div>

          {/* Items */}
          <div className="p-6 space-y-3 overflow-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
            {selected.items.map((item) => {
              const ItemIcon = item.icon
              return (
                <div key={item.title} className="flex items-start gap-4 p-4 rounded-xl border bg-card hover:bg-muted/20 transition-colors">
                  <div className={cn('h-10 w-10 shrink-0 rounded-xl flex items-center justify-center', selected.bg.split(' ')[0])}>
                    <ItemIcon className={cn('h-5 w-5', selected.color)} />
                  </div>
                  <div>
                    <p className="font-bold text-sm">{item.title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{item.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="p-4 border-t bg-muted/5 flex items-center justify-between shrink-0">
        <span className="text-[10px] text-muted-foreground flex items-center gap-1.5">
          <ShieldCheck className="h-3 w-3 text-green-500" /> RGPD Conforme • MAMISOUR
        </span>
        <span className="text-[10px] text-muted-foreground font-mono">v2.1</span>
      </div>
    </SheetContent>
  )
}
