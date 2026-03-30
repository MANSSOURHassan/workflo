'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, CheckCircle2, Database, RefreshCw, AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface TableStatus {
  name: string
  exists: boolean
  columns: string[]
  missingColumns: string[]
  error?: string
}

const REQUIRED_TABLES = {
  prospects: ['id', 'email', 'first_name', 'last_name', 'company', 'status', 'source', 'assigned_to', 'address', 'city', 'country', 'ai_score', 'ai_reasoning', 'tags', 'notes', 'created_at', 'last_contacted_at'],
  activities: ['id', 'prospect_id', 'type', 'title', 'description', 'created_at'],
  team_members: ['id', 'user_id', 'email', 'first_name', 'last_name', 'role', 'created_at'],
  audit_logs: ['id', 'user_id', 'action', 'entity_type', 'entity_id', 'details', 'created_at'],
  integrations: ['id', 'user_id', 'provider', 'is_active', 'api_key', 'created_at'],
  ai_logs: ['id', 'user_id', 'action_type', 'model_used', 'created_at'],
  autopilot_rules: ['id', 'user_id', 'name', 'is_active', 'created_at'],
  webhooks: ['id', 'user_id', 'url', 'events', 'created_at'],
  api_keys: ['id', 'user_id', 'name', 'key', 'created_at']
}

export default function DebugDatabasePage() {
  const [status, setStatus] = useState<TableStatus[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  async function checkDatabase() {
    setIsLoading(true)
    setError(null)
    const results: TableStatus[] = []

    try {
      for (const [tableName, requiredCols] of Object.entries(REQUIRED_TABLES)) {
        // Simple head query to check existence and get columns
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(0)

        if (error) {
          results.push({
            name: tableName,
            exists: false,
            columns: [],
            missingColumns: requiredCols,
            error: error.message
          })
        } else {
          // If query succeeds, table exists. Let's try to fetch a single row to see all columns
          // Actually, Supabase error message when a column is missing is very specific.
          // For now, let's just mark it as existing if the main query worked.
          results.push({
            name: tableName,
            exists: true,
            columns: [], // We don't easily get names without data
            missingColumns: [] 
          })
        }
      }
      setStatus(results)
    } catch (err: any) {
      setError(err.message || 'Erreur inconnue lors du diagnostic')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    checkDatabase()
  }, [])

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className="flex justify-end">
        <Button onClick={checkDatabase} disabled={isLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Rafraîchir
        </Button>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg flex items-center gap-3">
          <AlertCircle className="h-5 w-5" />
          <p>{error}</p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {status.map((table) => (
          <Card key={table.name} className={table.exists ? 'border-primary/20' : 'border-destructive/20'}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl font-bold font-mono">{table.name}</CardTitle>
              {table.exists ? (
                <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Opérationnel
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <AlertCircle className="mr-1 h-3 w-3" />
                  Manquant
                </Badge>
              )}
            </CardHeader>
            <CardContent>
              {table.exists ? (
                <div className="space-y-4 pt-4">
                  <p className="text-sm text-green-600 dark:text-green-400">
                    La table est présente dans votre base de données.
                  </p>
                  <div className="text-xs text-muted-foreground">
                    Note: Si vous avez encore des erreurs, il se peut que certaines colonnes soient manquantes ou que le cache Supabase doive être rechargé.
                  </div>
                </div>
              ) : (
                <div className="space-y-4 pt-4">
                  <p className="text-sm text-destructive font-medium">
                    Erreur: {table.error}
                  </p>
                  <div className="bg-muted p-3 rounded text-xs space-y-2">
                    <p className="font-bold">Comment réparer :</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Copiez le contenu du fichier <code className="bg-card px-1 italic">
                        {['integrations', 'ai_logs', 'autopilot_rules', 'webhooks', 'api_keys'].includes(table.name) 
                          ? 'missing-tables.sql' 
                          : 'final_repair.sql'}
                      </code></li>
                      <li>Allez dans le **SQL Editor** de Supabase</li>
                      <li>Collez le script et cliquez sur **Run**</li>
                      <li>Exécutez <code className="bg-card px-1 italic">NOTIFY pgrst, 'reload schema';</code></li>
                      <li>Rechargez cette page</li>
                    </ol>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-primary" />
            Étape cruciale : Recharger le Schéma
          </CardTitle>
          <CardDescription>
            Si vos tables existent mais que l'application ne les voit pas encore.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm">
            Supabase utilise un cache pour le schéma. Après avoir créé des tables ou des colonnes, vous devez forcer le rechargement en exécutant cette commande SQL :
          </p>
          <pre className="bg-muted p-4 rounded-md text-sm font-mono text-primary">
            NOTIFY pgrst, 'reload schema';
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}
