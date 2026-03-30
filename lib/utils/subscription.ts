import { createClient } from '@/lib/supabase/server';
import { PLANS, PlanType } from '@/lib/config/plans';

export async function getUserPlan(supabaseClient?: any, userObj?: any) {
    const supabase = supabaseClient || await createClient();
    const user = userObj || (await supabase.auth.getUser()).data.user;

    if (!user) return null;

    const { data: profile } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', user.id)
        .single();

    const planType = (profile?.plan as PlanType) || 'starter';
    return PLANS[planType];
}

export async function checkLimit(type: 'prospects' | 'users' | 'emails', supabaseClient?: any, userObj?: any) {
    const supabase = supabaseClient || await createClient();
    const user = userObj || (await supabase.auth.getUser()).data.user;

    if (!user) return { allowed: false, error: 'Utilisateur non connecté' };

    // Run both queries in parallel to save time
    const [plan, countData] = await Promise.all([
        getUserPlan(supabase, user),
        type === 'prospects' 
            ? supabase.from('prospects').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
            : type === 'users'
            ? supabase.from('team_members').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
            : null // Emails check handles separately due to date filter
    ]);

    if (!plan) return { allowed: false, error: 'Plan non trouvé' };

    if (type === 'prospects' || type === 'users') {
        const { count, error } = countData!;
        if (error) return { allowed: false, error: 'Erreur lors de la vérification des limites' };
        
        const maxLimit = type === 'prospects' ? plan.maxProspects : plan.maxUsers;
        if (count !== null && count >= maxLimit) {
            return {
                allowed: false,
                error: `Limite de ${type === 'prospects' ? 'prospects' : "membres d'équipe"} atteinte pour le plan ${plan.name} (${maxLimit}). Veuillez passer au plan supérieur.`
            };
        }
    }

    // Pour les emails, nous aurions besoin d'une table de logs ou d'agréger les envois du mois en cours
    // Ici on fait une vérification simplifiée sur les recipients
    if (type === 'emails') {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { count, error } = await supabase
            .from('campaign_recipients')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', startOfMonth.toISOString());

        if (error) return { allowed: false, error: 'Erreur lors de la vérification des emails' };

        if (count !== null && count >= plan.maxEmailsPerMonth) {
            return {
                allowed: false,
                error: `Limite d'emails mensuelle atteinte pour le plan ${plan.name} (${plan.maxEmailsPerMonth}). Veuillez passer au plan supérieur.`
            };
        }
    }

    return { allowed: true };
}
