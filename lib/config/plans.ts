export type PlanType = 'starter' | 'pro' | 'enterprise';

export interface PlanConfig {
    name: string;
    maxProspects: number;
    maxUsers: number;
    maxEmailsPerMonth: number;
    features: string[];
}

export const PLANS: Record<PlanType, PlanConfig> = {
    starter: {
        name: 'Starter',
        maxProspects: 500,
        maxUsers: 1,
        maxEmailsPerMonth: 1000,
        features: ['500 prospects', '1 utilisateur', '1 000 emails/mois', 'Support email'],
    },
    pro: {
        name: 'Pro',
        maxProspects: 5000,
        maxUsers: 5,
        maxEmailsPerMonth: 10000,
        features: ['5 000 prospects', '5 utilisateurs', '10 000 emails/mois', 'Scoring IA avancé', 'Support prioritaire'],
    },
    enterprise: {
        name: 'Enterprise',
        maxProspects: Infinity,
        maxUsers: Infinity,
        maxEmailsPerMonth: Infinity,
        features: ['Prospects illimités', 'Utilisateurs illimités', 'API complète', 'SSO & SAML', 'Support dédié'],
    },
};
