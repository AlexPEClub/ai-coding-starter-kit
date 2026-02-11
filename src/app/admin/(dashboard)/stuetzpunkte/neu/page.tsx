import { StuetzpunktForm } from '@/components/stuetzpunkt-form'

export default function NeuStuetzpunktPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Neuer Stützpunkt</h2>
        <p className="text-muted-foreground">
          Erstellen Sie einen neuen Standort
        </p>
      </div>
      <StuetzpunktForm />
    </div>
  )
}
