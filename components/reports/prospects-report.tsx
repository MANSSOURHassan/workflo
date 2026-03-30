"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts"
import { createClient } from "@/lib/supabase/client"
import { startOfMonth, subMonths, format, endOfDay, addDays } from "date-fns"
import { fr } from "date-fns/locale"
import { Loader2 } from "lucide-react"

type MonthData = {
  month: string
  nouveaux: number
  convertis: number
}

export function ProspectsReport() {
  const [data, setData] = useState<MonthData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const result: MonthData[] = []
      for (let i = 5; i >= 0; i--) {
        const date = subMonths(new Date(), i)
        const monthStart = startOfMonth(date).toISOString()
        const monthEnd = endOfDay(addDays(startOfMonth(subMonths(date, -1)), -1)).toISOString()

        const { count: nouveaux } = await supabase.from('prospects').select('*', { count: 'exact', head: true })
          .eq('user_id', user.id).gte('created_at', monthStart).lte('created_at', monthEnd)

        const { count: convertis } = await supabase.from('deals').select('*', { count: 'exact', head: true })
          .eq('user_id', user.id).eq('status', 'won').gte('created_at', monthStart).lte('created_at', monthEnd)

        result.push({
          month: format(date, 'MMM', { locale: fr }),
          nouveaux: nouveaux || 0,
          convertis: convertis || 0,
        })
      }
      setData(result)
      setLoading(false)
    }
    load()
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Évolution des prospects</CardTitle>
        <CardDescription>Nouveaux prospects et deals gagnés par mois (données réelles)</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[300px] flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                />
                <Legend />
                <Bar dataKey="nouveaux" fill="#6366F1" name="Nouveaux prospects" radius={[4, 4, 0, 0]} />
                <Bar dataKey="convertis" fill="#22C55E" name="Deals gagnés" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
