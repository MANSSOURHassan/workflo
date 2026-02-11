'use client'

import React from "react"

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { ArrowLeft, Upload, FileSpreadsheet, Check, AlertCircle, Download } from 'lucide-react'
import { toast } from 'sonner'

export default function ImportProspectsPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<{
    total: number
    success: number
    errors: number
    errorDetails?: string[]
  } | null>(null)

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv') && !selectedFile.name.endsWith('.xlsx')) {
        toast.error('Format non supporté. Utilisez un fichier CSV ou Excel.')
        return
      }
      setFile(selectedFile)
      setResult(null)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      if (!droppedFile.name.endsWith('.csv') && !droppedFile.name.endsWith('.xlsx')) {
        toast.error('Format non supporté. Utilisez un fichier CSV ou Excel.')
        return
      }
      setFile(droppedFile)
      setResult(null)
    }
  }, [])

  const handleImport = async () => {
    if (!file) return

    setIsProcessing(true)
    setProgress(0)

    // Simulate import process
    // In a real app, you would parse the file and call the API
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + 10
      })
    }, 200)

    // Simulate completion after 2 seconds
    setTimeout(() => {
      clearInterval(interval)
      setProgress(100)
      setIsProcessing(false)
      setResult({
        total: 150,
        success: 142,
        errors: 8,
        errorDetails: [
          'Ligne 23: Email invalide',
          'Ligne 45: Email en doublon',
          'Ligne 78: Email manquant',
          'Ligne 89: Email invalide',
          'Ligne 102: Email en doublon',
          'Ligne 115: Email manquant',
          'Ligne 128: Email invalide',
          'Ligne 145: Email en doublon',
        ]
      })
      toast.success('Import terminé')
    }, 2000)
  }

  const downloadTemplate = () => {
    const headers = ['email', 'first_name', 'last_name', 'company', 'job_title', 'phone', 'linkedin_url', 'website', 'address', 'city', 'country', 'status', 'source', 'tags', 'notes']
    const example = ['jean.dupont@entreprise.com', 'Jean', 'Dupont', 'TechCorp', 'Directeur Commercial', '+33612345678', 'https://linkedin.com/in/jean-dupont', 'https://techcorp.fr', '123 Rue de la Paix', 'Paris', 'France', 'new', 'manual', 'vip,tech', 'Notes ici']
    
    const csvContent = [headers, example].map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'template_prospects.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/prospects">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Importer des prospects</h1>
          <p className="text-muted-foreground">Importez vos prospects depuis un fichier CSV ou Excel</p>
        </div>
      </div>

      {/* Template Download */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Modèle de fichier</CardTitle>
          <CardDescription>
            Téléchargez le modèle pour vous assurer que votre fichier est correctement formaté
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="mr-2 h-4 w-4" />
            Télécharger le modèle CSV
          </Button>
        </CardContent>
      </Card>

      {/* Upload Zone */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sélectionner un fichier</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              file ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            {file ? (
              <div className="flex flex-col items-center gap-3">
                <FileSpreadsheet className="h-12 w-12 text-primary" />
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} Ko
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFile(null)}
                >
                  Changer de fichier
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <Upload className="h-12 w-12 text-muted-foreground" />
                <div>
                  <p className="font-medium">Glissez-déposez votre fichier ici</p>
                  <p className="text-sm text-muted-foreground">ou cliquez pour sélectionner</p>
                </div>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  style={{ position: 'relative' }}
                />
                <Button variant="outline" asChild>
                  <label className="cursor-pointer">
                    Parcourir
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Progress */}
      {isProcessing && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Import en cours...</span>
                <span className="text-sm text-muted-foreground">{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              Import terminé
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-2xl font-bold">{result.total}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{result.success}</p>
                <p className="text-sm text-muted-foreground">Importés</p>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{result.errors}</p>
                <p className="text-sm text-muted-foreground">Erreurs</p>
              </div>
            </div>

            {result.errorDetails && result.errorDetails.length > 0 && (
              <div className="border rounded-lg p-4 bg-red-50/50">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span className="font-medium text-sm">Détails des erreurs</span>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1 max-h-32 overflow-y-auto">
                  {result.errorDetails.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-2">
              <Button asChild>
                <Link href="/dashboard/prospects">Voir les prospects</Link>
              </Button>
              <Button variant="outline" onClick={() => { setFile(null); setResult(null); }}>
                Nouvel import
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import Button */}
      {file && !isProcessing && !result && (
        <Button className="w-full" onClick={handleImport}>
          <Upload className="mr-2 h-4 w-4" />
          Lancer l&apos;import
        </Button>
      )}
    </div>
  )
}
