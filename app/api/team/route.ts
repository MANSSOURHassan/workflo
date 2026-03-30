import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/team — Lister les membres + invitations en attente
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
        }

        // Membres actifs
        const { data: members, error: membersError } = await supabase
            .from('team_members')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

        if (membersError) {
            console.error('Erreur membres:', membersError)
        }

        // Invitations en attente
        const { data: invitations, error: invitationsError } = await supabase
            .from('team_invitations')
            .select('*')
            .eq('owner_id', user.id)
            .eq('status', 'pending')
            .gt('expires_at', new Date().toISOString())
            .order('created_at', { ascending: false })

        if (invitationsError) {
            console.error('Erreur invitations:', invitationsError)
        }

        return NextResponse.json({
            members: members || [],
            invitations: invitations || [],
        })

    } catch (error: any) {
        console.error('API team GET error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
