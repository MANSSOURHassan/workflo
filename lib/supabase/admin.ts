import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Admin client with service role — bypasses RLS.
 * Use ONLY in server-side API routes, NEVER in client components.
 */
export function createAdminClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    if (!serviceRoleKey || serviceRoleKey === 'YOUR_SERVICE_ROLE_KEY_HERE' || !serviceRoleKey.startsWith('eyJ')) {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY non configurée')
    }

    return createSupabaseClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    })
}
