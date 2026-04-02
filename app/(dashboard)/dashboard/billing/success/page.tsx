'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function SuccessContent() {
    const searchParams = useSearchParams()
    const sessionId = searchParams.get('session_id')
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null

    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
            <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", duration: 0.6, bounce: 0.5 }}
                className="bg-green-100 p-6 rounded-full mb-6 relative overflow-hidden"
            >
                <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                >
                    <CheckCircle className="h-16 w-16 text-green-600" />
                </motion.div>
                
                {/* Petites particules de succès */}
                {[...Array(6)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-2 h-2 bg-green-500 rounded-full"
                        initial={{
                            top: "50%",
                            left: "50%",
                            opacity: 1
                        }}
                        animate={{
                            top: `${Math.random() * 100}%`,
                            left: `${Math.random() * 100}%`,
                            opacity: 0,
                            scale: 0
                        }}
                        transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                    />
                ))}
            </motion.div>

            <motion.h1 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-4xl font-extrabold tracking-tight mb-4 text-foreground"
            >
                C'est dans la boîte ! 🎉
            </motion.h1>

            <motion.p 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-lg text-muted-foreground max-w-lg mb-8"
            >
                Votre abonnement a été activé avec succès. Merci pour votre confiance !
                {sessionId && <span className="block text-xs mt-2 text-muted-foreground/60 break-all">Réf: {sessionId}</span>}
            </motion.p>

            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
            >
                <Button asChild size="lg" className="h-12 px-8 text-base">
                    <Link href="/dashboard">
                        Retour au tableau de bord <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                </Button>
            </motion.div>
        </div>
    )
}

export default function SuccessPage() {
    return (
        <Suspense fallback={<div className="flex h-[50vh] items-center justify-center">Chargement...</div>}>
            <SuccessContent />
        </Suspense>
    )
}
