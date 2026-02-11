'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  BrainCircuit,
  Send,
  Sparkles,
  User,
  Bot,
  Lightbulb,
  FileText,
  Mail,
  Target,
  TrendingUp,
  Loader2,
  Users
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { askCopilot } from '@/lib/actions/copilot'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

const suggestions = [
  { icon: Target, text: 'Analyser mes prospects les plus prometteurs' },
  { icon: Mail, text: 'Rediger un email de relance' },
  { icon: TrendingUp, text: 'Optimiser ma strategie commerciale' },
  { icon: FileText, text: 'Generer un rapport de performance' },
]

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isDBReady, setIsDBReady] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    loadMessages()
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isLoading])

  async function loadMessages() {
    console.log('Assistant: Début chargement messages...')
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError) {
        console.error('Assistant: Erreur auth brute:', authError)
        console.log('Assistant: Message auth:', authError.message)
        return
      }
      if (!user) {
        console.warn('Assistant: Aucun utilisateur connecté')
        return
      }

      console.log('Assistant: Utilisateur récupéré:', user.id)

      const { data, error } = await supabase
        .from('assistant_messages')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(50)

      if (error) {
        console.error('Assistant: Erreur Supabase brute:', error)
        console.log('Assistant: Code erreur query:', error.code)
        console.log('Assistant: Message erreur query:', error.message)
        console.log('Assistant: Détails erreur query:', error.details)

        if (error.code === '42P01') {
          setIsDBReady(false)
          toast.error('⚠️ Tables IA non trouvées. Exécutez le script missing-tables.sql dans Supabase')
          setMessages([
            {
              id: '1',
              role: 'assistant',
              content: 'Bonjour ! Je suis votre assistant IA. (Note: Les tables de données sont manquantes dans Supabase. Veuillez exécuter missing-tables.sql)',
              created_at: new Date().toISOString(),
            }
          ])
          return
        }
        throw error
      }

      console.log('Assistant: Données reçues:', data?.length || 0, 'messages')

      if (data && data.length > 0) {
        setMessages(data)
      } else {
        setMessages([
          {
            id: '1',
            role: 'assistant',
            content: 'Bonjour ! Je suis votre assistant IA commercial. Je peux vous aider a analyser vos prospects, rediger des emails, optimiser vos campagnes et bien plus. Comment puis-je vous aider aujourd\'hui ?',
            created_at: new Date().toISOString(),
          }
        ])
      }
    } catch (error: any) {
      console.error('Assistant - Erreur détaillée:', error)
      let errorMsg = "Erreur inconnue"
      if (error?.message) errorMsg = error.message
      else if (error?.details) errorMsg = error.details
      else if (typeof error === 'string') errorMsg = error

      console.log('Assistant - Message final:', errorMsg)
      toast.error(`Impossible de charger l'historique: ${errorMsg}`)
    }
  }

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userContent = input
    const userMsgId = Date.now().toString()

    const userMessage: Message = {
      id: userMsgId,
      role: 'user',
      content: userContent,
      created_at: new Date().toISOString(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      console.log('Assistant Page: handleSend started')
      const { data: { user } } = await supabase.auth.getUser()

      // Save user message if DB is ready - protected by try/catch
      if (isDBReady && user) {
        try {
          // Find or create conversation
          let conversationId;
          const { data: convs } = await supabase.from('assistant_conversations').select('id').eq('is_archived', false).limit(1).maybeSingle()

          if (convs) {
            conversationId = convs.id
          } else {
            const { data: newConv } = await supabase.from('assistant_conversations').insert({ user_id: user.id, title: 'Chat avec IA' }).select().single()
            conversationId = newConv?.id
          }

          if (conversationId) {
            await supabase.from('assistant_messages').insert({
              conversation_id: conversationId,
              role: 'user',
              content: userContent
            })
          }
        } catch (dbErr) {
          console.warn('Assistant Page: Database save failed (ignore if tables missing):', dbErr)
        }
      }

      console.log('Assistant Page: Getting AI response...')
      // Get AI Response
      const responseContent = await getAIResponse(userContent)
      console.log('Assistant Page: AI response received')

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseContent,
        created_at: new Date().toISOString(),
      }

      setMessages(prev => [...prev, aiResponse])

      // Save AI message if DB is ready
      if (isDBReady && user) {
        const { data: convs } = await supabase.from('assistant_conversations').select('id').eq('is_archived', false).limit(1).single()
        if (convs) {
          await supabase.from('assistant_messages').insert({
            conversation_id: convs.id,
            role: 'assistant',
            content: responseContent
          })
        }
      }
    } catch (error) {
      console.error('AI Error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getAIResponse = async (query: string): Promise<string> => {
    const response = await askCopilot(query, messages.map(m => ({ role: m.role, content: m.content })), '/dashboard/assistant')

    if (response.data) {
      return response.data
    }
    console.error('AI Error from askCopilot:', response.error)
    return response.error || "Une erreur est survenue lors de la communication avec l'IA."
  }

  const handleSuggestionClick = (text: string) => {
    setInput(text)
  }

  return (
    <div className="h-[calc(100vh-160px)] flex flex-col animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex-none mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/20">
            <BrainCircuit className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-primary">Assistant IA</h1>
            <p className="text-muted-foreground">
              Votre copilote commercial intelligent connecté à vos données
            </p>
          </div>
          <Badge className="ml-auto bg-gradient-to-r from-purple-500 to-pink-500 text-white border-none">
            <Sparkles className="mr-1 h-3 w-3 animate-pulse" />
            IA Connectée
          </Badge>
        </div>
      </div>

      {/* Chat Area */}
      <Card className="flex-1 flex flex-col min-h-0 shadow-xl border-none bg-card/50 backdrop-blur-sm overflow-hidden">
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth"
        >
          <div className="space-y-6 pb-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-md">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl px-5 py-3 shadow-sm ${message.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-tr-none'
                    : 'bg-white dark:bg-slate-900 border border-border/50 rounded-tl-none'
                    }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  <span className={`text-[10px] mt-2 block opacity-50 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                    {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                {message.role === 'user' && (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary shadow-md">
                    <User className="h-5 w-5 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div className="bg-white dark:bg-slate-900 border border-border/50 rounded-2xl px-5 py-3">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-4 w-4 animate-spin text-purple-500" />
                    <span className="text-sm text-muted-foreground animate-pulse">Réflexion en cours...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Suggestions */}
        {messages.length <= 1 && !isLoading && (
          <div className="flex-none p-4 border-t bg-muted/30">
            <p className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-2 uppercase tracking-wider">
              <Lightbulb className="h-3 w-3" />
              Suggestions rapides
            </p>
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion.text)}
                  className="flex items-center gap-3 p-3 rounded-xl border bg-card hover:bg-muted hover:border-primary/50 transition-all text-left group shadow-sm"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <suggestion.icon className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-xs font-medium line-clamp-1">{suggestion.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="flex-none p-4 border-t bg-background/80 backdrop-blur-md">
          <div className="flex gap-2 relative">
            <Input
              placeholder="Posez votre question à l'assistant..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1 h-12 pr-12 rounded-xl border-border/50 focus-visible:ring-purple-500"
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="absolute right-1 top-1 h-10 w-10 p-0 rounded-lg bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
          <p className="text-[10px] text-center text-muted-foreground mt-2">
            L'IA peut faire des erreurs. Vérifiez les informations importantes.
          </p>
        </div>
      </Card>
    </div>
  )
}
