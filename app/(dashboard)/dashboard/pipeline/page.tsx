"use client"

import { useCallback } from "react"
import useSWR from "swr"
import { PipelineHeader } from "@/components/pipeline/pipeline-header"
import { PipelineKanban } from "@/components/pipeline/pipeline-kanban"
import { PipelineStats } from "@/components/pipeline/pipeline-stats"
import { getDefaultPipeline, getPipelineStages, getDeals } from "@/lib/actions/pipeline"
import type { Pipeline, PipelineStage, Deal } from "@/lib/types/database"

async function fetchDefaultPipeline(): Promise<Pipeline | null> {
  const result = await getDefaultPipeline()
  return result.data || null
}

async function fetchStages(pipelineId: string): Promise<PipelineStage[]> {
  const result = await getPipelineStages(pipelineId)
  return result || []
}

async function fetchDeals(pipelineId: string): Promise<Deal[]> {
  const result = await getDeals(pipelineId)
  return result.data || []
}

export default function PipelinePage() {
  const { data: pipeline, mutate: mutatePipeline } = useSWR<Pipeline | null>(
    "default-pipeline",
    fetchDefaultPipeline
  )

  const { data: stages, mutate: mutateStages } = useSWR<PipelineStage[]>(
    pipeline ? `pipeline-stages-${pipeline.id}` : null,
    () => pipeline ? fetchStages(pipeline.id) : Promise.resolve([])
  )

  const { data: deals, mutate: mutateDeals } = useSWR<Deal[]>(
    pipeline ? `pipeline-deals-${pipeline.id}` : null,
    () => pipeline ? fetchDeals(pipeline.id) : Promise.resolve([])
  )

  const refreshAll = useCallback(() => {
    mutatePipeline()
    mutateStages()
    mutateDeals()
  }, [mutatePipeline, mutateStages, mutateDeals])

  return (
    <div className="flex flex-col gap-6">
      <PipelineHeader 
        pipeline={pipeline} 
        onPipelineUpdated={refreshAll} 
      />
      
      <PipelineStats stages={stages || []} deals={deals || []} />
      
      <PipelineKanban
        pipeline={pipeline}
        stages={stages || []}
        deals={deals || []}
        onDealsUpdated={() => mutateDeals()}
        onStagesUpdated={() => mutateStages()}
      />
    </div>
  )
}
