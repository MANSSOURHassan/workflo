// Types pour l'intégration email

export type EmailProvider = 'gmail' | 'outlook' | 'yahoo' | 'imap'

export interface EmailIntegration {
    id: string
    user_id: string
    provider: EmailProvider
    email: string
    access_token: string
    refresh_token: string | null
    token_expires_at: string | null
    is_active: boolean
    last_sync_at: string | null
    sync_status: 'pending' | 'syncing' | 'success' | 'error'
    sync_error: string | null
    settings: EmailIntegrationSettings
    created_at: string
    updated_at: string
}

export interface EmailIntegrationSettings {
    sync_interval: number // en minutes
    auto_sync: boolean
    sync_folders: string[]
}

export interface SyncedEmail {
    id: string
    user_id: string
    integration_id: string
    external_id: string
    thread_id: string | null
    from_email: string
    from_name: string | null
    to_emails: string[]
    cc_emails: string[]
    subject: string | null
    snippet: string | null
    body_text: string | null
    body_html: string | null
    is_read: boolean
    is_starred: boolean
    is_important: boolean
    has_attachments: boolean
    attachments: EmailAttachment[]
    labels: string[]
    folder: string
    received_at: string
    created_at: string
    prospect_id: string | null
    ai_opportunity_score: number | null
    ai_analysis: EmailAIAnalysis | null
}

export interface EmailAttachment {
    id: string
    filename: string
    mime_type: string
    size: number
    url?: string
}

export interface EmailAIAnalysis {
    is_opportunity: boolean
    opportunity_type?: 'quote_request' | 'meeting_request' | 'purchase_intent' | 'information_request'
    sentiment: 'positive' | 'neutral' | 'negative'
    summary?: string
    suggested_action?: string
    keywords: string[]
}

export interface EmailContact {
    id: string
    user_id: string
    email: string
    name: string | null
    domain: string | null
    email_count: number
    last_email_at: string | null
    first_email_at: string | null
    prospect_id: string | null
    created_at: string
    updated_at: string
}

// Input types pour les formulaires
export interface ConnectEmailInput {
    provider: EmailProvider
    code: string // Code OAuth retourné par Google/Microsoft
    redirect_uri: string
}

export interface EmailSyncOptions {
    folders?: string[]
    since?: Date
    limit?: number
}
