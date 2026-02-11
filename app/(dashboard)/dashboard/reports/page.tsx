"use client"

import useSWR from "swr"
import { ReportsHeader } from "@/components/reports/reports-header"
import { ReportsOverview } from "@/components/reports/reports-overview"
import { ProspectsReport } from "@/components/reports/prospects-report"
import { SalesReport } from "@/components/reports/sales-report"
import { CampaignsReport } from "@/components/reports/campaigns-report"
import { getDashboardStats } from "@/lib/actions/dashboard"

export default function ReportsPage() {
  const { data: stats, isLoading } = useSWR("dashboard-stats", () => getDashboardStats())

  return (
    <div className="flex flex-col gap-6">
      <ReportsHeader />
      
      <ReportsOverview stats={stats} isLoading={isLoading} />
      
      <div className="grid gap-6 lg:grid-cols-2">
        <ProspectsReport />
        <SalesReport />
      </div>
      
      <CampaignsReport />
    </div>
  )
}
