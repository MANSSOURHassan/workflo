import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/v1/deals - List all deals
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
        const status = searchParams.get('status')
        const pipelineId = searchParams.get('pipeline_id')

        let query = supabase
            .from('deals')
            .select(`
        *,
        pipeline_stages (id, name, color),
        prospects (id, email, first_name, last_name, company)
      `, { count: 'exact' })
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .range((page - 1) * limit, page * limit - 1)

        if (status) {
            query = query.eq('status', status)
        }

        if (pipelineId) {
            query = query.eq('pipeline_id', pipelineId)
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

// POST /api/v1/deals - Create a new deal
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()

        // Validate required fields
        if (!body.name || !body.pipeline_id || !body.stage_id) {
            return NextResponse.json({
                error: 'name, pipeline_id and stage_id are required'
            }, { status: 400 })
        }

        const deal = {
            user_id: user.id,
            name: body.name,
            pipeline_id: body.pipeline_id,
            stage_id: body.stage_id,
            prospect_id: body.prospect_id || null,
            value: body.value || 0,
            currency: body.currency || 'EUR',
            status: body.status || 'open',
            expected_close_date: body.expected_close_date || null,
            notes: body.notes || null
        }

        const { data, error } = await supabase
            .from('deals')
            .insert(deal)
            .select()
            .single()

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ data }, { status: 201 })
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
