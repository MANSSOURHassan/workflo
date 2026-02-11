"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts"

const data = [
  { month: "Jan", nouveaux: 65, qualifies: 45, convertis: 12 },
  { month: "Fev", nouveaux: 78, qualifies: 52, convertis: 18 },
  { month: "Mar", nouveaux: 90, qualifies: 68, convertis: 24 },
  { month: "Avr", nouveaux: 81, qualifies: 55, convertis: 20 },
  { month: "Mai", nouveaux: 95, qualifies: 72, convertis: 28 },
  { month: "Juin", nouveaux: 110, qualifies: 85, convertis: 35 },
]

export function ProspectsReport() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Évolution des prospects</CardTitle>
        <CardDescription>
          Nouveaux prospects, qualifiés et convertis par mois
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="month"
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Bar
                dataKey="nouveaux"
                fill="hsl(var(--chart-1))"
                name="Nouveaux"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="qualifies"
                fill="hsl(var(--chart-2))"
                name="Qualifiés"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="convertis"
                fill="hsl(var(--chart-3))"
                name="Convertis"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
