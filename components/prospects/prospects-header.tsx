'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Plus, Upload, Download, MoreHorizontal, Users, UserCheck, UserX, Target, Briefcase } from 'lucide-react'
import { exportProspects } from '@/lib/actions/prospects'
import { toast } from 'sonner'

interface ProspectsHeaderProps {
  stats?: {
    total: number
    new: number
    contacted: number
    qualified: number
    converted: number
    lost: number
    thisMonth: number
    avgAiScore: number
  }
}

export function ProspectsHeader({ stats }: ProspectsHeaderProps) {
  const [isExporting, setIsExporting] = useState(false)

  async function handleExport(format: 'csv' | 'excel') {
    setIsExporting(true)
    try {
      const result = await exportProspects(format)
      if (result.error) {
        toast.error(result.error)
        return
      }
      
      // Download the file
      const blob = new Blob([result.data as string], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = result.filename || 'prospects.csv'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
      toast.success('Export réussi')
    } catch {
      toast.error('Erreur lors de l\'export')
    } finally {
      setIsExporting(false)
    }
  }

  const statCards = [
    { label: 'Total', value: stats?.total || 0, icon: Users, color: 'text-primary' },
    { label: 'Nouveaux', value: stats?.new || 0, icon: Plus, color: 'text-blue-500' },
    { label: 'Qualifiés', value: stats?.qualified || 0, icon: UserCheck, color: 'text-green-500' },
    { label: 'Convertis', value: stats?.converted || 0, icon: Target, color: 'text-purple-500' },
  ]

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={isExporting}>
                <Download className="mr-2 h-4 w-4" />
                Exporter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleExport('csv')}>
                Exporter en CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('excel')}>
                Exporter en Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" asChild>
            <Link href="/dashboard/prospects/import">
              <Upload className="mr-2 h-4 w-4" />
              Importer
            </Link>
          </Button>

          <Button variant="secondary" asChild className="border-primary/20 hover:bg-primary/5">
            <Link href="/dashboard/prospects">
              <Users className="mr-2 h-4 w-4 text-primary" />
              Voir mes prospects
            </Link>
          </Button>

          <Button asChild>
            <Link href="/dashboard/prospects/new">
              <Plus className="mr-2 h-4 w-4" />
              Nouveau prospect
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-muted ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
