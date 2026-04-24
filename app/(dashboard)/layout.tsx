import React from "react"
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { DashboardHeader } from '@/components/dashboard/header'
import { Copilot } from '@/components/ai/copilot'

import { getCustomization } from '@/lib/actions/customize'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Fetch profile and customization in parallel
  const [profileResult, customizationResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single(),
    getCustomization()
  ])

  const profile = profileResult.data
  const customization = customizationResult.data

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="hidden md:flex h-full">
        <DashboardSidebar user={user} profile={profile} customization={customization} />
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader user={user} profile={profile} customization={customization} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
      <Copilot />
    </div>
  )
}
