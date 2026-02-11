'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  FolderOpen,
  File,
  FileText,
  FileImage,
  FileSpreadsheet,
  Upload,
  Search,
  Download,
  Trash2,
  MoreHorizontal,
  Grid,
  List,
  Plus,
  Folder,
  Clock,
  X,
  Loader2
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

interface FolderType {
  id: string
  name: string
  color: string
  parent_id: string | null
  created_at: string
  document_count?: number
}

interface DocumentType {
  id: string
  name: string
  file_type: string
  file_size: number
  folder_id: string | null
  folder_name?: string
  storage_url: string | null
  created_at: string
  updated_at: string
}

const fileIcons: Record<string, React.ElementType> = {
  pdf: FileText,
  doc: FileText,
  docx: FileText,
  ppt: File,
  pptx: File,
  xls: FileSpreadsheet,
  xlsx: FileSpreadsheet,
  png: FileImage,
  jpg: FileImage,
  jpeg: FileImage,
  gif: FileImage,
}

const fileColors: Record<string, string> = {
  pdf: 'bg-red-100 text-red-600',
  doc: 'bg-blue-100 text-blue-600',
  docx: 'bg-blue-100 text-blue-600',
  ppt: 'bg-orange-100 text-orange-600',
  pptx: 'bg-orange-100 text-orange-600',
  xls: 'bg-green-100 text-green-600',
  xlsx: 'bg-green-100 text-green-600',
  png: 'bg-purple-100 text-purple-600',
  jpg: 'bg-purple-100 text-purple-600',
  jpeg: 'bg-purple-100 text-purple-600',
  gif: 'bg-purple-100 text-purple-600',
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

export default function DocumentsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [folders, setFolders] = useState<FolderType[]>([])
  const [documents, setDocuments] = useState<DocumentType[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [creating, setCreating] = useState(false)
  const supabase = createClient()

  // Charger les dossiers et documents
  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      // Charger les dossiers
      const { data: foldersData, error: foldersError } = await supabase
        .from('folders')
        .select('*')
        .order('name')

      if (foldersError) throw foldersError

      // Charger les documents
      const { data: documentsData, error: documentsError } = await supabase
        .from('documents')
        .select('*, folders(name)')
        .order('updated_at', { ascending: false })

      if (documentsError) throw documentsError

      // Compter les documents par dossier
      const foldersWithCount = (foldersData || []).map(folder => ({
        ...folder,
        document_count: (documentsData || []).filter(doc => doc.folder_id === folder.id).length
      }))

      setFolders(foldersWithCount)
      setDocuments((documentsData || []).map(doc => ({
        ...doc,
        folder_name: doc.folders?.name || 'Sans dossier'
      })))
    } catch (error: any) {
      console.error('Erreur:', error)
      toast.error('Erreur lors du chargement des données')
    } finally {
      setLoading(false)
    }
  }

  async function createFolder() {
    if (!newFolderName.trim()) {
      toast.error('Veuillez entrer un nom de dossier')
      return
    }

    setCreating(true)
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) throw new Error('Non authentifié')

      const { data, error } = await supabase
        .from('folders')
        .insert({
          name: newFolderName.trim(),
          user_id: userData.user.id
        })
        .select()
        .single()

      if (error) throw error

      setFolders([...folders, { ...data, document_count: 0 }])
      setNewFolderName('')
      setIsCreateFolderOpen(false)
      toast.success('Dossier créé avec succès!')
    } catch (error: any) {
      console.error('Erreur:', error)
      toast.error(error.message || 'Erreur lors de la création du dossier')
    } finally {
      setCreating(false)
    }
  }

  async function deleteFolder(folderId: string) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce dossier?')) return

    try {
      const { error } = await supabase
        .from('folders')
        .delete()
        .eq('id', folderId)

      if (error) throw error

      setFolders(folders.filter(f => f.id !== folderId))
      toast.success('Dossier supprimé')
    } catch (error: any) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la suppression')
    }
  }

  async function deleteDocument(documentId: string) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce document?')) return

    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId)

      if (error) throw error

      setDocuments(documents.filter(d => d.id !== documentId))
      toast.success('Document supprimé')
    } catch (error: any) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la suppression')
    }
  }

  const filteredDocuments = documents.filter(doc =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Documents</h1>
          <p className="text-muted-foreground">
            Gérez tous vos documents et fichiers
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsCreateFolderOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nouveau dossier
          </Button>
          <Button>
            <Upload className="mr-2 h-4 w-4" />
            Importer
          </Button>
        </div>
      </div>

      {/* Folders */}
      {folders.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-4">
          {folders.map((folder) => (
            <Card key={folder.id} className="cursor-pointer hover:bg-muted/50 transition-colors group">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                      <Folder className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">{folder.name}</p>
                      <p className="text-sm text-muted-foreground">{folder.document_count || 0} fichiers</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => deleteFolder(folder.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Folder className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              Aucun dossier créé.<br />
              Cliquez sur "Nouveau dossier" pour commencer.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Search and filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher un document..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex rounded-lg border">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents */}
      <Card>
        <CardHeader>
          <CardTitle>Fichiers récents</CardTitle>
          <CardDescription>{filteredDocuments.length} documents</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredDocuments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                Aucun document trouvé.<br />
                Importez des fichiers pour commencer.
              </p>
            </div>
          ) : viewMode === 'list' ? (
            <div className="space-y-2">
              {filteredDocuments.map((doc) => {
                const ext = doc.file_type || doc.name.split('.').pop()?.toLowerCase() || ''
                const Icon = fileIcons[ext] || File
                const colorClass = fileColors[ext] || 'bg-slate-100 text-slate-600'

                return (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colorClass}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">{doc.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{formatFileSize(doc.file_size)}</span>
                          <span>-</span>
                          <span>{doc.folder_name}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(doc.updated_at).toLocaleDateString('fr-FR')}
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {doc.storage_url && (
                            <DropdownMenuItem asChild>
                              <a href={doc.storage_url} download>
                                <Download className="mr-2 h-4 w-4" />
                                Télécharger
                              </a>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => deleteDocument(doc.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
              {filteredDocuments.map((doc) => {
                const ext = doc.file_type || doc.name.split('.').pop()?.toLowerCase() || ''
                const Icon = fileIcons[ext] || File
                const colorClass = fileColors[ext] || 'bg-slate-100 text-slate-600'

                return (
                  <div
                    key={doc.id}
                    className="flex flex-col items-center p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <div className={`flex h-16 w-16 items-center justify-center rounded-xl ${colorClass} mb-3`}>
                      <Icon className="h-8 w-8" />
                    </div>
                    <p className="font-medium text-sm text-center truncate w-full">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(doc.file_size)}</p>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog pour créer un dossier */}
      <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer un nouveau dossier</DialogTitle>
            <DialogDescription>
              Entrez le nom du dossier que vous souhaitez créer.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="folderName">Nom du dossier</Label>
              <Input
                id="folderName"
                placeholder="Ex: Contrats, Factures, Rapports..."
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && createFolder()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateFolderOpen(false)}>
              Annuler
            </Button>
            <Button onClick={createFolder} disabled={creating}>
              {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
