'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidateTag } from 'next/cache'
import type { Pipeline, PipelineStage, Deal, DealStatus } from '@/lib/types/database'
import { pipelineSchema, stageSchema, dealSchema, isValidUUID } from '@/lib/security/validation'
import { logAuditAction } from '@/lib/security/audit'

export async function getPipelines() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: [], error: 'Non autorisé' }
  }

  const { data, error } = await supabase
    .from('pipelines')
    .select(`
      *,
      stages:pipeline_stages (
        id,
        name,
        position,
        color,
        probability
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  if (data) {
    data.forEach((pipeline: any) => {
      if (pipeline.stages) {
        pipeline.stages.sort((a: any, b: any) => a.position - b.position)
      }
    })
  }

  return { data: data as (Pipeline & { stages: PipelineStage[] })[], error: error?.message }
}

export async function getDefaultPipeline() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: 'Non autorisé' }
  }

  // Use .maybeSingle() instead of .single() to avoid error when no rows
  const { data: pipelines } = await supabase
    .from('pipelines')
    .select(`
      *,
      stages:pipeline_stages (
        id,
        name,
        position,
        color,
        probability
      )
    `)
    .eq('user_id', user.id)
    .eq('is_default', true)
    .limit(1)

  let data = pipelines?.[0] || null

  // If no default pipeline, find ANY pipeline before creating one
  if (!data) {
    const { data: anyPipeline } = await supabase
      .from('pipelines')
      .select(`
        *,
        stages:pipeline_stages (
          id,
          name,
          position,
          color,
          probability
        )
      `)
      .eq('user_id', user.id)
      .limit(1)

    if (anyPipeline && anyPipeline.length > 0) {
      data = anyPipeline[0]

      // Optionally Make it default if it wasn't
      await supabase
        .from('pipelines')
        .update({ is_default: true })
        .eq('id', data.id)
    }
  }

  // If STILL no pipeline, create a fresh one
  if (!data) {
    const { data: newPipeline, error: createError } = await supabase
      .from('pipelines')
      .insert({
        user_id: user.id,
        name: 'Pipeline Principal',
        is_default: true
      })
      .select()
      .single()

    if (createError) {
      return { data: null, error: createError.message }
    }

    // Create default stages
    const defaultStages = [
      { name: 'Nouveau', position: 0, color: '#6366F1', probability: 10 },
      { name: 'Contact établi', position: 1, color: '#8B5CF6', probability: 25 },
      { name: 'Qualification', position: 2, color: '#EC4899', probability: 50 },
      { name: 'Proposition', position: 3, color: '#F59E0B', probability: 75 },
      { name: 'Négociation', position: 4, color: '#10B981', probability: 90 },
      { name: 'Gagné', position: 5, color: '#22C55E', probability: 100 },
    ]

    await supabase
      .from('pipeline_stages')
      .insert(defaultStages.map(stage => ({
        ...stage,
        pipeline_id: newPipeline.id
      })))

    // Refetch with stages
    const { data: pipelineWithStages } = await supabase
      .from('pipelines')
      .select(`
        *,
        stages:pipeline_stages (
          id,
          name,
          position,
          color,
          probability
        )
      `)
      .eq('id', newPipeline.id)
      .single()

    data = pipelineWithStages
  }

  if (data?.stages) {
    (data.stages as any[]).sort((a: PipelineStage, b: PipelineStage) => a.position - b.position)
  }

  return { data: data as Pipeline & { stages: PipelineStage[] }, error: null }
}

export async function getPipelineStages(pipelineId: string): Promise<PipelineStage[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  const { data, error } = await supabase
    .from('pipeline_stages')
    .select('*')
    .eq('pipeline_id', pipelineId)
    .order('position', { ascending: true })

  if (error) {
    console.error('Error fetching pipeline stages:', error)
    return []
  }

  return data as PipelineStage[]
}

export async function createDefaultPipelineWithStages() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Non autorisé' }
  }

  // Check if user already has a pipeline
  const { data: existingPipeline } = await supabase
    .from('pipelines')
    .select('id')
    .eq('user_id', user.id)
    .limit(1)
    .single()

  if (existingPipeline) {
    return { data: existingPipeline, error: null }
  }

  // Create new pipeline
  const { data: pipeline, error: pipelineError } = await supabase
    .from('pipelines')
    .insert({
      user_id: user.id,
      name: 'Pipeline Principal',
      is_default: true
    })
    .select()
    .single()

  if (pipelineError) {
    return { error: pipelineError.message }
  }

  // Create default stages
  const defaultStages = [
    { name: 'Prospection', position: 0, color: '#94A3B8', probability: 10 },
    { name: 'Qualification', position: 1, color: '#6366F1', probability: 25 },
    { name: 'Proposition', position: 2, color: '#22D3EE', probability: 50 },
    { name: 'Negociation', position: 3, color: '#FBBF24', probability: 75 },
    { name: 'Gagne', position: 4, color: '#22C55E', probability: 100 },
    { name: 'Perdu', position: 5, color: '#EF4444', probability: 0 },
  ]

  const { error: stagesError } = await supabase
    .from('pipeline_stages')
    .insert(defaultStages.map(stage => ({
      ...stage,
      pipeline_id: pipeline.id
    })))

  if (stagesError) {
    return { error: stagesError.message }
  }

  revalidateTag('pipelines', 'max')
  return { data: pipeline, error: null }
}

export async function createPipeline(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Non autorisé' }
  }

  // Validate with Zod
  const rawData = Object.fromEntries(formData.entries())
  const validation = pipelineSchema.safeParse(rawData)
  if (!validation.success) {
    return { error: 'Validation échouée: ' + validation.error.errors.map(e => e.message).join(', ') }
  }

  const { data, error } = await supabase
    .from('pipelines')
    .insert({
      user_id: user.id,
      name: validation.data.name,
      is_default: !!validation.data.is_default
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  // Log audit
  await logAuditAction({
    action: 'pipeline.create',
    entityType: 'pipeline',
    entityId: data.id,
    newData: data
  })

  // Auto-generate default stages for the new pipeline to avoid empty Kanban
  const defaultStages = [
    { name: 'Prospection', position: 0, color: '#94A3B8', probability: 10 },
    { name: 'Qualification', position: 1, color: '#6366F1', probability: 25 },
    { name: 'Proposition', position: 2, color: '#22D3EE', probability: 50 },
    { name: 'Négociation', position: 3, color: '#FBBF24', probability: 75 },
    { name: 'Gagné', position: 4, color: '#22C55E', probability: 100 },
    { name: 'Perdu', position: 5, color: '#EF4444', probability: 0 },
  ]

  await supabase
    .from('pipeline_stages')
    .insert(defaultStages.map(stage => ({
      ...stage,
      pipeline_id: data.id
    })))

  revalidateTag('pipelines', 'max')
  return { data }
}

export async function createPipelineStage(pipelineId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Non autorisé' }
  }

  // Get current max position
  const { data: stages } = await supabase
    .from('pipeline_stages')
    .select('position')
    .eq('pipeline_id', pipelineId)
    .order('position', { ascending: false })
    .limit(1)

  const maxPosition = stages?.[0]?.position ?? -1

  // Validate with Zod
  const rawData = Object.fromEntries(formData.entries())
  // Transform types for Zod
  if (rawData.probability) (rawData as any).probability = parseInt(rawData.probability as string)
  
  const validation = stageSchema.safeParse(rawData)
  if (!validation.success) {
    return { error: 'Validation échouée: ' + validation.error.errors.map(e => e.message).join(', ') }
  }

  const { data, error } = await supabase
    .from('pipeline_stages')
    .insert({
      pipeline_id: pipelineId,
      name: validation.data.name,
      position: maxPosition + 1,
      color: validation.data.color || '#6366F1',
      probability: validation.data.probability || 0
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  // Log audit
  await logAuditAction({
    action: 'pipeline.update', // stage.create ? using pipeline as prefix
    entityType: 'pipeline_stage',
    entityId: data.id,
    newData: data
  })

  revalidateTag('pipelines', 'max')
  return { data }
}

// Deals
export async function getDeals(pipelineId?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: [], error: 'Non autorisé' }
  }

  let query = supabase
    .from('deals')
    .select(`
      *,
      prospect:prospects (id, email, first_name, last_name, company),
      stage:pipeline_stages (id, name, position, color, probability),
      closer:team_members (id, first_name, last_name)
    `)
    .eq('user_id', user.id)
    .eq('status', 'open')
    .order('created_at', { ascending: false })

  if (pipelineId) {
    query = query.eq('pipeline_id', pipelineId)
  }

  const { data, error } = await query

  return { data: data as (Deal & { prospect: any, stage: PipelineStage, closer?: any })[], error: error?.message }
}

export interface CreateDealData {
  pipeline_id: string
  stage_id: string
  prospect_id?: string | null
  title: string
  value?: number
  currency?: string
  expected_close_date?: string | null
  notes?: string
}

export async function createDeal(data: CreateDealData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Non autorisé' }
  }

  // Validate with Zod
  const validation = dealSchema.safeParse(data)
  if (!validation.success) {
    return { error: 'Validation échouée: ' + validation.error.errors.map(e => e.message).join(', ') }
  }

  const deal = {
    ...validation.data,
    user_id: user.id,
    status: 'open' as DealStatus,
  }

  const { data: insertedData, error } = await supabase
    .from('deals')
    .insert(deal)
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  // Log audit
  await logAuditAction({
    action: 'deal.create',
    entityType: 'deal',
    entityId: insertedData.id,
    newData: insertedData
  })

  revalidateTag('deals', 'max')
  return { data: insertedData }
}

export async function updateDealStage(dealId: string, stageId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Non autorisé' }
  }

  // Get old data
  const { data: oldData } = await supabase
    .from('deals')
    .select('*')
    .eq('id', dealId)
    .eq('user_id', user.id)
    .single()

  const { error } = await supabase
    .from('deals')
    .update({ stage_id: stageId })
    .eq('id', dealId)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  // Log audit
  await logAuditAction({
    action: 'deal.update',
    entityType: 'deal',
    entityId: dealId,
    oldData,
    newData: { stage_id: stageId }
  })

  revalidateTag('deals', 'max')
  return { success: true }
}

export async function updateDealStatus(dealId: string, status: DealStatus) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Non autorisé' }
  }

  // Get old data for audit
  const { data: oldData } = await supabase
    .from('deals')
    .select('*')
    .eq('id', dealId)
    .eq('user_id', user.id)
    .single()

  const updates: Partial<Deal> = {
    status,
    closed_at: status !== 'open' ? new Date().toISOString() : null
  }

  const { error } = await supabase
    .from('deals')
    .update(updates)
    .eq('id', dealId)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  // Log audit
  await logAuditAction({
    action: 'deal.update',
    entityType: 'deal',
    entityId: dealId,
    oldData,
    newData: updates
  })

  revalidateTag('deals', 'max')
  return { success: true }
}

export async function deleteDeal(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Non autorisé' }
  }

  // Get old data
  const { data: oldData } = await supabase
    .from('deals')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  const { error } = await supabase
    .from('deals')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  // Log audit
  await logAuditAction({
    action: 'deal.delete',
    entityType: 'deal',
    entityId: id,
    oldData
  })

  revalidateTag('deals', 'max')
  return { success: true }
}

export async function getDealStats() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Non autorisé' }
  }

  const { data, error } = await supabase
    .from('deals')
    .select('value, status, created_at')
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  const deals = data as Pick<Deal, 'value' | 'status' | 'created_at'>[]
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const stats = {
    totalDeals: deals.length,
    openDeals: deals.filter(d => d.status === 'open').length,
    wonDeals: deals.filter(d => d.status === 'won').length,
    lostDeals: deals.filter(d => d.status === 'lost').length,
    totalValue: deals.filter(d => d.status === 'open').reduce((acc, d) => acc + d.value, 0),
    wonValue: deals.filter(d => d.status === 'won').reduce((acc, d) => acc + d.value, 0),
    thisMonth: deals.filter(d => new Date(d.created_at) >= startOfMonth).length,
  }

  return { data: stats }
}
