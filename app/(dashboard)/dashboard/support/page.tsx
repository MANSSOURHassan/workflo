'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Search,
  HelpCircle,
  MessageCircle,
  Book,
  Video,
  Mail,
  Phone,
  Clock,
  ChevronDown,
  ChevronUp,
  ExternalLink
} from 'lucide-react'
import { PageHeader } from '@/components/dashboard/page-header'

const faqItems = [
  {
    question: "Comment importer mes contacts existants ?",
    answer: "Allez dans Prospects > Import, puis téléchargez un fichier CSV avec vos contacts. Le système détectera automatiquement les colonnes (email, nom, entreprise, etc.) et importera vos données. Vous pouvez aussi utiliser l'API REST pour une intégration automatisée."
  },
  {
    question: "Comment fonctionne le scoring IA ?",
    answer: "Notre algorithme d'IA analyse plusieurs facteurs pour attribuer un score de 0 à 100 à chaque prospect : complétude des données (30 pts), qualité de la source (20 pts), progression du statut (25 pts), niveau d'engagement (15 pts), et enrichissement des informations (10 pts). Plus le score est élevé, plus le prospect est qualifié."
  },
  {
    question: "Comment créer une campagne email ?",
    answer: "Dans le menu Campagnes, cliquez sur 'Nouvelle campagne'. Choisissez vos destinataires parmi vos prospects, rédigez votre email (ou utilisez un template), configurez la planification et lancez l'envoi. Vous pouvez suivre les taux d'ouverture et de clic en temps réel."
  },
  {
    question: "Comment personnaliser mon pipeline de vente ?",
    answer: "Dans Pipeline, cliquez sur l'icône de paramètres. Vous pouvez ajouter, modifier ou supprimer des étapes, changer leurs couleurs, et réorganiser l'ordre. Chaque opportunité peut être déplacée par glisser-déposer entre les étapes."
  },
  {
    question: "Comment intégrer Workflow CRM avec d'autres outils ?",
    answer: "Allez dans Paramètres > Intégrations. Nous supportons Google Calendar, Gmail/Outlook, Zapier et des webhooks personnalisés. Pour les intégrations avancées, utilisez notre API REST documentée dans Paramètres > Clés API."
  },
  {
    question: "Mes données sont-elles sécurisées ?",
    answer: "Absolument. Nous utilisons le chiffrement AES-256 pour les données au repos, TLS 1.3 pour les communications, et nous sommes conformes au RGPD. Vous pouvez activer la double authentification (2FA) pour une sécurité renforcée."
  },
  {
    question: "Comment exporter mes données ?",
    answer: "Vous pouvez exporter vos prospects au format CSV depuis la page Prospects. Pour un export complet (RGPD), allez dans Paramètres > RGPD > Exporter mes données. Les rapports peuvent aussi être exportés en PDF."
  },
  {
    question: "Comment annuler mon abonnement ?",
    answer: "Rendez-vous dans Paramètres > Facturation > Gérer l'abonnement. Vous pouvez annuler à tout moment. Vos données restent accessibles jusqu'à la fin de la période payée, puis sont conservées 30 jours avant suppression."
  }
]

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedItems, setExpandedItems] = useState<number[]>([0])

  const filteredFaq = faqItems.filter(item =>
    item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.answer.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const toggleItem = (index: number) => {
    setExpandedItems(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Centre d'aide & Support" 
        description="Trouvez des réponses à vos questions, consultez la documentation ou contactez notre équipe technique."
      />

      {/* Recherche */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Rechercher une question..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-lg"
            />
          </div>
        </CardContent>
      </Card>

      {/* Raccourcis */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="cursor-pointer hover:border-primary transition-colors">
          <CardContent className="pt-6 text-center">
            <Book className="h-8 w-8 mx-auto mb-3 text-primary" />
            <h3 className="font-medium">Documentation</h3>
            <p className="text-sm text-muted-foreground">Guides complets</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary transition-colors">
          <CardContent className="pt-6 text-center">
            <Video className="h-8 w-8 mx-auto mb-3 text-primary" />
            <h3 className="font-medium">Tutoriels vidéo</h3>
            <p className="text-sm text-muted-foreground">Apprenez visuellement</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary transition-colors">
          <CardContent className="pt-6 text-center">
            <MessageCircle className="h-8 w-8 mx-auto mb-3 text-primary" />
            <h3 className="font-medium">Chat en direct</h3>
            <p className="text-sm text-muted-foreground">Réponse instantanée</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary transition-colors">
          <CardContent className="pt-6 text-center">
            <Mail className="h-8 w-8 mx-auto mb-3 text-primary" />
            <h3 className="font-medium">Email support</h3>
            <p className="text-sm text-muted-foreground">Réponse sous 24h</p>
          </CardContent>
        </Card>
      </div>

      {/* FAQ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            Questions fréquentes
          </CardTitle>
          <CardDescription>
            Les réponses aux questions les plus posées
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {filteredFaq.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <HelpCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun résultat pour "{searchQuery}"</p>
              <Button variant="link" onClick={() => setSearchQuery('')}>
                Effacer la recherche
              </Button>
            </div>
          ) : (
            filteredFaq.map((item, index) => (
              <div key={index} className="border rounded-lg">
                <button
                  onClick={() => toggleItem(index)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
                >
                  <span className="font-medium">{item.question}</span>
                  {expandedItems.includes(index) ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </button>
                {expandedItems.includes(index) && (
                  <div className="px-4 pb-4 text-muted-foreground">
                    {item.answer}
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Contact */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contacter le support</CardTitle>
            <CardDescription>
              Notre équipe est disponible pour vous aider
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <Mail className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Email</p>
                <p className="text-sm text-muted-foreground">support@workflow-crm.com</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <Phone className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Téléphone</p>
                <p className="text-sm text-muted-foreground">+33 1 23 45 67 89</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Horaires</p>
                <p className="text-sm text-muted-foreground">Lun-Ven, 9h-18h (CET)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ressources utiles</CardTitle>
            <CardDescription>
              Documentation et guides
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <a href="#" className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
              <span>Guide de démarrage rapide</span>
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </a>
            <a href="#" className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
              <span>Documentation API</span>
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </a>
            <a href="#" className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
              <span>Bonnes pratiques CRM</span>
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </a>
            <a href="#" className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
              <span>Changelog & mises à jour</span>
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
