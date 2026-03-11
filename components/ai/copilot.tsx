'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Bot, Send, X, MessageSquare, Loader2, User, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { askCopilot } from '@/lib/actions/copilot'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'

interface Message {
    role: 'user' | 'assistant'
    content: string
}

export function Copilot() {
    const pathname = usePathname()
    const [isOpen, setIsOpen] = useState(false)
    const [input, setInput] = useState('')
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: 'Bonjour ! Je suis votre assistant Workflow CRM. Comment puis-je vous aider aujourd\'hui ?' }
    ])
    const [isLoading, setIsLoading] = useState(false)
    const scrollAreaRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleToggle = () => setIsOpen(prev => !prev)
        window.addEventListener('toggle-copilot', handleToggle)
        return () => window.removeEventListener('toggle-copilot', handleToggle)
    }, [])

    useEffect(() => {
        if (scrollAreaRef.current) {
            const scrollArea = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
            if (scrollArea) {
                scrollArea.scrollTop = scrollArea.scrollHeight
            }
        }
    }, [messages])

    const handleSend = async () => {
        if (!input.trim() || isLoading) return

        const userMessage = input.trim()
        console.log('Copilot UI: Sending message:', userMessage)
        setInput('')
        setMessages(prev => [...prev, { role: 'user', content: userMessage }])
        setIsLoading(true)

        try {
            const response = await askCopilot(userMessage, messages, pathname)
            if (response.data) {
                setMessages(prev => [...prev, { role: 'assistant', content: response.data as string }])
            } else if (response.error) {
                setMessages(prev => [...prev, { role: 'assistant', content: `Désolé : ${response.error}` }])
            }
        } catch (error) {
            setMessages(prev => [...prev, { role: 'assistant', content: "Une erreur est survenue." }])
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="mb-4 w-80 sm:w-96"
                    >
                        <Card className="border-primary/20 shadow-2xl flex flex-col h-[500px] overflow-hidden bg-background/95 backdrop-blur-sm">
                            <CardHeader className="p-4 border-b bg-primary/5 flex flex-row items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="bg-primary p-1.5 rounded-lg">
                                        <Bot className="h-5 w-5 text-primary-foreground" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-sm font-bold">Assistant IA</CardTitle>
                                        <div className="flex items-center gap-1">
                                            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">En ligne</span>
                                        </div>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setIsOpen(false)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </CardHeader>

                            <CardContent className="p-0 flex-1 overflow-hidden">
                                <ScrollArea ref={scrollAreaRef} className="h-full p-4">
                                    <div className="space-y-4">
                                        {messages.map((msg, i) => (
                                            <div
                                                key={i}
                                                className={cn(
                                                    "flex gap-2 max-w-[85%]",
                                                    msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                                                )}
                                            >
                                                <div className={cn(
                                                    "h-8 w-8 rounded-full flex items-center justify-center shrink-0 border",
                                                    msg.role === 'user' ? "bg-primary text-primary-foreground" : "bg-muted"
                                                )}>
                                                    {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                                                </div>
                                                <div className={cn(
                                                    "rounded-2xl px-3 py-2 text-sm",
                                                    msg.role === 'user'
                                                        ? "bg-primary text-primary-foreground rounded-tr-none"
                                                        : "bg-muted text-foreground rounded-tl-none"
                                                )}>
                                                    {msg.content}
                                                </div>
                                            </div>
                                        ))}
                                        {isLoading && (
                                            <div className="flex gap-2 mr-auto max-w-[85%]">
                                                <div className="h-8 w-8 rounded-full flex items-center justify-center bg-muted border animate-spin">
                                                    <Loader2 className="h-4 w-4" />
                                                </div>
                                                <div className="bg-muted text-foreground rounded-2xl rounded-tl-none px-3 py-2 text-sm italic">
                                                    L'IA réfléchit...
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </ScrollArea>
                            </CardContent>

                            <CardFooter className="p-4 pt-2 border-t bg-background">
                                <form
                                    onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                                    className="flex w-full items-center gap-2"
                                >
                                    <Input
                                        placeholder="Posez une question..."
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        className="flex-1 bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary h-9 text-sm"
                                    />
                                    <Button type="submit" size="icon" disabled={isLoading || !input.trim()} className="h-9 w-9 shrink-0 shadow-sm">
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </form>
                            </CardFooter>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            <Button
                size="lg"
                className={cn(
                    "rounded-full h-14 w-14 shadow-xl p-0 transition-all duration-300",
                    isOpen ? "rotate-90 bg-muted text-muted-foreground hover:bg-muted" : "bg-primary hover:scale-105"
                )}
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? <X className="h-6 w-6" /> : (
                    <div className="relative">
                        <Bot className="h-7 w-7" />
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-foreground opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary-foreground border-2 border-primary"></span>
                        </span>
                    </div>
                )}
            </Button>
        </div>
    )
}
