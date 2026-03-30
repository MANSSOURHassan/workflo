"use client"

import useSWR from "swr"
import { CampaignsHeader } from "@/components/campaigns/campaigns-header"
import { CampaignsList } from "@/components/campaigns/campaigns-list"
import { CampaignStats } from "@/components/campaigns/campaign-stats"
import { PageHeader } from "@/components/dashboard/page-header"
import { getCampaigns } from "@/lib/actions/campaigns"
import type { Campaign } from "@/lib/types/database"

async function fetchCampaigns() {
  const result = await getCampaigns()
  return result.data || []
}

export default function CampaignsPage() {
  const { data: campaigns, isLoading, mutate } = useSWR<Campaign[]>(
    "campaigns",
    fetchCampaigns
  )

  return (
    <div className="flex flex-col gap-6">
      <PageHeader 
        title="Campagnes" 
        description="Créez et analysez vos campagnes de prospection pour maximiser votre impact."
      />
      <CampaignsHeader onCampaignCreated={() => mutate()} />
      
      <CampaignStats campaigns={campaigns || []} />
      
      <CampaignsList 
        campaigns={campaigns || []} 
        isLoading={isLoading}
        onCampaignUpdated={() => mutate()}
      />
    </div>
  )
}
