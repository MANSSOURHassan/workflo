'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  Plus,
  Calendar,
  MoreHorizontal,
  Trash2,
  Edit2,
  Loader2,
  X
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { PageHeader } from '@/components/dashboard/page-header'
import { createTask, updateTask, deleteTask as deleteTaskAction, TaskStatus, TaskPriority } from '@/lib/actions/tasks'

interface Task {
  id: string
  title: string
  description: string | null
  type: 'task' | 'call' | 'email' | 'meeting' | 'follow_up'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  due_date: string | null
  completed_at: string | null
  created_at: string
}

const priorityConfig = {
  low: { label: 'Basse', color: 'bg-slate-100 text-slate-700' },
  medium: { label: 'Moyenne', color: 'bg-blue-100 text-blue-700' },
  high: { label: 'Haute', color: 'bg-orange-100 text-orange-700' },
  urgent: { label: 'Urgente', color: 'bg-red-100 text-red-700' }
}

const typeConfig = {
  task: { label: 'Tâche', icon: CheckCircle2 },
  call: { label: 'Appel', icon: Circle },
  email: { label: 'Email', icon: Circle },
  meeting: { label: 'Réunion', icon: Calendar },
  follow_up: { label: 'Suivi', icon: Clock }
}

const statusConfig = {
  pending: { label: 'En attente', icon: Circle, color: 'text-slate-400', badge: 'bg-slate-100 text-slate-600', next: 'in_progress' as Task['status'] },
  in_progress: { label: 'En cours', icon: Clock, color: 'text-blue-500', badge: 'bg-blue-100 text-blue-700', next: 'completed' as Task['status'] },
  completed: { label: 'Terminée', icon: CheckCircle2, color: 'text-green-500', badge: 'bg-green-100 text-green-700', next: 'pending' as Task['status'] },
  cancelled: { label: 'Annulée', icon: AlertCircle, color: 'text-red-500', badge: 'bg-red-100 text-red-700', next: 'pending' as Task['status'] }
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'task' as Task['type'],
    priority: 'medium' as Task['priority'],
    due_date: ''
  })
  const supabase = createClient()

  useEffect(() => {
    loadTasks()
  }, [])

  async function loadTasks() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setTasks(data || [])
    } catch (error: any) {
      console.error('Erreur:', error)
      toast.error('Erreur lors du chargement des tâches')
    } finally {
      setLoading(false)
    }
  }

  async function saveTask() {
    if (!formData.title.trim()) {
      toast.error('Veuillez entrer un titre')
      return
    }

    const taskData = {
      title: formData.title.trim(),
      description: formData.description.trim() || null,
      type: formData.type,
      priority: formData.priority,
      due_date: formData.due_date || null
    }

    // --- OPTIMISTIC UPDATE ---
    const previousTasks = [...tasks]
    const tempId = editingTask ? editingTask.id : `temp-${Date.now()}`
    const optimisticTask = {
      ...taskData,
      id: tempId,
      status: editingTask ? editingTask.status : 'pending' as TaskStatus,
      created_at: new Date().toISOString(),
      completed_at: editingTask ? editingTask.completed_at : null
    } as any

    if (editingTask) {
      setTasks(tasks.map(t => t.id === editingTask.id ? optimisticTask : t))
    } else {
      setTasks([optimisticTask, ...tasks])
    }
    
    closeDialog()
    // -------------------------

    try {
      const result = editingTask 
        ? await updateTask(editingTask.id, taskData)
        : await createTask(taskData)

      if (result.error) throw new Error(result.error)
      
      // Update with the real ID from the server
      if (result.data) {
        setTasks(prev => prev.map(t => t.id === tempId ? result.data! : t))
      }
      
      toast.success(editingTask ? 'Tâche modifiée!' : 'Tâche créée!')
    } catch (error: any) {
      console.error('Erreur:', error)
      setTasks(previousTasks) // Rollback
      toast.error(error.message || 'Erreur lors de la sauvegarde')
      openEditDialog(optimisticTask) // Keep dialog context
    }
  }

  // Cycle: pending → in_progress → completed → pending
  async function toggleTaskStatus(task: Task) {
    const next = statusConfig[task.status]?.next || 'pending'
    await setTaskStatus(task, next)
  }

  async function setTaskStatus(task: Task, newStatus: TaskStatus) {
    const previousTasks = [...tasks]
    
    // --- OPTIMISTIC UPDATE ---
    setTasks(prev => prev.map(t => t.id === task.id ? { 
      ...t, 
      status: newStatus,
      completed_at: newStatus === 'completed' ? new Date().toISOString() : null
    } : t))
    // -------------------------

    try {
      const result = await updateTask(task.id, { 
        status: newStatus,
        completed_at: newStatus === 'completed' ? new Date().toISOString() : null
      })

      if (result.error) throw new Error(result.error)

      const labels: Record<TaskStatus, string> = {
        pending: 'Tâche remise en attente',
        in_progress: 'Tâche mise en cours',
        completed: 'Tâche marquée terminée ✅',
        cancelled: 'Tâche annulée'
      }
      toast.success(labels[newStatus])
    } catch (error: any) {
      setTasks(previousTasks) // Rollback
      toast.error('Erreur lors de la mise à jour')
    }
  }

  async function deleteTask(taskId: string) {
    if (!confirm('Supprimer cette tâche?')) return

    const previousTasks = [...tasks]
    
    // --- OPTIMISTIC UPDATE ---
    setTasks(prev => prev.filter(t => t.id !== taskId))
    // -------------------------

    try {
      const result = await deleteTaskAction(taskId)
      if (result.error) throw new Error(result.error)
      toast.success('Tâche supprimée')
    } catch (error: any) {
      setTasks(previousTasks) // Rollback
      console.error('Erreur:', error)
      toast.error('Erreur lors de la suppression')
    }
  }

  function openCreateDialog() {
    setEditingTask(null)
    setFormData({
      title: '',
      description: '',
      type: 'task',
      priority: 'medium',
      due_date: ''
    })
    setIsDialogOpen(true)
  }

  function openEditDialog(task: Task) {
    setEditingTask(task)
    setFormData({
      title: task.title,
      description: task.description || '',
      type: task.type,
      priority: task.priority,
      due_date: task.due_date ? task.due_date.split('T')[0] : ''
    })
    setIsDialogOpen(true)
  }

  function closeDialog() {
    setIsDialogOpen(false)
    setEditingTask(null)
    setFormData({
      title: '',
      description: '',
      type: 'task',
      priority: 'medium',
      due_date: ''
    })
  }

  const filteredTasks = tasks.filter(task => {
    if (filter === 'pending') return task.status !== 'completed'
    if (filter === 'completed') return task.status === 'completed'
    return true
  })

  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Tâches" 
        description="Organisez vos priorités et ne manquez aucune action importante de votre journée."
      >
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle tâche
        </Button>
      </PageHeader>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-sm text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
            <p className="text-sm text-muted-foreground">En attente</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
            <p className="text-sm text-muted-foreground">En cours</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <p className="text-sm text-muted-foreground">Terminées</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          Toutes
        </Button>
        <Button
          variant={filter === 'pending' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('pending')}
        >
          En cours
        </Button>
        <Button
          variant={filter === 'completed' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('completed')}
        >
          Terminées
        </Button>
      </div>

      {/* Tasks List */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des tâches</CardTitle>
          <CardDescription>{filteredTasks.length} tâches</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <CheckCircle2 className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                Aucune tâche trouvée.<br />
                Créez une nouvelle tâche pour commencer.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTasks.map((task) => {
                const status = statusConfig[task.status]
                const priority = priorityConfig[task.priority]
                const StatusIcon = status.icon
                const isOverdue = task.due_date && task.status !== 'completed' && new Date(task.due_date) < new Date()

                return (
                  <div
                    key={task.id}
                    className={`flex items-center gap-3 p-4 rounded-lg border transition-all hover:shadow-sm ${
                      task.status === 'completed'
                        ? 'bg-muted/20 border-muted opacity-70'
                        : task.status === 'in_progress'
                        ? 'border-blue-200 bg-blue-50/30'
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    {/* Status toggle button — click to cycle */}
                    <button
                      onClick={() => toggleTaskStatus(task)}
                      title={`Statut actuel : ${status.label}. Cliquer pour passer à : ${statusConfig[status.next].label}`}
                      className={`shrink-0 rounded-full p-0.5 hover:scale-110 transition-transform ${status.color}`}
                    >
                      <StatusIcon className="h-5 w-5" />
                    </button>

                    <div className="flex-1 min-w-0">
                      <p className={`font-medium truncate ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                        {task.title}
                      </p>
                      {task.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">{task.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <Badge className={`text-[10px] px-2 py-0 ${status.badge}`}>{status.label}</Badge>
                        <Badge variant="outline" className={`text-[10px] px-2 py-0 ${priority.color}`}>{priority.label}</Badge>
                        {task.due_date && (
                          <span className={`text-xs flex items-center gap-1 ${isOverdue ? 'text-red-500 font-semibold' : 'text-muted-foreground'}`}>
                            <Calendar className="h-3 w-3" />
                            {new Date(task.due_date).toLocaleDateString('fr-FR')}
                            {isOverdue && ' (En retard)'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quick status buttons */}
                    <div className="flex items-center gap-1 shrink-0">
                      {task.status !== 'in_progress' && task.status !== 'completed' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 px-2 text-blue-600 hover:bg-blue-50 text-xs"
                          onClick={() => setTaskStatus(task, 'in_progress')}
                        >
                          <Clock className="mr-1 h-3 w-3" />
                          En cours
                        </Button>
                      )}
                      {task.status !== 'completed' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 px-2 text-green-600 hover:bg-green-50 text-xs"
                          onClick={() => setTaskStatus(task, 'completed')}
                        >
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Terminée
                        </Button>
                      )}
                      {task.status === 'completed' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 px-2 text-slate-500 hover:bg-slate-50 text-xs"
                          onClick={() => setTaskStatus(task, 'pending')}
                        >
                          <Circle className="mr-1 h-3 w-3" />
                          Réouvrir
                        </Button>
                      )}
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setTaskStatus(task, 'pending')} disabled={task.status === 'pending'}>
                          <Circle className="mr-2 h-4 w-4 text-slate-400" />
                          En attente
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTaskStatus(task, 'in_progress')} disabled={task.status === 'in_progress'}>
                          <Clock className="mr-2 h-4 w-4 text-blue-500" />
                          En cours
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTaskStatus(task, 'completed')} disabled={task.status === 'completed'}>
                          <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                          Terminée
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTaskStatus(task, 'cancelled')} disabled={task.status === 'cancelled'}>
                          <AlertCircle className="mr-2 h-4 w-4 text-red-500" />
                          Annulée
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEditDialog(task)}>
                          <Edit2 className="mr-2 h-4 w-4" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => deleteTask(task.id)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTask ? 'Modifier la tâche' : 'Nouvelle tâche'}</DialogTitle>
            <DialogDescription>
              {editingTask ? 'Modifiez les informations de la tâche' : 'Créez une nouvelle tâche'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Titre *</Label>
              <Input
                id="title"
                placeholder="Ex: Appeler le client..."
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Description de la tâche..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value as Task['type'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="task">Tâche</SelectItem>
                    <SelectItem value="call">Appel</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="meeting">Réunion</SelectItem>
                    <SelectItem value="follow_up">Suivi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Priorité</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value as Task['priority'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Basse</SelectItem>
                    <SelectItem value="medium">Moyenne</SelectItem>
                    <SelectItem value="high">Haute</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="due_date">Date d'échéance</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Annuler
            </Button>
            <Button onClick={saveTask} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingTask ? 'Modifier' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
