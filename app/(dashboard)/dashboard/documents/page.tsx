'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  File, FileText, FileImage, FileSpreadsheet,
  Upload, Search, Download, Trash2, MoreHorizontal,
  Grid, List, Plus, Folder, FolderOpen, Clock, Loader2,
  Eye, ChevronRight, Home, ExternalLink, ArrowLeft
} from 'lucide-react'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { PageHeader } from '@/components/dashboard/page-header'

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
  pdf: FileText, doc: FileText, docx: FileText,
  ppt: File, pptx: File,
  xls: FileSpreadsheet, xlsx: FileSpreadsheet,
  png: FileImage, jpg: FileImage, jpeg: FileImage, gif: FileImage,
  txt: FileText, csv: FileSpreadsheet,
}

const fileColors: Record<string, string> = {
  pdf: 'bg-red-100 text-red-600',
  doc: 'bg-blue-100 text-blue-600', docx: 'bg-blue-100 text-blue-600',
  ppt: 'bg-orange-100 text-orange-600', pptx: 'bg-orange-100 text-orange-600',
  xls: 'bg-green-100 text-green-600', xlsx: 'bg-green-100 text-green-600',
  png: 'bg-purple-100 text-purple-600', jpg: 'bg-purple-100 text-purple-600',
  jpeg: 'bg-purple-100 text-purple-600', gif: 'bg-purple-100 text-purple-600',
  txt: 'bg-slate-100 text-slate-600', csv: 'bg-emerald-100 text-emerald-600',
}

const PREVIEWABLE = ['png', 'jpg', 'jpeg', 'gif', 'pdf', 'txt']

function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

export default function DocumentsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [allFolders, setAllFolders] = useState<FolderType[]>([])
  const [allDocuments, setAllDocuments] = useState<DocumentType[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [creating, setCreating] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: string | null; name: string }[]>([{ id: null, name: 'Mes Documents' }])
  const [previewDoc, setPreviewDoc] = useState<DocumentType | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    try {
      const { data: foldersData, error: foldersError } = await supabase
        .from('folders').select('*').order('name')
      if (foldersError) throw foldersError

      const { data: documentsData, error: documentsError } = await supabase
        .from('documents').select('*, folders(name)').order('updated_at', { ascending: false })
      if (documentsError) throw documentsError

      const foldersWithCount = (foldersData || []).map(folder => ({
        ...folder,
        document_count: (documentsData || []).filter(doc => doc.folder_id === folder.id).length
      }))

      setAllFolders(foldersWithCount)
      setAllDocuments((documentsData || []).map(doc => ({
        ...doc,
        folder_name: doc.folders?.name || 'Sans dossier'
      })))
    } catch (error: any) {
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  // Navigate into a folder
  function openFolder(folder: FolderType) {
    setCurrentFolderId(folder.id)
    setBreadcrumbs(prev => [...prev, { id: folder.id, name: folder.name }])
    setSearchQuery('')
  }

  // Navigate to a breadcrumb
  function navigateTo(index: number) {
    const crumb = breadcrumbs[index]
    setCurrentFolderId(crumb.id)
    setBreadcrumbs(breadcrumbs.slice(0, index + 1))
    setSearchQuery('')
  }

  const visibleFolders = allFolders.filter(f =>
    f.parent_id === currentFolderId &&
    (searchQuery === '' || f.name.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const visibleDocuments = allDocuments.filter(doc =>
    doc.folder_id === currentFolderId &&
    (searchQuery === '' || doc.name.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files
    if (!files || files.length === 0) return

    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) { toast.error('Non authentifié'); return }

    setUploading(true)
    let successCount = 0

    for (const file of Array.from(files)) {
      try {
        const ext = file.name.split('.').pop()?.toLowerCase() || ''
        const filePath = `${userData.user.id}/${Date.now()}_${file.name}`

        const { error: storageError } = await supabase.storage
          .from('documents').upload(filePath, file, { upsert: false })
        if (storageError) throw storageError

        const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(filePath)

        const { data: docData, error: dbError } = await supabase
          .from('documents')
          .insert({
            user_id: userData.user.id,
            name: file.name,
            file_type: ext,
            file_size: file.size,
            storage_path: filePath,
            storage_url: publicUrl,
            folder_id: currentFolderId,
          })
          .select('*, folders(name)')
          .single()

        if (dbError) throw dbError

        const newDoc = {
          ...docData,
          folder_name: docData.folders?.name || 'Sans dossier'
        }
        setAllDocuments(prev => [newDoc, ...prev])
        // Update folder count
        if (currentFolderId) {
          setAllFolders(prev => prev.map(f =>
            f.id === currentFolderId ? { ...f, document_count: (f.document_count || 0) + 1 } : f
          ))
        }
        successCount++
      } catch (err: any) {
        toast.error(`Échec: "${file.name}" — ${err.message}`)
      }
    }

    if (successCount > 0)
      toast.success(`${successCount} fichier${successCount > 1 ? 's' : ''} importé${successCount > 1 ? 's' : ''} !`)

    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function createFolder() {
    if (!newFolderName.trim()) { toast.error('Entrez un nom de dossier'); return }
    setCreating(true)
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) throw new Error('Non authentifié')

      const { data, error } = await supabase
        .from('folders')
        .insert({ name: newFolderName.trim(), user_id: userData.user.id, parent_id: currentFolderId })
        .select().single()
      if (error) throw error

      setAllFolders(prev => [...prev, { ...data, document_count: 0 }])
      setNewFolderName('')
      setIsCreateFolderOpen(false)
      toast.success('Dossier créé !')
    } catch (error: any) {
      toast.error(error.message || 'Erreur')
    } finally {
      setCreating(false)
    }
  }

  async function deleteFolder(folderId: string) {
    if (!confirm('Supprimer ce dossier ?')) return
    const { error } = await supabase.from('folders').delete().eq('id', folderId)
    if (error) { toast.error('Erreur de suppression'); return }
    setAllFolders(prev => prev.filter(f => f.id !== folderId))
    toast.success('Dossier supprimé')
  }

  async function deleteDocument(doc: DocumentType) {
    if (!confirm(`Supprimer "${doc.name}" ?`)) return
    try {
      if (doc.storage_url) {
        const path = doc.storage_url.split('/documents/')[1]
        if (path) await supabase.storage.from('documents').remove([decodeURIComponent(path)])
      }
      const { error } = await supabase.from('documents').delete().eq('id', doc.id)
      if (error) throw error
      setAllDocuments(prev => prev.filter(d => d.id !== doc.id))
      toast.success('Document supprimé')
    } catch (err: any) {
      toast.error('Erreur: ' + err.message)
    }
  }

  function openDocument(doc: DocumentType) {
    const ext = doc.file_type?.toLowerCase()
    if (PREVIEWABLE.includes(ext) && doc.storage_url) {
      setPreviewDoc(doc)
    } else if (doc.storage_url) {
      window.open(doc.storage_url, '_blank')
    } else {
      toast.error('Aucune URL disponible pour ce document')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const currentFolderName = breadcrumbs[breadcrumbs.length - 1]?.name || 'Mes Documents'

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Documents" 
        description="Gérez et organisez vos documents importants de manière sécurisée."
      >
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            multiple
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.gif,.txt,.csv"
            onChange={handleFileUpload}
          />
          <Button variant="outline" onClick={() => setIsCreateFolderOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nouveau dossier
          </Button>
          <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            {uploading ? 'Import...' : 'Importer'}
          </Button>
        </div>
      </PageHeader>

      {/* Breadcrumbs */}
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={index}>
            {index === 0 ? (
              <button
                onClick={() => navigateTo(0)}
                className="flex items-center gap-1 hover:text-primary transition-colors"
              >
                <Home className="h-4 w-4" />
                <span>{crumb.name}</span>
              </button>
            ) : (
              <button
                onClick={() => navigateTo(index)}
                className={`flex items-center gap-1 transition-colors hover:text-primary ${
                  index === breadcrumbs.length - 1 ? 'text-foreground font-medium' : ''
                }`}
              >
                {crumb.name}
              </button>
            )}
            {index < breadcrumbs.length - 1 && <ChevronRight className="h-3 w-3" />}
          </React.Fragment>
        ))}
        {currentFolderId && (
          <Button variant="ghost" size="sm" className="ml-2 h-7 px-2" onClick={() => navigateTo(breadcrumbs.length - 2)}>
            <ArrowLeft className="h-3 w-3 mr-1" />
            Retour
          </Button>
        )}
      </div>

      {/* Search and view toggle */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex rounded-lg border">
          <Button variant={viewMode === 'grid' ? 'default' : 'ghost'} size="icon" onClick={() => setViewMode('grid')}>
            <Grid className="h-4 w-4" />
          </Button>
          <Button variant={viewMode === 'list' ? 'default' : 'ghost'} size="icon" onClick={() => setViewMode('list')}>
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Folders in current level */}
      {visibleFolders.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Dossiers</h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {visibleFolders.map((folder) => (
              <Card
                key={folder.id}
                className="cursor-pointer hover:bg-primary/5 hover:border-primary/30 transition-all group"
                onClick={() => openFolder(folder)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                        <FolderOpen className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{folder.name}</p>
                        <p className="text-xs text-muted-foreground">{folder.document_count || 0} fichier{(folder.document_count || 0) !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 h-7 w-7">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openFolder(folder) }}>
                          <FolderOpen className="mr-2 h-4 w-4" />
                          Ouvrir
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); deleteFolder(folder.id) }}>
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
        </div>
      )}

      {/* Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <File className="h-5 w-5" />
            {currentFolderName}
          </CardTitle>
          <CardDescription>{visibleDocuments.length} document{visibleDocuments.length !== 1 ? 's' : ''}</CardDescription>
        </CardHeader>
        <CardContent>
          {visibleDocuments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <FileText className="h-14 w-14 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground font-medium">Aucun document ici</p>
              <p className="text-sm text-muted-foreground mt-1">Cliquez sur "Importer" pour ajouter des fichiers</p>
              <Button variant="outline" className="mt-4" onClick={() => fileInputRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" />
                Importer des fichiers
              </Button>
            </div>
          ) : viewMode === 'list' ? (
            <div className="space-y-1">
              {visibleDocuments.map((doc) => {
                const ext = doc.file_type || doc.name.split('.').pop()?.toLowerCase() || ''
                const Icon = fileIcons[ext] || File
                const colorClass = fileColors[ext] || 'bg-slate-100 text-slate-600'
                const canPreview = PREVIEWABLE.includes(ext) && doc.storage_url

                return (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/60 transition-colors cursor-pointer group"
                    onClick={() => openDocument(doc)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${colorClass}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{doc.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{formatFileSize(doc.file_size)}</span>
                          <span>·</span>
                          <Clock className="h-3 w-3" />
                          <span suppressHydrationWarning>{new Date(doc.updated_at).toLocaleDateString('fr-FR')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      {canPreview && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Prévisualiser"
                          onClick={(e) => { e.stopPropagation(); setPreviewDoc(doc) }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      {doc.storage_url && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Télécharger"
                          onClick={(e) => { e.stopPropagation(); window.open(doc.storage_url!, '_blank') }}>
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" title="Supprimer"
                        onClick={(e) => { e.stopPropagation(); deleteDocument(doc) }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {visibleDocuments.map((doc) => {
                const ext = doc.file_type || doc.name.split('.').pop()?.toLowerCase() || ''
                const Icon = fileIcons[ext] || File
                const colorClass = fileColors[ext] || 'bg-slate-100 text-slate-600'
                const isImage = ['png', 'jpg', 'jpeg', 'gif'].includes(ext)

                return (
                  <div
                    key={doc.id}
                    className="flex flex-col items-center p-4 rounded-xl border hover:border-primary/30 hover:bg-muted/50 transition-all cursor-pointer group relative"
                    onClick={() => openDocument(doc)}
                  >
                    {/* Preview thumbnail for images */}
                    {isImage && doc.storage_url ? (
                      <div className="h-20 w-full rounded-lg overflow-hidden mb-3 bg-muted">
                        <img src={doc.storage_url} alt={doc.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className={`flex h-16 w-16 items-center justify-center rounded-xl ${colorClass} mb-3`}>
                        <Icon className="h-8 w-8" />
                      </div>
                    )}
                    <p className="font-medium text-sm text-center truncate w-full">{doc.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{formatFileSize(doc.file_size)}</p>
                    <Badge variant="outline" className="text-[10px] mt-2 uppercase">{ext}</Badge>

                    {/* Hover actions */}
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-6 w-6 bg-background/80"
                        onClick={(e) => { e.stopPropagation(); deleteDocument(doc) }}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Folder Dialog */}
      <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer un nouveau dossier</DialogTitle>
            <DialogDescription>
              Ce dossier sera créé dans : <strong>{currentFolderName}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-4">
            <Label htmlFor="folderName">Nom du dossier</Label>
            <Input
              id="folderName"
              placeholder="Ex: Contrats, Factures..."
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createFolder()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateFolderOpen(false)}>Annuler</Button>
            <Button onClick={createFolder} disabled={creating}>
              {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Preview Dialog */}
      <Dialog open={!!previewDoc} onOpenChange={(open) => !open && setPreviewDoc(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
          {previewDoc && (
            <>
              <DialogHeader className="p-4 border-b shrink-0">
                <div className="flex items-center justify-between">
                  <div>
                    <DialogTitle>{previewDoc.name}</DialogTitle>
                    <DialogDescription>{formatFileSize(previewDoc.file_size)}</DialogDescription>
                  </div>
                  {previewDoc.storage_url && (
                    <Button variant="outline" size="sm" onClick={() => window.open(previewDoc.storage_url!, '_blank')}>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Ouvrir dans un onglet
                    </Button>
                  )}
                </div>
              </DialogHeader>
              <div className="flex-1 overflow-auto p-4">
                {(() => {
                  const ext = previewDoc.file_type?.toLowerCase()
                  if (['png', 'jpg', 'jpeg', 'gif'].includes(ext)) {
                    return (
                      <img
                        src={previewDoc.storage_url!}
                        alt={previewDoc.name}
                        className="max-w-full max-h-[70vh] object-contain mx-auto block rounded-lg"
                      />
                    )
                  }
                  if (ext === 'pdf') {
                    return (
                      <iframe
                        src={previewDoc.storage_url!}
                        className="w-full h-[70vh] rounded-lg border"
                        title={previewDoc.name}
                      />
                    )
                  }
                  if (ext === 'txt') {
                    return (
                      <div className="bg-muted rounded-lg p-4 font-mono text-sm whitespace-pre-wrap max-h-[70vh] overflow-auto">
                        <a href={previewDoc.storage_url!} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                          Cliquez pour voir le fichier texte →
                        </a>
                      </div>
                    )
                  }
                  return (
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                      <File className="h-16 w-16 mb-4 opacity-30" />
                      <p>Prévisualisation non disponible pour ce type de fichier</p>
                      <Button className="mt-4" onClick={() => window.open(previewDoc.storage_url!, '_blank')}>
                        <Download className="mr-2 h-4 w-4" />
                        Télécharger le fichier
                      </Button>
                    </div>
                  )
                })()}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
