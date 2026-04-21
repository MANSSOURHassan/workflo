import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    // Enable features like automatic retries, modern API version
    apiVersion: '2026-03-25.dahlia',
    appInfo: {
        name: 'Workflow CRM',
        version: '0.1.0'
    }
})
