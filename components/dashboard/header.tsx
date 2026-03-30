'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from '@/lib/actions/auth'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/lib/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Bell,
  Settings,
  LogOut,
  User as UserIcon,
  HelpCircle,
  ChevronDown
} from 'lucide-react'
import { GlobalSearch } from './global-search'
import { ModeToggle } from '@/components/mode-toggle'

interface DashboardHeaderProps {
  user: User
  profile: Profile | null
}

const pageNames: Record<string, string> = {
  '/dashboard': 'Tableau de bord',
  '/dashboard/prospects/import': 'Importation',
  '/dashboard/prospects/new': 'Nouveau Prospect',
  '/dashboard/prospects': 'Contacts',
  '/dashboard/leads': 'Trouver des clients',
  '/dashboard/pipeline': 'Pipeline',
  '/dashboard/activities': 'Activités',
  '/dashboard/campaigns/templates': 'Modèles d\'emails',
  '/dashboard/campaigns/new': 'Nouvelle Campagne',
  '/dashboard/campaigns': 'Campagnes',
  '/dashboard/autopilot': 'Autopilot IA',
  '/dashboard/chatbot': 'Widgets Chatbot',
  '/dashboard/assistant': 'Assistant IA',
  '/dashboard/email': 'Messagerie',
  '/dashboard/calendar': 'Calendrier',
  '/dashboard/social': 'Réseaux Sociaux',
  '/dashboard/tasks': 'Tâches',
  '/dashboard/analytics': 'Analytics',
  '/dashboard/reports': 'Rapports',
  '/dashboard/accounting': 'Bilan Comptable',
  '/dashboard/invoices': 'Devis & Factures',
  '/dashboard/banking': 'Banques',
  '/dashboard/catalog': 'Catalogue',
  '/dashboard/documents': 'Documents',
  '/dashboard/templates': 'Modèles',
  '/dashboard/academy': 'Academy',
  '/dashboard/team': 'Équipe',
  '/dashboard/billing': 'Facturation',
  '/dashboard/integrations': 'Connexions',
  '/dashboard/customize': 'Personnalisation',
  '/dashboard/settings/api-keys': 'Clés API',
  '/dashboard/settings/rgpd': 'RGPD',
  '/dashboard/settings/security': 'Sécurité',
  '/dashboard/settings/webhooks': 'Webhooks',
  '/dashboard/settings': 'Paramètres',
  '/dashboard/search': 'Recherche',
  '/dashboard/debug': 'Diagnostic',
}

export function DashboardHeader({ user, profile }: DashboardHeaderProps) {
  const pathname = usePathname()

  const currentPageName = Object.entries(pageNames)
    .sort((a, b) => b[0].length - a[0].length)
    .find(([path]) => pathname === path || pathname.startsWith(path + '/'))
    ?.[1] || 'Tableau de bord'

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-6">
      {/* Page Title & Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link 
          href="/dashboard" 
          className="text-muted-foreground hover:text-primary transition-colors font-medium"
        >
          Tableau de bord
        </Link>
        {pathname !== '/dashboard' && (
          <>
            <span className="text-muted-foreground/50">/</span>
            <h1 className="font-semibold text-foreground">{currentPageName}</h1>
          </>
        )}
      </div>

      {/* Search & Actions */}
      <div className="flex items-center gap-4">
        {/* Global Search */}
        <div className="hidden md:block">
          <GlobalSearch />
        </div>

        {/* Theme Toggle */}
        <ModeToggle />

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                3
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-64 overflow-y-auto">
              <DropdownMenuItem className="flex flex-col items-start gap-1 p-3">
                <span className="font-medium">Nouveau prospect qualifié</span>
                <span className="text-xs text-muted-foreground">
                  Jean Martin de TechCorp a été qualifié avec un score de 85
                </span>
                <span className="text-xs text-muted-foreground">Il y a 5 minutes</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start gap-1 p-3">
                <span className="font-medium">Campagne terminée</span>
                <span className="text-xs text-muted-foreground">
                  La campagne &quot;Lancement Q1&quot; a atteint 45% de taux d&apos;ouverture
                </span>
                <span className="text-xs text-muted-foreground">Il y a 1 heure</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start gap-1 p-3">
                <span className="font-medium">Deal gagné</span>
                <span className="text-xs text-muted-foreground">
                  Contrat de 25 000 EUR signé avec InnovateSA
                </span>
                <span className="text-xs text-muted-foreground">Il y a 3 heures</span>
              </DropdownMenuItem>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/activities" className="w-full justify-center text-primary cursor-pointer">
                Voir toutes les notifications
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                {profile?.first_name?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-sm font-medium">
                  {profile?.first_name || user.email?.split('@')[0]}
                </p>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span>{profile?.first_name} {profile?.last_name}</span>
                <span className="text-xs font-normal text-muted-foreground">{user.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings" className="flex items-center">
                <UserIcon className="mr-2 h-4 w-4" />
                Mon profil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings" className="flex items-center">
                <Settings className="mr-2 h-4 w-4" />
                Paramètres
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/support" className="flex items-center">
                <HelpCircle className="mr-2 h-4 w-4" />
                Aide et support
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => signOut()}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
