import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET

// Rafraîchir le token d'accès si expiré
async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expires_in: number } | null> {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) return null

    try {
        const response = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: GOOGLE_CLIENT_ID,
                client_secret: GOOGLE_CLIENT_SECRET,
                refresh_token: refreshToken,
                grant_type: 'refresh_token',
            }),
        })

        if (!response.ok) return null
        return await response.json()
    } catch {
        return null
    }
}

// Récupérer les événements depuis Google Calendar
async function fetchGoogleCalendarEvents(accessToken: string) {
    const now = new Date()
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const threeMonthsFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString()

    const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${oneMonthAgo}&timeMax=${threeMonthsFromNow}&singleEvents=true&orderBy=startTime`,
        {
            headers: { Authorization: `Bearer ${accessToken}` },
        }
    )

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || 'Erreur récupération calendrier Google')
    }

    const data = await response.json()
    return data.items || []
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
        }

        // Récupérer l'intégration Google active
        const { data: integration, error: integrationError } = await supabase
            .from('email_integrations')
            .select('*')
            .eq('user_id', user.id)
            .eq('provider', 'gmail')
            .eq('is_active', true)
            .single()

        if (integrationError || !integration) {
            return NextResponse.json(
                { error: 'Aucune intégration Google active. Veuillez connecter votre compte.' },
                { status: 404 }
            )
        }

        let accessToken = integration.access_token

        // Vérifier si le token est expiré
        if (integration.token_expires_at) {
            const expiresAt = new Date(integration.token_expires_at)
            if (expiresAt < new Date() && integration.refresh_token) {
                const newTokens = await refreshAccessToken(integration.refresh_token)
                if (newTokens) {
                    accessToken = newTokens.access_token
                    await supabase
                        .from('email_integrations')
                        .update({
                            access_token: accessToken,
                            token_expires_at: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),
                        })
                        .eq('id', integration.id)
                } else {
                    return NextResponse.json(
                        { error: 'Session Google expirée. Reconnexion nécessaire.' },
                        { status: 401 }
                    )
                }
            }
        }

        try {
            // Récupérer les événements
            const googleEvents = await fetchGoogleCalendarEvents(accessToken)

            // Synchroniser avec la base locale
            let insertedCount = 0
            for (const gEvent of googleEvents) {
                // Mapper le type d'événement
                let eventType = 'meeting'
                const summary = (gEvent.summary || '').toLowerCase()
                if (summary.includes('appel') || summary.includes('call') || summary.includes('téléphone')) eventType = 'call'
                else if (summary.includes('tâche') || summary.includes('task') || summary.includes('à faire')) eventType = 'task'
                else if (summary.includes('rappel') || summary.includes('remind')) eventType = 'reminder'

                const startTime = gEvent.start?.dateTime || gEvent.start?.date
                const endTime = gEvent.end?.dateTime || gEvent.end?.date

                if (!startTime || !endTime) continue

                const eventData = {
                    user_id: user.id,
                    integration_id: integration.id,
                    external_id: gEvent.id,
                    title: gEvent.summary || 'Sans titre',
                    description: gEvent.description || '',
                    location: gEvent.location || '',
                    meeting_link: gEvent.hangoutLink || gEvent.htmlLink || '',
                    start_time: new Date(startTime).toISOString(),
                    end_time: new Date(endTime).toISOString(),
                    all_day: !!gEvent.start?.date,
                    event_type: eventType,
                    status: gEvent.status === 'confirmed' ? 'confirmed' : 'tentative',
                    updated_at: new Date().toISOString()
                }

                const { error: upsertError } = await supabase
                    .from('calendar_events')
                    .upsert(eventData, { onConflict: 'integration_id,external_id' })

                if (!upsertError) insertedCount++
            }

            // Mettre à jour la date de dernière sync sur l'intégration
            await supabase
                .from('email_integrations')
                .update({ 
                    last_sync_at: new Date().toISOString(),
                    sync_status: 'success' 
                })
                .eq('id', integration.id)

            return NextResponse.json({
                success: true,
                synced: insertedCount,
                total: googleEvents.length
            })

        } catch (syncError: any) {
            console.error('CALENDAR SYNC ERROR:', syncError)
            return NextResponse.json(
                { error: syncError.message || 'Erreur lors de la synchronisation des événements' },
                { status: 500 }
            )
        }

    } catch (error: any) {
        console.error('ROOT CALENDAR SYNC ERROR:', error)
        return NextResponse.json(
            { error: error.message || 'Erreur interne du serveur' },
            { status: 500 }
        )
    }
}
