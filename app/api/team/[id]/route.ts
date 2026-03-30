import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// DELETE /api/team/[id] — Supprimer un membre ou annuler une invitation
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
        }

        const { id } = await params  // ← await obligatoire en Next.js 15+

        if (!id || id === 'undefined') {
            return NextResponse.json({ error: 'ID manquant' }, { status: 400 })
        }

        const url = new URL(request.url)
        const type = url.searchParams.get('type') // 'member' | 'invitation'

        if (type === 'invitation') {
            // Utiliser adminClient pour contourner RLS sur team_invitations
            let dbClient: any
            try {
                dbClient = createAdminClient()
            } catch {
                dbClient = supabase
            }

            const { error } = await dbClient
                .from('team_invitations')
                .update({ status: 'cancelled' })
                .eq('id', id)
                .eq('owner_id', user.id)

            if (error) {
                console.error('Erreur annulation invitation:', error)
                return NextResponse.json({ error: error.message }, { status: 500 })
            }

            return NextResponse.json({ success: true, message: 'Invitation annulée' })
        }

        // Supprimer un membre
        const { error } = await supabase
            .from('team_members')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id)

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, message: 'Membre supprimé' })

    } catch (error: any) {
        console.error('API team DELETE error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
