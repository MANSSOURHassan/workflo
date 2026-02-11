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

// Récupérer les emails depuis Gmail
async function fetchGmailMessages(accessToken: string, maxResults: number = 50) {
    // Liste des messages
    const listResponse = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}&labelIds=INBOX`,
        {
            headers: { Authorization: `Bearer ${accessToken}` },
        }
    )

    if (!listResponse.ok) {
        throw new Error('Erreur récupération liste messages')
    }

    const listData = await listResponse.json()
    const messages = listData.messages || []

    // Récupérer les détails de chaque message
    const detailedMessages = await Promise.all(
        messages.slice(0, 20).map(async (msg: { id: string }) => {
            const msgResponse = await fetch(
                `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
                {
                    headers: { Authorization: `Bearer ${accessToken}` },
                }
            )
            if (!msgResponse.ok) return null
            return await msgResponse.json()
        })
    )

    return detailedMessages.filter(Boolean)
}

// Parser les headers d'un email Gmail
function parseEmailHeaders(headers: { name: string; value: string }[]) {
    const getHeader = (name: string) =>
        headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || null

    const fromHeader = getHeader('From') || ''
    const fromMatch = fromHeader.match(/^(?:"?([^"]*)"?\s)?<?([^>]+)>?$/)

    return {
        from_name: fromMatch?.[1]?.trim() || null,
        from_email: fromMatch?.[2]?.trim() || fromHeader,
        subject: getHeader('Subject'),
        to: getHeader('To'),
        cc: getHeader('Cc'),
        date: getHeader('Date'),
    }
}

// Parser les destinataires
function parseRecipients(recipients: string | null): string[] {
    if (!recipients) return []
    return recipients.split(',').map(r => {
        const match = r.match(/<([^>]+)>/)
        return match ? match[1].trim() : r.trim()
    }).filter(Boolean)
}

// Extraire le corps de l'email
function extractBody(payload: any): { text: string | null; html: string | null } {
    let text: string | null = null
    let html: string | null = null

    function parsePayload(part: any) {
        if (part.mimeType === 'text/plain' && part.body?.data) {
            text = Buffer.from(part.body.data, 'base64').toString('utf-8')
        }
        if (part.mimeType === 'text/html' && part.body?.data) {
            html = Buffer.from(part.body.data, 'base64').toString('utf-8')
        }
        if (part.parts) {
            part.parts.forEach(parsePayload)
        }
    }

    parsePayload(payload)
    return { text, html }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
        }

        // Récupérer l'intégration active
        const { data: integration, error: integrationError } = await supabase
            .from('email_integrations')
            .select('*')
            .eq('user_id', user.id)
            .eq('provider', 'gmail')
            .eq('is_active', true)
            .single()

        if (integrationError || !integration) {
            return NextResponse.json(
                { error: 'Aucune intégration Gmail active' },
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
                    // Mettre à jour le token en base
                    await supabase
                        .from('email_integrations')
                        .update({
                            access_token: accessToken,
                            token_expires_at: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),
                        })
                        .eq('id', integration.id)
                } else {
                    return NextResponse.json(
                        { error: 'Token expiré, reconnexion nécessaire' },
                        { status: 401 }
                    )
                }
            }
        }

        // Marquer comme en cours de sync
        await supabase
            .from('email_integrations')
            .update({ sync_status: 'syncing' })
            .eq('id', integration.id)

        try {
            // Récupérer les emails
            const messages = await fetchGmailMessages(accessToken, 50)

            // Insérer les emails en base
            let insertedCount = 0
            for (const message of messages) {
                if (!message) continue

                const headers = parseEmailHeaders(message.payload.headers || [])
                const { text, html } = extractBody(message.payload)

                const emailData = {
                    user_id: user.id,
                    integration_id: integration.id,
                    external_id: message.id,
                    thread_id: message.threadId,
                    from_email: headers.from_email,
                    from_name: headers.from_name,
                    to_emails: parseRecipients(headers.to),
                    cc_emails: parseRecipients(headers.cc),
                    subject: headers.subject,
                    snippet: message.snippet,
                    body_text: text,
                    body_html: html,
                    is_read: !message.labelIds?.includes('UNREAD'),
                    is_starred: message.labelIds?.includes('STARRED') || false,
                    is_important: message.labelIds?.includes('IMPORTANT') || false,
                    has_attachments: message.payload.parts?.some((p: any) => p.filename) || false,
                    labels: message.labelIds || [],
                    folder: 'INBOX',
                    received_at: new Date(parseInt(message.internalDate)).toISOString(),
                }

                const { error: insertError } = await supabase
                    .from('synced_emails')
                    .upsert(emailData, { onConflict: 'integration_id,external_id' })

                if (!insertError) insertedCount++

                // Ajouter/mettre à jour le contact
                if (headers.from_email) {
                    const domain = headers.from_email.split('@')[1] || null
                    await supabase
                        .from('email_contacts')
                        .upsert({
                            user_id: user.id,
                            email: headers.from_email,
                            name: headers.from_name,
                            domain,
                            email_count: 1,
                            last_email_at: emailData.received_at,
                            first_email_at: emailData.received_at,
                        }, {
                            onConflict: 'user_id,email',
                            ignoreDuplicates: false
                        })
                }
            }

            // Marquer sync comme terminée
            await supabase
                .from('email_integrations')
                .update({
                    sync_status: 'success',
                    last_sync_at: new Date().toISOString(),
                    sync_error: null
                })
                .eq('id', integration.id)

            return NextResponse.json({
                success: true,
                synced: insertedCount,
                total: messages.length
            })

        } catch (syncError: any) {
            console.error('DETAILED SYNC ERROR:', syncError)
            // Marquer sync comme en erreur
            await supabase
                .from('email_integrations')
                .update({
                    sync_status: 'error',
                    sync_error: syncError.message
                })
                .eq('id', integration.id)

            return NextResponse.json(
                { error: syncError.message || 'Erreur lors de la synchronisation' },
                { status: 500 }
            )
        }

    } catch (error: any) {
        console.error('ROOT SYNC ERROR:', error)
        return NextResponse.json(
            { error: error.message || 'Erreur lors de la synchronisation' },
            { status: 500 }
        )
    }
}
