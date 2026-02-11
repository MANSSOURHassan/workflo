'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidateTag } from 'next/cache'
import { PlanType } from '@/lib/config/plans'

export async function updateSubscriptionPlan(plan: PlanType) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Non autorisé' }
    }

    // On utilise une fonction SQL (RPC) pour contourner les problèmes de cache (PGRST204)
    const { error } = await supabase.rpc('update_user_plan', {
        user_id_input: user.id,
        new_plan: plan
    })

    if (error) {
        console.error('Erreur Supabase lors du changement de plan:', error)
        return { error: `Échec de mise à jour: ${error.message} (Code: ${error.code})` }
    }

    revalidateTag('profile', 'max')
    return { success: true }
}
