'use client'

import React from "react"

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { User } from '@supabase/supabase-js'
import type { Profile, Customization } from '@/lib/types/database'
import {
  LayoutDashboard,
  Users,
  Search,
  BarChart2,
  Activity,
  Sparkles,
  Mail,
  Bot,
  MessageSquare,
  BrainCircuit,
  Send,
  Share2,
  FileText,
  Package,
  FolderOpen,
  FileCode,
  GraduationCap,
  User as UserIcon,
  Shield,
  Phone,
  HelpCircle,
  Settings,
  LogOut,
  Clock,
  CreditCard,
  Link2,
  Palette,
  UsersRound,
  ChevronDown,
  TrendingUp,
  Zap
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { signOut } from '@/lib/actions/auth'

interface DashboardSidebarProps {
  user: User
  profile: Profile | null
  customization: Customization | null
}

interface NavItem {
  name: string
  href: string
  icon: React.ElementType
}

interface NavSection {
  name: string
  icon: React.ElementType
  color: string
  bgColor: string
  items: NavItem[]
}

const navSections: NavSection[] = [
  {
    name: 'CRM',
    icon: Users,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 hover:bg-blue-100',
    items: [
      { name: 'Contacts', href: '/dashboard/prospects', icon: Users },
      { name: 'Trouver des clients', href: '/dashboard/leads', icon: Search },
      { name: 'Opportunités', href: '/dashboard/pipeline', icon: BarChart2 },
      { name: 'Activités', href: '/dashboard/activities', icon: Activity },
    ]
  },
  {
    name: 'IA & Automation',
    icon: Sparkles,
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-50 hover:bg-cyan-100',
    items: [
      { name: 'Campagnes', href: '/dashboard/campaigns', icon: Mail },
      { name: 'Autopilot Email', href: '/dashboard/autopilot', icon: Bot },
      { name: 'Widgets Chatbot', href: '/dashboard/chatbot', icon: MessageSquare },
      { name: 'Assistant IA', href: '/dashboard/assistant', icon: BrainCircuit },
    ]
  },
  {
    name: 'Communication',
    icon: Send,
    color: 'text-pink-500',
    bgColor: 'bg-pink-50 hover:bg-pink-100',
    items: [
      { name: 'Emails', href: '/dashboard/email', icon: Mail },
      { name: 'Calendrier', href: '/dashboard/calendar', icon: Clock },
      { name: 'Réseaux Sociaux', href: '/dashboard/social', icon: Share2 },
    ]
  },
  {
    name: 'Productivité',
    icon: Activity,
    color: 'text-green-600',
    bgColor: 'bg-green-50 hover:bg-green-100',
    items: [
      { name: 'Tâches', href: '/dashboard/tasks', icon: Activity },
      { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart2 },
      { name: 'Rapports', href: '/dashboard/reports', icon: FileText },
    ]
  },
  {
    name: 'Comptabilite',
    icon: FileText,
    color: 'text-slate-600',
    bgColor: 'bg-slate-50 hover:bg-slate-100',
    items: [
      { name: 'Bilan Comptable', href: '/dashboard/accounting', icon: TrendingUp },
      { name: 'Devis & Factures', href: '/dashboard/invoices', icon: FileText },
      { name: 'Banques', href: '/dashboard/banking', icon: CreditCard },
      { name: 'Catalogue', href: '/dashboard/catalog', icon: Package },
    ]
  },
  {
    name: 'Ressources',
    icon: FolderOpen,
    color: 'text-slate-600',
    bgColor: 'bg-slate-50 hover:bg-slate-100',
    items: [
      { name: 'Documents', href: '/dashboard/documents', icon: FolderOpen },
      { name: 'Modèles', href: '/dashboard/templates', icon: FileCode },
      { name: 'Academy', href: '/dashboard/academy', icon: GraduationCap },
    ]
  },
]

const bottomNavItems = [
  { name: 'Équipe', href: '/dashboard/team', icon: UsersRound },
  { name: 'Facturation', href: '/dashboard/billing', icon: CreditCard },
  { name: 'Connexions', href: '/dashboard/integrations', icon: Link2 },
  { name: 'Personnalisation', href: '/dashboard/customize', icon: Palette },
]

export function DashboardSidebar({ user, profile, customization }: DashboardSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [expandedSection, setExpandedSection] = useState<string | null>(null)
  const [showActionsMenu, setShowActionsMenu] = useState(false)

  const handleSectionHover = (sectionName: string) => {
    setExpandedSection(sectionName)
  }

  const handleMouseLeave = () => {
    setExpandedSection(null)
    setShowActionsMenu(false)
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/auth/login')
  }

  return (
    <TooltipProvider delayDuration={0}>
      <aside className="relative flex h-full" onMouseLeave={handleMouseLeave}>
        {/* Icon Sidebar */}
        <div className="flex flex-col w-16 bg-card border-r border-border">
          {/* Logo */}
          <div className="flex h-[82px] items-center justify-center border-b border-border">
            <Link href="/dashboard" className="flex items-center justify-center">
              <img
                src={customization?.logo_url || "/logo.png"}
                alt={customization?.company_name || "Workflow CRM"}
                className="h-[66px] w-[66px] object-contain"
              />
            </Link>
          </div>

          {/* Main Nav Icons */}
          <nav className="flex-1 flex flex-col items-center py-4 gap-1">
            {navSections.map((section) => {
              const isActive = section.items.some(item =>
                pathname === item.href || pathname.startsWith(item.href + '/')
              )
              const isExpanded = expandedSection === section.name

              return (
                <Tooltip key={section.name}>
                  <TooltipTrigger asChild>
                    <button
                      onMouseEnter={() => handleSectionHover(section.name)}
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-xl transition-all',
                        isActive || isExpanded
                          ? section.bgColor
                          : 'hover:bg-muted'
                      )}
                    >
                      <section.icon className={cn('h-5 w-5', isActive || isExpanded ? section.color : 'text-muted-foreground')} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="font-medium">
                    {section.name}
                  </TooltipContent>
                </Tooltip>
              )
            })}
          </nav>

          {/* Bottom Icons */}
          <div className="flex flex-col items-center gap-1 pb-4 border-t border-border pt-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onMouseEnter={() => handleSectionHover('ia-assistant')}
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-xl transition-all',
                    expandedSection === 'ia-assistant' ? 'bg-purple-50' : 'hover:bg-muted'
                  )}
                >
                  <Zap className={cn('h-5 w-5', expandedSection === 'ia-assistant' ? 'text-purple-500' : 'text-muted-foreground')} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="font-medium">
                Assistant IA
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onMouseEnter={() => handleSectionHover('settings')}
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-xl transition-all',
                    expandedSection === 'settings' || pathname.startsWith('/dashboard/settings')
                      ? 'bg-blue-50'
                      : 'hover:bg-muted'
                  )}
                >
                  <Settings className={cn('h-5 w-5', expandedSection === 'settings' || pathname.startsWith('/dashboard/settings') ? 'text-blue-500' : 'text-muted-foreground')} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="font-medium">
                Paramètres
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onMouseEnter={() => setShowActionsMenu(true)}
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-xl transition-all',
                    showActionsMenu ? 'bg-orange-50' : 'hover:bg-muted'
                  )}
                >
                  <Zap className={cn('h-5 w-5', showActionsMenu ? 'text-orange-500' : 'text-muted-foreground')} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="font-medium">
                Actions rapides
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Expanded Menu Panel */}
        {expandedSection && expandedSection !== 'settings' && expandedSection !== 'ia-assistant' && (
          <div
            className="absolute left-16 top-0 z-50 w-72 h-full bg-card border-r border-border shadow-xl animate-in slide-in-from-left-2 duration-200"
            onMouseEnter={() => setExpandedSection(expandedSection)}
          >
            {/* Section Header */}
            <div className="p-4 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Settings className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">Paramètres</h2>
                  <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full mt-1">
                    <Settings className="h-3 w-3" />
                    Configuration
                  </span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-3">
                Configurez votre compte, vos préférences et gérez votre abonnement
              </p>
            </div>

            {/* Section Title with count */}
            <div className="p-3">
              <div className="flex items-center gap-2 px-3 py-2">
                {(() => {
                  const currentSection = navSections.find(s => s.name === expandedSection)
                  if (!currentSection) return null
                  const SectionIcon = currentSection.icon
                  return (
                    <>
                      <SectionIcon className={cn('h-4 w-4', currentSection.color)} />
                      <span className={cn('font-semibold text-sm', currentSection.color)}>{currentSection.name}</span>
                      <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5 ml-1">
                        {currentSection.items.length}
                      </span>
                    </>
                  )
                })()}
              </div>

              {/* Menu Items */}
              {navSections.find(s => s.name === expandedSection)?.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-foreground hover:bg-muted'
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                    {item.name === 'Widgets Chatbot' && (
                      <span className="ml-auto h-2 w-2 rounded-full bg-cyan-500" />
                    )}
                  </Link>
                )
              })}

              {/* Divider and bottom items */}
              <div className="my-3 border-t border-border" />

              {bottomNavItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-foreground hover:bg-muted'
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Settings Panel */}
        {expandedSection === 'settings' && (
          <div
            className="absolute left-16 top-0 z-50 w-72 h-full bg-card border-r border-border shadow-xl animate-in slide-in-from-left-2 duration-200"
            onMouseEnter={() => setExpandedSection('settings')}
          >
            {/* Header */}
            <div className="p-4 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Settings className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">Paramètres</h2>
                  <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full mt-1">
                    <Settings className="h-3 w-3" />
                    Configuration
                  </span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-3">
                Configurez votre compte, vos préférences et gérez votre abonnement
              </p>
            </div>

            {/* Settings Menu */}
            <div className="p-3 space-y-1">
              <Link
                href="/dashboard/settings"
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  pathname === '/dashboard/settings'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-muted'
                )}
              >
                <UserIcon className="h-4 w-4" />
                Mon Profil
              </Link>

              <Link
                href="/dashboard/settings/security"
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  pathname === '/dashboard/settings/security'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-muted'
                )}
              >
                <Shield className="h-4 w-4" />
                Sécurité & Confidentialité
              </Link>

              <div className="my-3 border-t border-border" />
              <p className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase">Actions</p>

              <Link
                href="/dashboard/search"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                <Search className="h-4 w-4" />
                Rechercher
              </Link>

              <Link
                href="/dashboard/recent"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                <Clock className="h-4 w-4" />
                Dernières recherches
              </Link>

              <Link
                href="/dashboard/settings"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                <Settings className="h-4 w-4" />
                Paramètres
              </Link>

              <div className="my-3 border-t border-border" />

              <Link
                href="/dashboard/support"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                <Phone className="h-4 w-4" />
                Appeler un expert
              </Link>

              <Link
                href="/dashboard/support"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                <HelpCircle className="h-4 w-4" />
                Aide & FAQ
              </Link>

              <div className="my-3 border-t border-border" />

              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Déconnexion
              </button>
            </div>
          </div>
        )}

      </aside>
    </TooltipProvider>
  )
}
