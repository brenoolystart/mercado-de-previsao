import { Construction } from 'lucide-react';

export function MaintenancePage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center max-w-md space-y-6">
        <div className="mx-auto w-20 h-20 rounded-full bg-amber-500/20 flex items-center justify-center">
          <Construction className="h-10 w-10 text-amber-500" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">Em Manutenção</h1>
        <p className="text-muted-foreground text-lg">
          Estamos realizando melhorias na plataforma. Voltaremos em breve!
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
          Trabalhando nisso...
        </div>
      </div>
    </div>
  );
}
