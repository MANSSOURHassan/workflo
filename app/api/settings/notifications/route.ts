import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET — Charger les préférences de notification
export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

        const { data, error } = await supabase
            .from('user_settings')
            .select('email_notifications, push_notifications, marketing_emails, weekly_report')
            .eq('user_id', user.id)
            .maybeSingle()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })

        // Valeurs par défaut si pas encore de ligne
        return NextResponse.json({
            email_new_lead:          data?.email_notifications ?? true,
            email_deal_won:          data?.email_notifications ?? true,
            email_deal_lost:         false,
            email_campaign_completed:data?.email_notifications ?? true,
            email_weekly_report:     data?.weekly_report ?? true,
            push_new_lead:           data?.push_notifications ?? true,
            push_deal_update:        data?.push_notifications ?? true,
            push_task_reminder:      data?.push_notifications ?? true,
            marketing_emails:        data?.marketing_emails ?? false,
        })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}

// POST — Sauvegarder les préférences de notification
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

        const body = await request.json()

        // Mapper les toggles vers les colonnes DB
        const emailOn = body.email_new_lead || body.email_deal_won || body.email_campaign_completed
        const pushOn  = body.push_new_lead || body.push_deal_update || body.push_task_reminder

        const { error } = await supabase
            .from('user_settings')
            .upsert({
                user_id:              user.id,
                email_notifications:  emailOn,
                push_notifications:   pushOn,
                marketing_emails:     body.marketing_emails ?? false,
                weekly_report:        body.email_weekly_report ?? true,
            }, { onConflict: 'user_id' })

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })

        return NextResponse.json({ success: true, message: 'Préférences enregistrées' })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
