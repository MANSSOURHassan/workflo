'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
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
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { Plus, Loader2, Check, ChevronsUpDown } from 'lucide-react'
import { createActivity, getProspectsList } from '@/lib/actions/activities'
import { toast } from 'sonner'

interface AddActivityModalProps {
  onSuccess: () => void
}

export function AddActivityModal({ onSuccess }: AddActivityModalProps) {
  const [open, setOpen] = useState(false)
  const [openProspect, setOpenProspect] = useState(false)
  const [loading, setLoading] = useState(false)
  const [prospects, setProspects] = useState<any[]>([])
  const [formData, setFormData] = useState({
    title: '',
    type: 'call',
    prospect_id: 'none',
    description: '',
  })
  
  useEffect(() => {
    if (open) {
      loadProspects()
    }
  }, [open])

  async function loadProspects() {
    const res = await getProspectsList()
    if (res.data) setProspects(res.data)
  }

  async function handleSubmit() {
    if (!formData.title) {
        toast.error('Le titre est obligatoire')
        return
    }

    setLoading(true)
    try {
        const payload = {
            title: formData.title,
            type: formData.type,
            prospect_id: formData.prospect_id === 'none' ? undefined : formData.prospect_id,
            description: formData.description
        }
        const result = await createActivity(payload)
        if (result.error) throw new Error(result.error)

        toast.success('Activité ajoutée avec succès')
        setOpen(false)
        onSuccess()
        setFormData({
            title: '',
            type: 'call',
            prospect_id: 'none',
            description: '',
        })
    } catch (error: any) {
        toast.error(error.message || 'Erreur lors de l\'ajout')
    } finally {
        setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
            <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nouvelle activite
            </Button>
        </DialogTrigger>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Nouvelle Activité</DialogTitle>
                <DialogDescription>
                    Enregistrez une nouvelle interaction (appel, email, réunion...).
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                    <Label htmlFor="title">Titre de l'activité *</Label>
                    <Input
                        id="title"
                        placeholder="Ex: Appel de découverte, Email de relance..."
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="type">Type d'activité</Label>
                        <Select
                            value={formData.type}
                            onValueChange={(val) => setFormData({ ...formData, type: val })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="call">Appel</SelectItem>
                                <SelectItem value="email">Email</SelectItem>
                                <SelectItem value="meeting">Réunion</SelectItem>
                                <SelectItem value="note">Note</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="prospect">Liée au prospect</Label>
                        <Popover open={openProspect} onOpenChange={setOpenProspect}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={openProspect}
                                    className="justify-between"
                                >
                                    {formData.prospect_id === 'none'
                                        ? "Aucun (Interne)"
                                        : prospects.find((p) => p.id === formData.prospect_id)
                                          ? `${prospects.find((p) => p.id === formData.prospect_id)?.first_name} ${prospects.find((p) => p.id === formData.prospect_id)?.last_name}`
                                          : "Sélectionner un prospect..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[300px] p-0">
                                <Command>
                                    <CommandInput placeholder="Rechercher un prospect..." />
                                    <CommandList>
                                        <CommandEmpty>Aucun prospect trouvé.</CommandEmpty>
                                        <CommandGroup>
                                            <CommandItem
                                                onSelect={() => {
                                                    setFormData({ ...formData, prospect_id: 'none' })
                                                    setOpenProspect(false)
                                                }}
                                            >
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-4 w-4",
                                                        formData.prospect_id === 'none' ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                                Aucun (Interne)
                                            </CommandItem>
                                            {prospects.map((p) => (
                                                <CommandItem
                                                    key={p.id}
                                                    onSelect={() => {
                                                        setFormData({ ...formData, prospect_id: p.id })
                                                        setOpenProspect(false)
                                                    }}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            formData.prospect_id === p.id ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    {p.first_name} {p.last_name} {p.company ? `(${p.company})` : ''}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="description">Description / Notes</Label>
                    <Textarea
                        id="description"
                        placeholder="Détails de l'échange..."
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
                <Button onClick={handleSubmit} disabled={loading} className="bg-primary text-white">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Ajouter
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
  )
}
