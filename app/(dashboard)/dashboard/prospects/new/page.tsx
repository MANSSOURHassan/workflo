import { ProspectForm } from '@/components/prospects/prospect-form'

export default function NewProspectPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Nouveau Prospect</h1>
        <p className="text-muted-foreground">Ajoutez un nouveau prospect à votre base</p>
      </div>
      <ProspectForm />
    </div>
  )
}
