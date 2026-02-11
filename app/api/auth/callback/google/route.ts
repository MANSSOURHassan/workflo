import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback/google`

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    // Gérer les erreurs de Google
    if (error) {
        console.error('Erreur Google OAuth:', error)
        return NextResponse.redirect(
            `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/email?error=oauth_denied`
        )
    }

    if (!code) {
        return NextResponse.redirect(
            `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/email?error=no_code`
        )
    }

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
        return NextResponse.redirect(
            `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/email?error=config_missing`
        )
    }

    try {
        // Échanger le code contre un access token
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: GOOGLE_CLIENT_ID,
                client_secret: GOOGLE_CLIENT_SECRET,
                code,
                grant_type: 'authorization_code',
                redirect_uri: REDIRECT_URI,
            }),
        })

        if (!tokenResponse.ok) {
            const errorData = await tokenResponse.json()
            console.error('Erreur token Google:', errorData)
            return NextResponse.redirect(
                `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/email?error=token_exchange_failed`
            )
        }

        const tokens = await tokenResponse.json()
        const { access_token, refresh_token, expires_in } = tokens

        // Récupérer les infos de l'utilisateur Google
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        })

        if (!userInfoResponse.ok) {
            return NextResponse.redirect(
                `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/email?error=user_info_failed`
            )
        }

        const userInfo = await userInfoResponse.json()
        const googleEmail = userInfo.email

        // Sauvegarder dans Supabase
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.redirect(
                `${process.env.NEXT_PUBLIC_SITE_URL}/auth/login?error=not_authenticated`
            )
        }

        // Insérer ou mettre à jour l'intégration
        const token_expires_at = expires_in
            ? new Date(Date.now() + expires_in * 1000).toISOString()
            : null

        const { error: dbError } = await supabase
            .from('email_integrations')
            .upsert({
                user_id: user.id,
                provider: 'gmail',
                email: googleEmail,
                access_token,
                refresh_token: refresh_token || null,
                token_expires_at,
                is_active: true,
                sync_status: 'pending',
                last_sync_at: null,
            }, {
                onConflict: 'user_id,provider,email'
            })

        if (dbError) {
            console.error('Erreur sauvegarde intégration:', dbError)
            return NextResponse.redirect(
                `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/email?error=save_failed`
            )
        }

        // Succès ! Rediriger vers la page email
        return NextResponse.redirect(
            `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/email?success=gmail_connected&email=${encodeURIComponent(googleEmail)}`
        )

    } catch (error) {
        console.error('Erreur callback Google:', error)
        return NextResponse.redirect(
            `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/email?error=unknown`
        )
    }
}
