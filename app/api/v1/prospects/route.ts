import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { logAuditAction } from '@/lib/security/audit'
import { checkRateLimit } from '@/lib/security/validation'

// Validation schema for prospects
const prospectSchema = z.object({
    email: z.string().email('Email invalide').max(254),
    first_name: z.string().max(100).nullable().optional(),
    last_name: z.string().max(100).nullable().optional(),
    company: z.string().max(200).nullable().optional(),
    job_title: z.string().max(100).nullable().optional(),
    phone: z.string().max(20).nullable().optional(),
    website: z.string().url('URL invalide').max(500).or(z.literal('')).nullable().optional(),
    linkedin_url: z.string().url('URL LinkedIn invalide').max(500).or(z.literal('')).nullable().optional(),
    source: z.enum(['manual', 'import', 'website', 'linkedin', 'referral', 'api']).optional(),
    status: z.enum(['new', 'contacted', 'qualified', 'converted', 'lost']).optional(),
    tags: z.array(z.string()).optional(),
    notes: z.string().nullable().optional()
})

// GET /api/v1/prospects - List all prospects
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Rate limiting
        const rateLimit = checkRateLimit(`api:prospects:list:${user.id}`, 100, 60000) // 100 per minute
        if (!rateLimit.allowed) {
            return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
        }

        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
        const status = searchParams.get('status')
        const search = searchParams.get('search')

        let query = supabase
            .from('prospects')
            .select('*', { count: 'exact' })
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .range((page - 1) * limit, page * limit - 1)

        if (status) {
            query = query.eq('status', status)
        }

        if (search) {
            query = query.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%,company.ilike.%${search}%`)
        }

        const { data, error, count } = await query

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({
            data,
            pagination: {
                page,
                limit,
                total: count || 0,
                pages: Math.ceil((count || 0) / limit)
            }
        })
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST /api/v1/prospects - Create a new prospect
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Rate limiting
        const rateLimit = checkRateLimit(`api:prospects:create:${user.id}`, 20, 60000) // 20 per minute
        if (!rateLimit.allowed) {
            return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
        }

        const body = await request.json()

        // Validate with Zod
        const validation = prospectSchema.safeParse(body)
        if (!validation.success) {
            return NextResponse.json({
                error: 'Validation failed',
                details: validation.error.errors
            }, { status: 400 })
        }

        const prospectData = {
            ...validation.data,
            user_id: user.id,
            source: validation.data.source || 'api',
            status: validation.data.status || 'new',
            tags: validation.data.tags || []
        }

        const { data, error } = await supabase
            .from('prospects')
            .insert(prospectData)
            .select()
            .single()

        if (error) {
            if (error.code === '23505') {
                return NextResponse.json({ error: 'Email already exists' }, { status: 409 })
            }
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // Log audit action
        await logAuditAction({
            action: 'prospect.create',
            entityType: 'prospect',
            entityId: data.id,
            newData: data
        })

        return NextResponse.json({ data }, { status: 201 })
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
