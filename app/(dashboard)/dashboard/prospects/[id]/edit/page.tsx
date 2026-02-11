import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getProspect } from '@/lib/actions/prospects'
import { ProspectForm } from '@/components/prospects/prospect-form'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

interface EditProspectPageProps {
  params: Promise<{ id: string }>
}

export default async function EditProspectPage({ params }: EditProspectPageProps) {
  const { id } = await params
  const { data: prospect, error } = await getProspect(id)

  if (error || !prospect) {
    notFound()
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/prospects/${prospect.id}`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Modifier le prospect</h1>
          <p className="text-muted-foreground">
            {prospect.first_name && prospect.last_name
              ? `${prospect.first_name} ${prospect.last_name}`
              : prospect.email}
          </p>
        </div>
      </div>
      <ProspectForm prospect={prospect} />
    </div>
  )
}
