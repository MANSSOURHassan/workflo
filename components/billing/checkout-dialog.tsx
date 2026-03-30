'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CreditCard, Lock, ShoppingCart, Loader2, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

interface CheckoutDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    mode: 'payment_method' | 'checkout'
    plan?: { name: string, price: string, features?: string[] } | null
    onConfirm: () => Promise<void>
}

export function CheckoutDialog({ open, onOpenChange, mode, plan, onConfirm }: CheckoutDialogProps) {
    const [loading, setLoading] = useState(false)
    const [cardNumber, setCardNumber] = useState('')
    const [expiry, setExpiry] = useState('')
    const [cvc, setCvc] = useState('')
    const [name, setName] = useState('')

    const formatCardNumber = (value: string) => {
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
        const matches = v.match(/\d{4,16}/g)
        const match = matches && matches[0] || ''
        const parts = []

        for (let i = 0, len = match.length; i < len; i += 4) {
            parts.push(match.substring(i, i + 4))
        }

        if (parts.length) {
            return parts.join(' ')
        } else {
            return value
        }
    }

    const formatExpiry = (value: string) => {
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
        if (v.length >= 2) {
            return `${v.substring(0, 2)}/${v.substring(2, 4)}`
        }
        return v
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1500))

        try {
            await onConfirm()
            onOpenChange(false)
        } catch (error) {
            // Error handled in parent or toast here
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {mode === 'checkout' ? 'Panier & Paiement' : 'Mettre à jour le paiement'}
                    </DialogTitle>
                    <DialogDescription>
                        {mode === 'checkout'
                            ? 'Vérifiez votre commande et procédez au paiement sécurisé.'
                            : 'Modifiez vos informations de paiement pour les prochains prélèvements.'}
                    </DialogDescription>
                </DialogHeader>

                {mode === 'checkout' && plan && (
                    <div className="bg-muted/50 p-4 rounded-lg space-y-3 mb-4 border">
                        <div className="flex items-center gap-2 font-medium text-primary">
                            <ShoppingCart className="h-4 w-4" />
                            <span className="text-sm uppercase tracking-wide">Résumé de la commande</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span>Plan {plan.name} (Mensuel)</span>
                            <span className="font-bold">{plan.price}€</span>
                        </div>
                        {plan.features && plan.features.length > 0 && (
                            <div className="pt-2 text-xs text-muted-foreground border-t border-border mt-2 space-y-1">
                                <p className="font-semibold text-foreground mb-2">Fonctionnalités incluses :</p>
                                <ul className="space-y-2">
                                    {plan.features.map((feature, idx) => (
                                        <li key={idx} className="flex items-start gap-2">
                                            <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        <div className="border-t border-border pt-2 flex justify-between items-center font-bold text-lg mt-2">
                            <span>Total à payer</span>
                            <span>{plan.price}€</span>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nom sur la carte</Label>
                        <Input
                            id="name"
                            placeholder="Jean Dupont"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="cardNumber">Numéro de carte</Label>
                        <div className="relative">
                            <CreditCard className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="cardNumber"
                                placeholder="0000 0000 0000 0000"
                                className="pl-9"
                                value={cardNumber}
                                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                                maxLength={19}
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="expiry">Expire</Label>
                            <Input
                                id="expiry"
                                placeholder="MM/YY"
                                value={expiry}
                                onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                                maxLength={5}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="cvc">CVC</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="cvc"
                                    placeholder="123"
                                    className="pl-9"
                                    value={cvc}
                                    onChange={(e) => setCvc(e.target.value)}
                                    maxLength={3}
                                    type="password"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="mt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                            Annuler
                        </Button>
                        <Button type="submit" className="w-full sm:w-auto" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Traitement...
                                </>
                            ) : (
                                mode === 'checkout' ? (
                                    <>
                                        Payer {plan?.price}€
                                    </>
                                ) : 'Enregistrer la carte'
                            )}
                        </Button>
                    </DialogFooter>
                </form>

                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-2">
                    <Lock className="h-3 w-3" />
                    Paiement 100% sécurisé via Stripe
                </div>
            </DialogContent>
        </Dialog>
    )
}
