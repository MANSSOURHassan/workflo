import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
        }

        const { to, subject, message } = await request.json()

        if (!to || !subject || !message) {
            return NextResponse.json({ error: 'Champs manquants' }, { status: 400 })
        }

        const { data: integration, error: integrationError } = await supabase
            .from('email_integrations')
            .select('*')
            .eq('user_id', user.id)
            .eq('provider', 'gmail')
            .eq('is_active', true)
            .single()

        if (integrationError || !integration) {
            return NextResponse.json({ error: 'Aucune intégration Gmail active. Veuillez connecter votre compte Google dans les paramètres ou sur la page Emails.' }, { status: 400 })
        }

        let accessToken = integration.access_token

        // Logique de rafraîchissement si nécessaire (similaire à sync/route.ts)
        // Pour simplifier ici on assume que le token est valide ou a été refresh récemment par le sync
        // On pourrait importer la logique de refresh ici aussi

        // Construire l'email au format RFC 822
        const str = [
            `To: ${to}`,
            `Subject: ${subject}`,
            "Content-Type: text/html; charset=utf-8",
            "MIME-Version: 1.0",
            "",
            message
        ].join("\r\n")

        const encodedMail = Buffer.from(str)
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '')

        const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                raw: encodedMail
            })
        })

        if (!response.ok) {
            const error = await response.json()
            console.error('BREEZE SEND ERROR:', error)
            return NextResponse.json({ error: 'Erreur lors de l\'envois via Gmail' }, { status: response.status })
        }

        return NextResponse.json({ success: true })

    } catch (error: any) {
        console.error('API SEND ERROR:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
