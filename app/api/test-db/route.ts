import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET() {
    try {
        const cookieStore = await cookies()

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll()
                    },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) =>
                                cookieStore.set(name, value, options),
                            )
                        } catch {
                            // ignore
                        }
                    },
                },
            },
        )

        // Test 1: Connexion basique
        const connectionTest = {
            supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Configuré' : '❌ Manquant',
            supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Configuré' : '❌ Manquant',
        }

        // Test 2: Auth
        let authTest = { success: false, user: null as string | null, error: null as string | null }
        try {
            const { data: { user }, error } = await supabase.auth.getUser()
            authTest = {
                success: !!user,
                user: user?.email || null,
                error: error?.message || (user ? null : 'Non connecté')
            }
        } catch (e: any) {
            authTest.error = e.message
        }

        // Test 3: Tables principales
        const tables: Record<string, { exists: boolean; error: string | null }> = {}

        const tablesToTest = [
            'profiles',
            'prospects',
            'pipelines',
            'deals',
            'campaigns',
            'tasks',
            'email_integrations',
            'synced_emails',
            'email_contacts'
        ]

        for (const table of tablesToTest) {
            try {
                const { error } = await supabase.from(table).select('id').limit(1)
                tables[table] = { exists: !error, error: error?.message || null }
            } catch (e: any) {
                tables[table] = { exists: false, error: e.message }
            }
        }

        // Compter les tables OK
        const tablesOk = Object.values(tables).filter(t => t.exists).length
        const totalTables = Object.keys(tables).length

        return NextResponse.json({
            status: tablesOk === totalTables
                ? '✅ Tout fonctionne !'
                : `⚠️ ${tablesOk}/${totalTables} tables OK`,
            timestamp: new Date().toISOString(),
            connection: connectionTest,
            auth: authTest,
            tables
        })

    } catch (error: any) {
        return NextResponse.json({
            status: '❌ Erreur critique',
            error: error.message,
            stack: error.stack
        }, { status: 500 })
    }
}
