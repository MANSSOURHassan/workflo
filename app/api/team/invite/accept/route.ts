import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/team/invite/accept — Accepter une invitation via token
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json(
                { error: 'Vous devez être connecté pour accepter une invitation', requiresLogin: true },
                { status: 401 }
            )
        }

        let body: any
        try {
            body = await request.json()
        } catch {
            return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 })
        }

        const { token } = body

        if (!token) {
            return NextResponse.json({ error: 'Token manquant' }, { status: 400 })
        }

        // Essayer d'abord avec adminClient (bypass RLS), sinon fallback client normal
        let dbClient: any = supabase
        try {
            const { createAdminClient } = await import('@/lib/supabase/admin')
            dbClient = createAdminClient()
        } catch {
            // Service role key non configurée → utiliser le client normal
            // Nécessite une politique RLS SELECT pour les invités
        }

        // Chercher l'invitation par token
        const { data: invitation, error: inviteError } = await dbClient
            .from('team_invitations')
            .select('*')
            .eq('token', token)
            .eq('status', 'pending')
            .maybeSingle()

        if (inviteError) {
            console.error('Erreur lecture invitation:', inviteError)
            return NextResponse.json({ error: 'Impossible de vérifier l\'invitation. Vérifiez la configuration Supabase.' }, { status: 500 })
        }

        if (!invitation) {
            return NextResponse.json({ error: 'Invitation invalide ou déjà utilisée' }, { status: 404 })
        }

        // Vérifier expiration
        if (new Date(invitation.expires_at) < new Date()) {
            await dbClient
                .from('team_invitations')
                .update({ status: 'expired' })
                .eq('id', invitation.id)
            return NextResponse.json({ error: 'Cette invitation a expiré' }, { status: 410 })
        }

        // Vérifier que l'email correspond
        if (user.email?.toLowerCase() !== invitation.email.toLowerCase()) {
            return NextResponse.json({
                error: `Cette invitation est destinée à ${invitation.email}. Connectez-vous avec cet email pour accepter.`
            }, { status: 403 })
        }

        // Vérifier si déjà membre
        const { data: existingMember } = await dbClient
            .from('team_members')
            .select('id')
            .eq('user_id', invitation.owner_id)
            .eq('email', invitation.email)
            .maybeSingle()

        if (existingMember) {
            await dbClient
                .from('team_invitations')
                .update({ status: 'accepted' })
                .eq('id', invitation.id)
            return NextResponse.json({ success: true, message: 'Vous êtes déjà membre de cette équipe' })
        }

        // Insérer le membre dans team_members
        const { error: memberError } = await dbClient
            .from('team_members')
            .insert({
                user_id: invitation.owner_id,
                owner_id: invitation.owner_id,
                member_user_id: user.id,
                email: invitation.email,
                role: invitation.role,
                is_active: true,
                status: 'active',
                joined_at: new Date().toISOString(),
            })

        if (memberError) {
            console.error('Erreur insertion membre:', memberError)
            return NextResponse.json({ error: 'Erreur lors de l\'ajout à l\'équipe' }, { status: 500 })
        }

        // Marquer invitation comme acceptée
        await dbClient
            .from('team_invitations')
            .update({ status: 'accepted' })
            .eq('id', invitation.id)

        return NextResponse.json({
            success: true,
            message: 'Invitation acceptée ! Vous avez rejoint l\'équipe.',
        })

    } catch (error: any) {
        console.error('API accept invitation error:', error)
        return NextResponse.json({ error: 'Erreur serveur : ' + (error.message || 'inconnu') }, { status: 500 })
    }
}
