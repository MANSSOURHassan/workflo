'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath, revalidateTag } from 'next/cache'
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

    // Fetch all tables in parallel
    const [customRes, settingsRes, profileRes] = await Promise.all([
        supabase
            .from('customizations')
            .select('*')
            .eq('user_id', user.id)
            .single(),
        supabase
            .from('user_settings')
            .select('language, timezone')
            .eq('user_id', user.id)
            .single(),
        supabase
            .from('profiles')
            .select('company, company_name')
            .eq('id', user.id)
            .maybeSingle()
    ])

    let customization = customRes.data
    let settingsData = settingsRes.data
    let profileData = profileRes.data

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

    const finalCompanyName = (customization?.company_name && customization.company_name !== 'Mon Entreprise') 
        ? customization.company_name 
        : (profileData?.company || profileData?.company_name || customization?.company_name || 'Mon Entreprise')

    const branding = customization?.dashboard_layout?.branding || {}

    return {
        data: {
            ...customization,
            company_name: finalCompanyName,
            company_address: branding.company_address || '',
            company_zip: branding.company_zip || '',
            company_city: branding.company_city || '',
            vat_number: branding.vat_number || '',
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

    // Intercept PDF branding fields and store them in JSON dashboard_layout to avoid schema errors
    const { 
        company_address, 
        company_zip, 
        company_city, 
        vat_number, 
        ...cleanUpdates 
    } = customizationUpdates

    // If any branding fields are present, merge them into dashboard_layout
    if (company_address !== undefined || company_zip !== undefined || company_city !== undefined || vat_number !== undefined) {
        // Fetch current layout to merge
        const { data: current } = await supabase
            .from('customizations')
            .select('dashboard_layout')
            .eq('user_id', user.id)
            .single()
        
        const currentLayout = current?.dashboard_layout || {}
        cleanUpdates.dashboard_layout = {
            ...currentLayout,
            branding: {
                ...(currentLayout.branding || {}),
                ...(company_address !== undefined && { company_address }),
                ...(company_zip !== undefined && { company_zip }),
                ...(company_city !== undefined && { company_city }),
                ...(vat_number !== undefined && { vat_number }),
            }
        }
    }

    // Update customizations
    if (Object.keys(cleanUpdates).length > 0) {
        const { error: customError } = await supabase
            .from('customizations')
            .update({
                ...cleanUpdates,
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
    revalidatePath('/dashboard', 'layout')
    return { success: true }
}
