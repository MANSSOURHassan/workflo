'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type CalendarEvent = {
    id: string
    title: string
    description?: string
    event_type: 'meeting' | 'call' | 'task' | 'reminder' | 'deadline' | 'other'
    start_time: string
    end_time: string
    all_day: boolean
    location?: string
    meeting_link?: string
    color?: string
    prospect_id?: string
    status: 'confirmed' | 'tentative' | 'cancelled'
}

export async function getCalendarEvents(start: Date, end: Date) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { data: [], error: 'Non autorisé' }

    const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', user.id)
        .gte('start_time', start.toISOString())
        .lte('end_time', end.toISOString())
        .order('start_time', { ascending: true })

    if (error) {
        console.error('Error fetching calendar events:', error)
        return { data: [], error: error.message }
    }

    return { data: data as CalendarEvent[], error: null }
}

export async function createCalendarEvent(event: Partial<CalendarEvent>) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Non autorisé' }

    // Default color based on type
    let color = '#6366f1'
    switch (event.event_type) {
        case 'meeting': color = 'bg-blue-500'; break; // We store tailwind class or hex? Schema says varchar(20) default hex. 
        // Wait, the frontend uses tailwind classes for colors in the mock data. 
        // The DB schema validation allows arbitrary strings but has a hex default.
        // Let's store simple string identifiers or hex. 
        // The current frontend uses: bg-blue-500, etc.
        // Let's try to stick to what the frontend expects or map it.
        // Actually, looking at the schema: color VARCHAR(20) DEFAULT '#6366f1'
        // I should probably store valid CSS colors or map them.
        // For now, let's just save what comes in or default.
    }

    // Clean up undefined values
    const payload: any = { ...event, user_id: user.id }

    // Ensure dates are ISO strings
    if (event.start_time) payload.start_time = new Date(event.start_time).toISOString()
    if (event.end_time) payload.end_time = new Date(event.end_time).toISOString()

    const { data, error } = await supabase
        .from('calendar_events')
        .insert(payload)
        .select()
        .single()

    if (error) {
        console.error('Error creating event:', error)
        return { error: error.message }
    }

    revalidatePath('/dashboard/calendar')
    return { data, error: null }
}

export async function updateCalendarEvent(id: string, updates: Partial<CalendarEvent>) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Non autorisé' }

    const payload: any = { ...updates }
    // Ensure dates are ISO strings
    if (updates.start_time) payload.start_time = new Date(updates.start_time).toISOString()
    if (updates.end_time) payload.end_time = new Date(updates.end_time).toISOString()


    const { data, error } = await supabase
        .from('calendar_events')
        .update(payload)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

    if (error) return { error: error.message }

    revalidatePath('/dashboard/calendar')
    return { data, error: null }
}

export async function deleteCalendarEvent(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Non autorisé' }

    const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/calendar')
    return { error: null }
}
