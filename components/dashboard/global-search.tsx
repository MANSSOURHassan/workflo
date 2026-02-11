"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  User,
  Building2,
  Mail,
  FileText,
  Calendar,
  Clock,
  ArrowRight,
  Command,
  BarChart3,
  Settings,
  HelpCircle,
  Sparkles,
  Loader2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { globalSearch } from "@/lib/actions/search"

interface SearchResult {
  id: string
  type: "prospect" | "campaign" | "deal" | "document" | "setting" | "action"
  title: string
  subtitle?: string
  icon: typeof User
  href: string
}

interface RecentSearch {
  id: string
  query: string
  timestamp: string
}

const quickActions = [
  { id: "new-prospect", label: "Nouveau prospect", icon: User, href: "/dashboard/prospects/new" },
  { id: "new-campaign", label: "Nouvelle campagne", icon: Mail, href: "/dashboard/campaigns" },
  { id: "new-task", label: "Nouvelle tâche", icon: Calendar, href: "/dashboard/tasks" },
  { id: "reports", label: "Voir les rapports", icon: BarChart3, href: "/dashboard/reports" },
  { id: "settings", label: "Paramètres", icon: Settings, href: "/dashboard/settings" },
  { id: "help", label: "Aide & Support", icon: HelpCircle, href: "/dashboard/support" },
]

// Mocks removed


export function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([
    { id: "1", query: "Jean Dupont", timestamp: "Il y a 2 heures" },
    { id: "2", query: "Campagne email Q1", timestamp: "Il y a 5 heures" },
    { id: "3", query: "Devis en attente", timestamp: "Hier" },
  ])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const router = useRouter()

  // Keyboard shortcut to open search
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  // Search logic
  useEffect(() => {
    const minSearchLength = 2
    if (query.length < minSearchLength) {
      setResults([])
      return
    }

    const timer = setTimeout(async () => {
      setIsLoading(true)
      try {
        const { data } = await globalSearch(query)
        if (data) {
          const formattedResults: SearchResult[] = data.map(item => {
            let icon = FileText
            if (item.type === 'prospect') icon = User
            if (item.type === 'deal') icon = Building2
            if (item.type === 'campaign') icon = Mail

            return {
              id: item.id,
              type: item.type as any,
              title: item.title,
              subtitle: item.subtitle,
              icon,
              href: item.url
            }
          })
          setResults(formattedResults)
          setSelectedIndex(0)
        }
      } catch (error) {
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  const handleSelect = useCallback((href: string, searchQuery?: string) => {
    if (searchQuery) {
      const newSearch: RecentSearch = {
        id: Date.now().toString(),
        query: searchQuery,
        timestamp: "A l'instant"
      }
      setRecentSearches(prev => [newSearch, ...prev.slice(0, 4)])
    }
    setOpen(false)
    setQuery("")
    router.push(href)
  }, [router])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return

      const items = query.length > 0 ? results : quickActions

      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedIndex(i => (i + 1) % items.length)
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIndex(i => (i - 1 + items.length) % items.length)
      } else if (e.key === "Enter") {
        e.preventDefault()
        const item = items[selectedIndex]
        if (item) {
          handleSelect(item.href, query || undefined)
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [open, query, results, selectedIndex, handleSelect])

  return (
    <>
      {/* Search Trigger */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground bg-muted/50 rounded-lg hover:bg-muted transition-colors w-full max-w-sm"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left">Rechercher...</span>
        <kbd className="hidden md:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          <Command className="h-3 w-3" />K
        </kbd>
      </button>

      {/* Search Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[600px] p-0 gap-0 overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center border-b px-4">
            <Search className="h-5 w-5 text-muted-foreground shrink-0" />
            <Input
              placeholder="Rechercher prospects, campagnes, documents..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="border-0 focus-visible:ring-0 text-base"
              autoFocus
            />
            {query && (
              <Badge variant="secondary" className="shrink-0 animate-in fade-in zoom-in">
                {isLoading ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Recherche...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3 w-3 mr-1" />
                    IA
                  </>
                )}
              </Badge>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {/* Search Results */}
            {query.length > 0 && results.length > 0 && (
              <div className="p-2">
                <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                  Résultats ({results.length})
                </p>
                {results.map((result, index) => (
                  <button
                    key={result.id}
                    onClick={() => handleSelect(result.href, query)}
                    className={cn(
                      "flex items-center gap-3 w-full px-2 py-2.5 rounded-lg text-left transition-colors",
                      selectedIndex === index ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                    )}
                  >
                    <div className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-lg",
                      selectedIndex === index ? "bg-primary-foreground/20" : "bg-muted"
                    )}>
                      <result.icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{result.title}</p>
                      {result.subtitle && (
                        <p className={cn(
                          "text-sm truncate",
                          selectedIndex === index ? "text-primary-foreground/70" : "text-muted-foreground"
                        )}>
                          {result.subtitle}
                        </p>
                      )}
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 opacity-50" />
                  </button>
                ))}
              </div>
            )}

            {/* No Results */}
            {query.length > 0 && results.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="font-medium">Aucun résultat trouvé</p>
                <p className="text-sm">Essayez avec d'autres termes de recherche</p>
              </div>
            )}

            {/* Recent Searches */}
            {query.length === 0 && recentSearches.length > 0 && (
              <div className="p-2">
                <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                  Recherches récentes
                </p>
                {recentSearches.map((search) => (
                  <button
                    key={search.id}
                    onClick={() => setQuery(search.query)}
                    className="flex items-center gap-3 w-full px-2 py-2 rounded-lg text-left hover:bg-muted transition-colors"
                  >
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="flex-1">{search.query}</span>
                    <span className="text-xs text-muted-foreground">{search.timestamp}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Quick Actions */}
            {query.length === 0 && (
              <div className="p-2 border-t">
                <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                  Actions rapides
                </p>
                <div className="grid grid-cols-2 gap-1">
                  {quickActions.map((action, index) => (
                    <button
                      key={action.id}
                      onClick={() => handleSelect(action.href)}
                      className={cn(
                        "flex items-center gap-2 px-2 py-2 rounded-lg text-left transition-colors",
                        selectedIndex === index && query.length === 0 ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                      )}
                    >
                      <action.icon className="h-4 w-4" />
                      <span className="text-sm">{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-2 border-t text-xs text-muted-foreground bg-muted/30">
            <div className="flex items-center gap-2">
              <kbd className="px-1.5 py-0.5 rounded border bg-background text-xs">↑↓</kbd>
              <span>Naviguer</span>
              <kbd className="px-1.5 py-0.5 rounded border bg-background ml-2 text-xs">Entrée</kbd>
              <span>Sélectionner</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-1.5 py-0.5 rounded border bg-background">Esc</kbd>
              <span>Fermer</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
