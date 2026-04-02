import { stripe } from '@/lib/stripe'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// IMPORTANT: Webhook handler needs access to the raw body
export async function POST(req: Request) {
    const body = await req.text()
    const signature = (await headers()).get('Stripe-Signature') as string

    let event

    try {
        // Validation cryptographique que l'appel vient bien de Stripe
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        )
    } catch (error: any) {
        console.error('Webhook signature verification failed.', error.message)
        return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 })
    }

    // Utiliser le mode Service Role pour contourner les règles RLS (car serveur-à-serveur)
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as any

                // Stripe Checkout completed. Let's record the subscription if it's there
                if (session.mode === 'subscription' && session.subscription) {
                    const subscriptionId = session.subscription as string
                    const customerId = session.customer as string
                    
                    // Fetch full subscription details from Stripe
                    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
                    
                    // Get the supabase user id from Stripe customer metadata
                    const customer = await stripe.customers.retrieve(customerId) as any
                    const userId = customer.metadata?.supabase_user_id || session.metadata?.user_id

                    if (userId) {
                        await supabase
                            .from('subscriptions')
                            .upsert({
                                id: subscription.id,
                                user_id: userId,
                                status: subscription.status,
                                price_id: subscription.items.data[0].price.id,
                                quantity: subscription.items.data[0].quantity,
                                cancel_at_period_end: subscription.cancel_at_period_end,
                                current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
                                current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                                created_at: new Date(subscription.created * 1000).toISOString(),
                                ended_at: subscription.ended_at ? new Date(subscription.ended_at * 1000).toISOString() : null,
                                cancel_at: subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : null,
                                canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
                            })
                    }
                }
                break
            }
            case 'customer.subscription.updated':
            case 'customer.subscription.deleted': {
                const subscription = event.data.object as any
                
                await supabase
                    .from('subscriptions')
                    .update({
                        status: subscription.status,
                        price_id: subscription.items.data[0].price.id,
                        quantity: subscription.items.data[0].quantity,
                        cancel_at_period_end: subscription.cancel_at_period_end,
                        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
                        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                        ended_at: subscription.ended_at ? new Date(subscription.ended_at * 1000).toISOString() : null,
                        cancel_at: subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : null,
                        canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
                    })
                    .eq('id', subscription.id)
                break
            }
            default:
                // Unhandled event type
                break
        }
    } catch (dbError) {
        console.error('Error inserting webhook data to Supabase:', dbError)
        return new NextResponse('Database insertion failed', { status: 500 })
    }

    return new NextResponse('Webhook handled successfully', { status: 200 })
}
