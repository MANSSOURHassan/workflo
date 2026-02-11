"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts"

const data = [
  { month: "Jan", objectif: 50000, realise: 42000 },
  { month: "Fev", objectif: 55000, realise: 58000 },
  { month: "Mar", objectif: 60000, realise: 65000 },
  { month: "Avr", objectif: 58000, realise: 52000 },
  { month: "Mai", objectif: 65000, realise: 71000 },
  { month: "Juin", objectif: 70000, realise: 78000 },
]

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value)
}

export function SalesReport() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance commerciale</CardTitle>
        <CardDescription>
          Objectifs vs réalisés par mois
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="month"
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis
                className="text-xs"
                tickFormatter={(value) => `${value / 1000}k`}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="objectif"
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="5 5"
                strokeWidth={2}
                name="Objectif"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="realise"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                name="Réalisé"
                dot={{ fill: 'hsl(var(--primary))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
