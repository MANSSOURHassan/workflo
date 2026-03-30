'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { logAuditAction } from '@/lib/security/audit'

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
    id: string
    title: string
    description: string | null
    type: 'task' | 'call' | 'email' | 'meeting' | 'follow_up'
    priority: TaskPriority
    status: TaskStatus
    due_date: string | null
    completed_at: string | null
    created_at: string
}

export async function createTask(data: Partial<Task>) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Non autorisé' }

    const taskData = {
        ...data,
        user_id: user.id,
        status: data.status || 'pending',
        created_at: new Date().toISOString()
    }

    const { data: newTask, error } = await supabase
        .from('tasks')
        .insert(taskData)
        .select()
        .single()

    if (error) return { error: error.message }

    // Non-blocking audit log
    logAuditAction({
        action: 'prospect.update', // Generic task action
        entityType: 'task',
        entityId: newTask.id,
        newData: newTask,
        supabaseClient: supabase,
        userObj: user
    })

    revalidatePath('/dashboard/tasks')
    return { data: newTask as Task }
}

export async function updateTask(id: string, updates: Partial<Task>) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Non autorisé' }

    const { data: task, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

    if (error) return { error: error.message }

    // Non-blocking audit log
    logAuditAction({
        action: 'prospect.update',
        entityType: 'task',
        entityId: id,
        newData: task,
        supabaseClient: supabase,
        userObj: user
    })

    revalidatePath('/dashboard/tasks')
    return { data: task as Task }
}

export async function deleteTask(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Non autorisé' }

    const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/tasks')
    return { success: true }
}
