import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

export type AuditAction = 
  | 'prospect.create' | 'prospect.update' | 'prospect.delete' | 'prospect.delete_bulk' | 'prospect.export' | 'prospect.import'
  | 'deal.create' | 'deal.update' | 'deal.delete'
  | 'pipeline.create' | 'pipeline.update' | 'pipeline.delete'
  | 'campaign.create' | 'campaign.update' | 'campaign.delete' | 'campaign.send'
  | 'settings.update' | 'profile.update' | 'auth.password_change'
  | 'integration.connect' | 'integration.disconnect'
  | 'api_key.create' | 'api_key.delete'
  | 'security.middleware_activation'

interface AuditParams {
  action: AuditAction
  entityType?: string
  entityId?: string
  description?: string
  metadata?: any
  oldData?: any
  newData?: any
}

/**
 * Log a sensitive action to the audit_logs table
 */
export async function logAuditAction({
  action,
  entityType,
  entityId,
  description,
  metadata,
  oldData,
  newData,
  supabaseClient,
  userObj
}: AuditParams & { supabaseClient?: any; userObj?: any }) {
  try {
    const supabase = supabaseClient || await createClient()
    const user = userObj || (await supabase.auth.getUser()).data.user
    
    if (!user) return // No user, no log (or system log)

    const headerList = await headers()
    const ipAddress = headerList.get('x-forwarded-for') || 'unknown'
    const userAgent = headerList.get('user-agent') || 'unknown'

    const { error } = await supabase
      .from('audit_logs')
      .insert({
        user_id: user.id,
        action,
        entity_type: entityType,
        entity_id: entityId,
        description,
        metadata,
        old_data: oldData,
        new_data: newData,
        ip_address: ipAddress,
        user_agent: userAgent
      })

    if (error) {
      console.error('Failed to write audit log:', error)
    }
  } catch (error) {
    console.error('Unexpected error in audit logging:', error)
  }
}
