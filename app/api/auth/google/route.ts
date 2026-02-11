import { NextRequest, NextResponse } from 'next/server'

// Configuration Google OAuth
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback/google`

// Scopes Gmail nécessaires
const GMAIL_SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile'
].join(' ')

export async function GET(request: NextRequest) {
    if (!GOOGLE_CLIENT_ID) {
        return NextResponse.json(
            { error: 'Configuration Google manquante' },
            { status: 500 }
        )
    }

    // Construire l'URL d'autorisation Google
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')

    authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID)
    authUrl.searchParams.set('redirect_uri', REDIRECT_URI)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('scope', GMAIL_SCOPES)
    authUrl.searchParams.set('access_type', 'offline') // Pour obtenir refresh_token
    authUrl.searchParams.set('prompt', 'consent') // Force le consentement pour refresh_token
    authUrl.searchParams.set('include_granted_scopes', 'true')

    // Rediriger vers Google
    return NextResponse.redirect(authUrl.toString())
}
