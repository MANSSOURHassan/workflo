'use client'

import React, { useState } from 'react'
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
import { Plus, Upload, Loader2, AlertCircle, Download } from 'lucide-react'
import { createBankTransaction } from '@/lib/actions/banking'
import { BankAccount } from '@/lib/types/database'
import { toast } from 'sonner'
import Papa from 'papaparse'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface ImportTransactionsModalProps {
    bankAccountId: string
    onSuccess: () => void
}

export function ImportTransactionsModal({ bankAccountId, onSuccess }: ImportTransactionsModalProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [file, setFile] = useState<File | null>(null)
    const [preview, setPreview] = useState<any[]>([])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (selectedFile) {
            setFile(selectedFile)
            Papa.parse(selectedFile, {
                header: true,
                preview: 5,
                complete: (results) => {
                    setPreview(results.data)
                }
            })
        }
    }

    const handleImport = async () => {
        if (!file || !bankAccountId) return

        setLoading(true)
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                let successCount = 0
                let errorCount = 0

                for (const row of results.data as any) {
                    // Attempt to map common CSV headers
                    const date = row.Date || row.date || row.DATE
                    const description = row.Description || row.description || row.Libellé || row.Label
                    const amount = parseFloat((row.Amount || row.amount || row.Montant || '0').replace(',', '.'))

                    if (date && description && !isNaN(amount)) {
                        const result = await createBankTransaction({
                            bank_account_id: bankAccountId,
                            date: new Date(date).toISOString().split('T')[0],
                            description,
                            amount,
                            status: 'unreconciled'
                        })

                        if (!result.error) successCount++
                        else errorCount++
                    }
                }

                toast.success(`${successCount} transactions importées avec succès.`)
                if (errorCount > 0) toast.error(`${errorCount} erreurs lors de l'importation.`)

                setOpen(false)
                setFile(null)
                setPreview([])
                onSuccess()
                setLoading(false)
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <Upload className="h-4 w-4" />
                    Importer CSV
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Importer des transactions</DialogTitle>
                    <DialogDescription>
                        Importez un fichier CSV bancaire. Les colonnes doivent contenir "Date", "Description" et "Amount".
                        <br />
                        <a
                            href="/templates/bank_import_template.csv"
                            download
                            className="text-primary hover:underline font-semibold flex items-center gap-1 mt-2"
                        >
                            <Download className="h-3 w-3" />
                            Télécharger le modèle CSV
                        </a>
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="flex items-center justify-center w-full">
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Upload className="w-8 h-8 mb-3 text-muted-foreground" />
                                <p className="mb-2 text-sm text-muted-foreground">
                                    <span className="font-semibold">Cliquez pour téléverser</span> ou glisser-déposer
                                </p>
                                <p className="text-xs text-muted-foreground">Fichier CSV uniquement</p>
                            </div>
                            <input type="file" className="hidden" accept=".csv" onChange={handleFileChange} />
                        </label>
                    </div>

                    {file && (
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Fichier sélectionné</AlertTitle>
                            <AlertDescription>
                                {file.name} ({(file.size / 1024).toFixed(1)} KB)
                            </AlertDescription>
                        </Alert>
                    )}

                    {preview.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs font-semibold uppercase text-muted-foreground">Aperçu des 5 premières lignes :</p>
                            <div className="max-h-32 overflow-auto text-[10px] border rounded-md p-2 bg-muted/20">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b">
                                            {Object.keys(preview[0]).map(key => <th key={key} className="text-left p-1">{key}</th>)}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {preview.map((row, i) => (
                                            <tr key={i} className="border-b last:border-0">
                                                {Object.values(row).map((val: any, j) => <td key={j} className="p-1 truncate max-w-[100px]">{val}</td>)}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
                    <Button onClick={handleImport} disabled={loading || !file}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Lancer l'importation
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
