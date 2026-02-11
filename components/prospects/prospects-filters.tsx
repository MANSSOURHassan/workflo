'use client'

import React from "react"

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, X, Filter } from 'lucide-react'
import type { ProspectStatus, ProspectSource } from '@/lib/types/database'

interface ProspectsFiltersProps {
  currentFilters: {
    search?: string
    status?: ProspectStatus
    source?: ProspectSource
  }
}

const statusOptions = [
  { value: 'all', label: 'Tous les statuts' },
  { value: 'new', label: 'Nouveau' },
  { value: 'contacted', label: 'Contacté' },
  { value: 'qualified', label: 'Qualifié' },
  { value: 'converted', label: 'Converti' },
  { value: 'lost', label: 'Perdu' },
]

const sourceOptions = [
  { value: 'all', label: 'Toutes les sources' },
  { value: 'manual', label: 'Manuel' },
  { value: 'import', label: 'Import' },
  { value: 'website', label: 'Site web' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'referral', label: 'Recommandation' },
  { value: 'api', label: 'API' },
]

export function ProspectsFilters({ currentFilters }: ProspectsFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState(currentFilters.search || '')

  function updateFilters(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== 'all') {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.delete('page') // Reset to page 1 when filtering
    
    startTransition(() => {
      router.push(`/dashboard/prospects?${params.toString()}`)
    })
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    updateFilters('search', search)
  }

  function clearFilters() {
    setSearch('')
    startTransition(() => {
      router.push('/dashboard/prospects')
    })
  }

  const hasActiveFilters = currentFilters.search || currentFilters.status || currentFilters.source

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      {/* Search */}
      <form onSubmit={handleSearch} className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Rechercher un prospect..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 pr-9"
        />
        {search && (
          <button
            type="button"
            onClick={() => {
              setSearch('')
              updateFilters('search', '')
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </button>
        )}
      </form>

      {/* Status Filter */}
      <Select
        value={currentFilters.status || 'all'}
        onValueChange={(value) => updateFilters('status', value)}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Statut" />
        </SelectTrigger>
        <SelectContent>
          {statusOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Source Filter */}
      <Select
        value={currentFilters.source || 'all'}
        onValueChange={(value) => updateFilters('source', value)}
      >
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Source" />
        </SelectTrigger>
        <SelectContent>
          {sourceOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters} disabled={isPending}>
          <X className="mr-1 h-4 w-4" />
          Effacer les filtres
        </Button>
      )}
    </div>
  )
}
