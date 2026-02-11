import { Mail, Phone, Calendar, FileText, CheckCircle2, UserPlus, Shield, Sparkles, RefreshCcw } from 'lucide-react'

export const actionIcons: Record<string, any> = {
    // Activities
    email: Mail,
    call: Phone,
    meeting: Calendar,
    note: FileText,
    task: CheckCircle2,
    // Audits
    prospect_created: UserPlus,
    prospect_assigned: Shield,
    status_changed: RefreshCcw,
    score_updated: Sparkles
}

export const actionLabels: Record<string, string> = {
    email: 'Email',
    call: 'Appel',
    meeting: 'Réunion',
    note: 'Note',
    task: 'Tâche',
    prospect_created: 'Nouveau prospect',
    prospect_assigned: 'Assignation',
    status_changed: 'Changement statut',
    score_updated: 'Score IA mis à jour'
}

export function formatRelativeTime(dateString: string): string {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 0) return "À l'instant"
    if (diffInSeconds < 60) return "À l'instant"
    if (diffInSeconds < 3600) return `Il y a ${Math.floor(diffInSeconds / 60)} min`
    if (diffInSeconds < 86400) return `Il y a ${Math.floor(diffInSeconds / 3600)} h`
    if (diffInSeconds < 604800) return `Il y a ${Math.floor(diffInSeconds / 86400)} j`
    return date.toLocaleDateString('fr-FR')
}
