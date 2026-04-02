import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    // Enable features like automatic retries, modern API version
    apiVersion: '2024-10-28.acacia',
    appInfo: {
        name: 'Workflow CRM',
        version: '0.1.0'
    }
})
