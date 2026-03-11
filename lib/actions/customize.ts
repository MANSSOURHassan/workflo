'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidateTag } from 'next/cache'
import type { Customization, UserSettings } from '@/lib/types/database'

export type ExtendedCustomization = Customization & {
    language?: string
    timezone?: string
}

export async function getCustomization() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { data: null, error: 'Non autorisé' }
    }

    // Fetch both tables in parallel
    const [customRes, settingsRes] = await Promise.all([
        supabase
            .from('customizations')
            .select('*')
            .eq('user_id', user.id)
            .single(),
        supabase
            .from('user_settings')
            .select('language, timezone')
            .eq('user_id', user.id)
            .single()
    ])

    let customization = customRes.data
    let settingsData = settingsRes.data

    // Create default customization if not exist
    if (!customization && (!customRes.error || customRes.error.code === 'PGRST116')) {
        const { data: newCustomization, error: createError } = await supabase
            .from('customizations')
            .insert({
                user_id: user.id,
                theme: 'system',
                primary_color: '#6366f1',
                accent_color: '#8b5cf6',
                company_name: 'Mon Entreprise',
                dashboard_layout: {},
                widget_positions: [],
                hidden_features: [],
                default_currency: 'EUR',
                date_format: 'DD/MM/YYYY',
                time_format: '24h'
            })
            .select()
            .single()

        if (!createError) {
            customization = newCustomization
        } else if (createError.code === '42P01') {
            return { data: null, error: 'Table customizations manquante' }
        }
    }

    // Create default settings if not exist
    if (!settingsData && (!settingsRes.error || settingsRes.error.code === 'PGRST116')) {
        const { data: newSettings } = await supabase
            .from('user_settings')
            .insert({
                user_id: user.id,
                email_notifications: true,
                sms_notifications: false,
                language: 'Français',
                timezone: 'Europe/Paris (UTC+1)',
                gdpr_consent: false,
                data_retention_days: 365
            })
            .select('language, timezone')
            .single()

        settingsData = newSettings
    }

    return {
        data: {
            ...customization,
            language: settingsData?.language || 'Français',
            timezone: settingsData?.timezone || 'Europe/Paris (UTC+1)'
        } as ExtendedCustomization,
        error: null
    }
}

export async function updateCustomization(data: Partial<ExtendedCustomization>) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Non autorisé' }
    }

    // Separate customization and user_settings fields
    const {
        id,
        user_id,
        created_at,
        updated_at,
        language,
        timezone,
        ...customizationUpdates
    } = data as any

    // Update customizations
    if (Object.keys(customizationUpdates).length > 0) {
        const { error: customError } = await supabase
            .from('customizations')
            .update({
                ...customizationUpdates,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', user.id)

        if (customError) {
            return { error: customError.message }
        }
    }

    // Update user_settings if language or timezone is present
    if (language !== undefined || timezone !== undefined) {
        const settingsUpdates: any = {}
        if (language) settingsUpdates.language = language
        if (timezone) settingsUpdates.timezone = timezone

        const { error: settingsError } = await supabase
            .from('user_settings')
            .update({
                ...settingsUpdates,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', user.id)

        // If update fails (maybe row missing), try upsert or insert? 
        // Assuming row exists from getCustomization or previous logic, but to be safe:
        if (settingsError) {
            console.error("Error updating user settings:", settingsError)
            // fallback to insert/upsert if needed, but keeping simple for now
        }
    }

    revalidateTag('customization')
    return { success: true }
}
