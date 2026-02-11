import { createClient } from '@/lib/supabase/client';
import { PLANS, PlanType } from '@/lib/config/plans';

export async function getUserPlan() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', user.id)
        .single();

    const planType = (profile?.plan as PlanType) || 'starter';
    return PLANS[planType];
}

export async function checkLimit(type: 'prospects' | 'users' | 'emails') {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { allowed: false, error: 'Utilisateur non connecté' };

    const plan = await getUserPlan();
    if (!plan) return { allowed: false, error: 'Plan non trouvé' };

    if (type === 'prospects') {
        const { count, error } = await supabase
            .from('prospects')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);

        if (error) return { allowed: false, error: 'Erreur lors de la vérification des prospects' };

        if (count !== null && count >= plan.maxProspects) {
            return {
                allowed: false,
                error: `Limite de prospects atteinte pour le plan ${plan.name} (${plan.maxProspects}). Veuillez passer au plan supérieur.`
            };
        }
    }

    if (type === 'users') {
        const { count, error } = await supabase
            .from('team_members')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);

        if (error) return { allowed: false, error: 'Erreur lors de la vérification de l\'équipe' };

        if (count !== null && count >= plan.maxUsers) {
            return {
                allowed: false,
                error: `Limite de membres d'équipe atteinte pour le plan ${plan.name} (${plan.maxUsers}). Veuillez passer au plan supérieur.`
            };
        }
    }

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
