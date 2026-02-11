'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MoreHorizontal, Eye, Pencil, Trash2, ArrowUpDown, Mail, Phone, Building2, User, Info, Sparkles } from 'lucide-react'
import { deleteProspect, deleteMultipleProspects } from '@/lib/actions/prospects'
import { assignProspect } from '@/lib/actions/team'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { Prospect } from '@/lib/types/database'

interface TeamMember {
  id: string
  first_name: string | null
  last_name: string | null
  email: string
}

interface ProspectsTableProps {
  prospects: Prospect[]
  teamMembers: TeamMember[]
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

const statusColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800',
  contacted: 'bg-yellow-100 text-yellow-800',
  qualified: 'bg-green-100 text-green-800',
  converted: 'bg-purple-100 text-purple-800',
  lost: 'bg-gray-100 text-gray-800'
}

const statusLabels: Record<string, string> = {
  new: 'Nouveau',
  contacted: 'Contacté',
  qualified: 'Qualifié',
  converted: 'Converti',
  lost: 'Perdu'
}

const sourceLabels: Record<string, string> = {
  manual: 'Manuel',
  import: 'Import',
  website: 'Site web',
  linkedin: 'LinkedIn',
  referral: 'Recommandation',
  api: 'API'
}

export function ProspectsTable({ prospects, teamMembers, sortBy, sortOrder }: ProspectsTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [prospectToDelete, setProspectToDelete] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function handleAssign(prospectId: string, memberId: string | 'unassigned') {
    const targetMemberId = memberId === 'unassigned' ? null : memberId
    const result = await assignProspect(prospectId, targetMemberId)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Assignation mise à jour')
      router.refresh()
    }
  }

  function handleSort(column: string) {
    const params = new URLSearchParams(searchParams.toString())
    const newOrder = sortBy === column && sortOrder === 'asc' ? 'desc' : 'asc'
    params.set('sortBy', column)
    params.set('sortOrder', newOrder)

    startTransition(() => {
      router.push(`/dashboard/prospects?${params.toString()}`)
    })
  }

  function toggleSelectAll() {
    if (selectedIds.length === prospects.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(prospects.map(p => p.id))
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(i => i !== id)
        : [...prev, id]
    )
  }

  async function handleDelete() {
    if (prospectToDelete) {
      const result = await deleteProspect(prospectToDelete)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Prospect supprimé')
        router.refresh()
      }
    } else if (selectedIds.length > 0) {
      const result = await deleteMultipleProspects(selectedIds)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(`${selectedIds.length} prospects supprimés`)
        setSelectedIds([])
        router.refresh()
      }
    }
    setDeleteDialogOpen(false)
    setProspectToDelete(null)
  }

  if (prospects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 bg-card rounded-lg border">
        <p className="text-lg font-medium mb-2">Aucun prospect trouvé</p>
        <p className="text-muted-foreground mb-4">Commencez par ajouter votre premier prospect</p>
        <Button asChild>
          <Link href="/dashboard/prospects/new">Ajouter un prospect</Link>
        </Button>
      </div>
    )
  }

  return (
    <>
      <TooltipProvider>
        {/* Bulk Actions */}
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-4 p-3 bg-muted rounded-lg border border-primary/20 bg-primary/5 mb-4">
            <span className="text-sm font-medium">{selectedIds.length} prospect(s) sélectionné(s)</span>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer
              </Button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedIds.length === prospects.length && prospects.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>
                  <Button variant="ghost" size="sm" className="-ml-3 h-8 font-bold" onClick={() => handleSort('last_name')}>
                    Prospect <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="font-bold text-foreground/80">Entreprise</TableHead>
                <TableHead>
                  <Button variant="ghost" size="sm" className="-ml-3 h-8 font-bold" onClick={() => handleSort('status')}>
                    Statut <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="font-bold text-foreground/80">Assigné à</TableHead>
                <TableHead>
                  <Button variant="ghost" size="sm" className="-ml-3 h-8 font-bold text-primary" onClick={() => handleSort('ai_score')}>
                    <Sparkles className="mr-2 h-4 w-4 fill-primary/20" />
                    Score IA <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prospects.map((prospect) => (
                <TableRow key={prospect.id} className="hover:bg-muted/20 transition-colors">
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(prospect.id)}
                      onCheckedChange={() => toggleSelect(prospect.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <Link
                        href={`/dashboard/prospects/${prospect.id}`}
                        className="font-semibold text-foreground hover:text-primary transition-colors"
                      >
                        {prospect.first_name && prospect.last_name
                          ? `${prospect.first_name} ${prospect.last_name}`
                          : prospect.email}
                      </Link>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-muted-foreground bg-muted px-1.5 rounded">{sourceLabels[prospect.source]}</span>
                        <span className="text-xs text-muted-foreground truncate max-w-[150px]">{prospect.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {prospect.company ? (
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{prospect.company}</span>
                        {prospect.job_title && <span className="text-[10px] text-muted-foreground">{prospect.job_title}</span>}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={cn("font-medium", statusColors[prospect.status])}>
                      {statusLabels[prospect.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Select
                      defaultValue={prospect.assigned_to || 'unassigned'}
                      onValueChange={(value) => handleAssign(prospect.id, value)}
                    >
                      <SelectTrigger className="h-8 w-[140px] text-xs border-none bg-muted/50 hover:bg-muted">
                        <SelectValue>
                          {prospect.assigned_to_member ? (
                            <div className="flex items-center gap-2">
                              <div className="h-4 w-4 rounded-full bg-primary/20 flex items-center justify-center text-[8px] font-bold text-primary">
                                {prospect.assigned_to_member.first_name?.[0] || 'U'}
                              </div>
                              <span className="truncate">{prospect.assigned_to_member.first_name}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <User className="h-3 w-3" />
                              <span>Non assigné</span>
                            </div>
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Non assigné</SelectItem>
                        {teamMembers.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.first_name} {member.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {prospect.ai_score !== null ? (
                      <div className="flex items-center gap-3">
                        <div className="relative flex items-center justify-center h-8 w-8">
                          <div className="absolute inset-0">
                            <Progress value={prospect.ai_score} className="h-full w-full rounded-full" />
                          </div>
                          <span className="relative text-[10px] font-bold">{prospect.ai_score}</span>
                        </div>
                        {prospect.ai_reasoning && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground">
                                <Info className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-[250px] p-3 text-xs shadow-xl border-primary/10">
                              <p className="font-bold text-primary mb-1 flex items-center gap-1">
                                <Sparkles className="h-3 w-3" />
                                Analyse IA
                              </p>
                              <p className="text-muted-foreground leading-relaxed">{prospect.ai_reasoning}</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[160px]">
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/prospects/${prospect.id}`}>
                            <Eye className="mr-2 h-4 w-4 text-muted-foreground" />
                            Détails
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/prospects/${prospect.id}/edit`}>
                            <Pencil className="mr-2 h-4 w-4 text-muted-foreground" />
                            Modifier
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive focus:bg-destructive/10"
                          onClick={() => {
                            setProspectToDelete(prospect.id)
                            setDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </TooltipProvider>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              {prospectToDelete
                ? 'Êtes-vous sûr de vouloir supprimer ce prospect ? Cette action est irréversible.'
                : `Êtes-vous sûr de vouloir supprimer ${selectedIds.length} prospect(s) ? Cette action est irréversible.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
