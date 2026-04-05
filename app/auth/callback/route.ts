import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/dashboard'

    if (code) {
        const supabase = await createClient()
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error && data.user) {
            // Récupérer le plan depuis les metadata (défini lors de l'inscription)
            const chosenPlan = data.user.user_metadata?.plan || 'starter'
            const validPlans = ['starter', 'pro', 'enterprise']
            const plan = validPlans.includes(chosenPlan) ? chosenPlan : 'starter'

            // Mettre à jour le profil avec le plan choisi (la table profiles existe maintenant)
            // On utilise upsert pour gérer le cas où le profil n'existe pas encore
            await supabase
                .from('profiles')
                .upsert({
                    id: data.user.id,
                    plan,
                    full_name: `${data.user.user_metadata?.first_name || ''} ${data.user.user_metadata?.last_name || ''}`.trim() || null,
                    email: data.user.email,
                }, { onConflict: 'id', ignoreDuplicates: false })

            return NextResponse.redirect(`${origin}${next}`)
        }
    }

    // Return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/error`)
}
