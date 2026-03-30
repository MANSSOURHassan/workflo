import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { PLANS, PlanType } from '@/lib/config/plans'

// POST /api/team/invite — Envoyer une invitation
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
        }

        const { email, role = 'member' } = await request.json()

        if (!email || !email.includes('@')) {
            return NextResponse.json({ error: 'Email invalide' }, { status: 400 })
        }

        const inviteeEmail = email.trim().toLowerCase()

        // Vérification du plan
        const { data: profile } = await supabase
            .from('profiles')
            .select('plan')
            .eq('id', user.id)
            .single()

        const planType = (profile?.plan as PlanType) || 'starter'
        const plan = PLANS[planType]

        // Compter les membres actifs + invitations en attente
        const { count: memberCount } = await supabase
            .from('team_members')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)

        const { count: pendingCount } = await supabase
            .from('team_invitations')
            .select('*', { count: 'exact', head: true })
            .eq('owner_id', user.id)
            .eq('status', 'pending')

        const totalUsed = (memberCount || 0) + (pendingCount || 0)

        if (plan.maxUsers !== Infinity && totalUsed >= plan.maxUsers) {
            return NextResponse.json({
                error: `Limite de membres atteinte pour le plan ${plan.name} (${plan.maxUsers}). Passez au plan supérieur.`
            }, { status: 403 })
        }

        // Vérifier si déjà membre actif
        const { data: existingMember } = await supabase
            .from('team_members')
            .select('id')
            .eq('user_id', user.id)
            .eq('email', inviteeEmail)
            .maybeSingle()

        if (existingMember) {
            return NextResponse.json({ error: 'Cet email est déjà membre de votre équipe' }, { status: 409 })
        }

        const newExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

        // Créer une nouvelle invitation (simple INSERT)
        const { data: invitation, error: inviteError } = await supabase
            .from('team_invitations')
            .insert({
                owner_id: user.id,
                email: inviteeEmail,
                role,
                status: 'pending',
                expires_at: newExpiry,
            })
            .select()
            .single()

        if (inviteError || !invitation) {
            console.error('Erreur insertion invitation:', inviteError)
            return NextResponse.json({ error: inviteError?.message || 'Erreur lors de la création de l\'invitation' }, { status: 500 })
        }

        // Récupérer le nom de l'owner pour l'email
        const { data: ownerProfile } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', user.id)
            .single()

        const ownerName = ownerProfile?.full_name || user.email || 'L\'équipe'
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
        const acceptUrl = `${siteUrl}/auth/invitation?token=${invitation.token}&owner=${user.id}`

        // Envoyer l'email via Supabase Admin (inviteUserByEmail)
        // Envoyer l'email via Resend
        const { sendInvitationEmail } = await import('@/lib/email/invitation')
        const emailResult = await sendInvitationEmail({
            to: inviteeEmail,
            ownerName,
            role,
            acceptUrl,
            expiresAt: invitation.expires_at,
        })

        if (!emailResult.success) {
            console.warn('Email non envoyé:', emailResult.error)
        }

        return NextResponse.json({
            success: true,
            message: `Invitation envoyée à ${inviteeEmail}`,
            invitationLink: acceptUrl,
            emailSent: true,
            invitation: {
                id: invitation.id,
                email: invitation.email,
                role: invitation.role,
                status: invitation.status,
                expires_at: invitation.expires_at,
            }
        })

    } catch (error: any) {
        console.error('API invite error:', error)
        return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 })
    }
}
