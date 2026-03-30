"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts"
import { createClient } from "@/lib/supabase/client"
import { startOfMonth, subMonths, format, endOfDay, addDays } from "date-fns"
import { fr } from "date-fns/locale"
import { Loader2 } from "lucide-react"

type MonthData = {
  month: string
  realise: number
  depenses: number
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value)

export function SalesReport() {
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

        const { data: invoices } = await supabase.from('invoices').select('total')
          .eq('user_id', user.id).eq('status', 'paid')
          .gte('issue_date', monthStart).lte('issue_date', monthEnd)

        const { data: expenses } = await supabase.from('expenses').select('total_amount')
          .eq('user_id', user.id).eq('status', 'paid')
          .gte('issue_date', monthStart).lte('issue_date', monthEnd)

        const realise = invoices?.reduce((s, d) => s + (Number(d.total) || 0), 0) || 0
        const depenses = expenses?.reduce((s, d) => s + (Number(d.total_amount) || 0), 0) || 0

        result.push({ month: format(date, 'MMM', { locale: fr }), realise, depenses })
      }
      setData(result)
      setLoading(false)
    }
    load()
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance commerciale</CardTitle>
        <CardDescription>CA encaissé vs dépenses réelles par mois</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[300px] flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis className="text-xs" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                />
                <Legend />
                <Line type="monotone" dataKey="realise" stroke="hsl(var(--primary))" strokeWidth={2} name="CA Encaissé" dot={{ fill: 'hsl(var(--primary))' }} />
                <Line type="monotone" dataKey="depenses" stroke="#EF4444" strokeDasharray="5 5" strokeWidth={2} name="Dépenses" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
