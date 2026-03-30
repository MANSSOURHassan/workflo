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
import { FormattedMessage } from '@/components/assistant/formatted-message'
import { motion, AnimatePresence } from 'framer-motion'
import { PageHeader } from '@/components/dashboard/page-header'

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
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) return

      const { data, error } = await supabase
        .from('assistant_messages')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(50)

      if (error) {
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
      if (error.code === '42P01') return
      toast.error(`Erreur chargement historique : ${error.message || "Inconnue"}`)
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
          // Ignore DB errors (missing tables)
        }
      }

      // Get AI Response
      const responseContent = await getAIResponse(userContent)

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
    <div className="h-[calc(100vh-100px)] flex flex-col animate-in fade-in duration-500">
      <PageHeader 
        title="Assistant IA" 
        description="Votre copilote personnel pour analyser vos données CRM, rédiger des contenus et optimiser votre stratégie."
      />

      {/* Chat Area */}
      <Card className="flex-1 flex flex-col min-h-0 shadow-xl border-none bg-card/50 backdrop-blur-sm overflow-hidden">
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-8 scroll-smooth"
        >
          <div className="space-y-8 pb-4">
            <AnimatePresence initial={false}>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 shadow-lg shadow-purple-500/20">
                      <Bot className="h-6 w-6 text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-3xl px-6 py-4 shadow-md transition-all ${
                      message.role === 'user'
                        ? 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-tr-none'
                        : 'bg-white dark:bg-slate-900 border border-border/40 rounded-tl-none ring-1 ring-black/5'
                    }`}
                  >
                    <div className={message.role === 'user' ? 'text-white' : 'text-slate-800 dark:text-slate-100'}>
                      {message.role === 'assistant' ? (
                        <FormattedMessage content={message.content} />
                      ) : (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                      )}
                    </div>
                    <div className={`text-[10px] mt-3 flex items-center gap-1 opacity-60 ${message.role === 'user' ? 'justify-end text-white/80' : 'justify-start text-muted-foreground'}`}>
                      {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  {message.role === 'user' && (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white dark:bg-slate-800 shadow-lg border border-border/50">
                      <User className="h-6 w-6 text-purple-600" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            {isLoading && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex gap-4 justify-start"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 shadow-lg shadow-purple-500/20">
                  <Bot className="h-6 w-6 text-white" />
                </div>
                <div className="bg-white dark:bg-slate-900 border border-border/40 rounded-3xl rounded-tl-none px-6 py-4 shadow-md ring-1 ring-black/5">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 1 }}
                        className="h-2 w-2 rounded-full bg-purple-500"
                      />
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                        className="h-2 w-2 rounded-full bg-indigo-500"
                      />
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                        className="h-2 w-2 rounded-full bg-purple-500"
                      />
                    </div>
                    <span className="text-sm text-muted-foreground font-medium italic">Optimisation de votre réponse...</span>
                  </div>
                </div>
              </motion.div>
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
