import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const { priceId } = await req.json()

        if (!priceId) {
            return new NextResponse('Missing priceId', { status: 400 })
        }

        // Vérifier si l'utilisateur a déjà un Customer ID dans Supabase
        const { data: customerData } = await supabase
            .from('customers')
            .select('stripe_customer_id')
            .eq('id', user.id)
            .single()

        let customerId = customerData?.stripe_customer_id

        if (!customerId) {
            // Créer un nouveau client Stripe
            const newCustomer = await stripe.customers.create({
                email: user.email,
                metadata: {
                    supabase_user_id: user.id
                }
            })
            customerId = newCustomer.id

            // Enregistrer dans Supabase
            await supabase
                .from('customers')
                .insert({ id: user.id, stripe_customer_id: customerId })
        }

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'

        // Créer la session de checkout pour un abonnement avec 1 mois d'essai sans carte obligatoire
        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            mode: 'subscription',
            payment_method_types: ['card'],
            payment_method_collection: 'if_required',
            subscription_data: {
                trial_period_days: 30,
            },
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            success_url: `${appUrl}/dashboard/billing/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${appUrl}/dashboard/billing`,
            metadata: {
                user_id: user.id
            }
        })

        return NextResponse.json({ url: session.url })

    } catch (error: any) {
        console.error('Stripe Checkout Error:', error)
        return new NextResponse(error.message || 'Internal Server Error', { status: 500 })
    }
}
