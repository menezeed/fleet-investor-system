import Link from 'next/link';
import { ListChecks, CalendarClock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { LOOKUP_CONFIGS } from '@/lib/lookups/config';

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Configurações</h1>
        <p className="text-sm text-muted-foreground">Gerencie as opções usadas nos formulários do sistema.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* CR-005 Change 1: "Expense Types" renamed to "Event Catalog" in the menu */}
        <Link href="/settings/event-catalog">
          <Card className="transition-colors hover:bg-muted/40">
            <CardContent className="flex items-start gap-3 p-4">
              <CalendarClock className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Catálogo de Eventos</p>
                <p className="text-xs text-muted-foreground">
                  Tipos de evento e despesa (ex: Troca de óleo, Manutenção), com descrição e frequência
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
        {LOOKUP_CONFIGS.map((config) => (
          <Link key={config.slug} href={`/settings/lookups/${config.slug}`}>
            <Card className="transition-colors hover:bg-muted/40">
              <CardContent className="flex items-start gap-3 p-4">
                <ListChecks className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">{config.title}</p>
                  <p className="text-xs text-muted-foreground">{config.description}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
