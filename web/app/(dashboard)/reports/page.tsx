import Link from 'next/link';
import { Car, Users, UserCircle, CalendarClock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const reports = [
  { href: '/reports/vehicles', label: 'Relatório de Veículos', desc: 'ROI, lucro e depreciação por veículo', icon: Car },
  { href: '/reports/investors', label: 'Relatório de Investidores', desc: 'Participação, lucro e portfólio por investidor', icon: Users },
  { href: '/reports/fleet', label: 'Relatório de Frota', desc: 'Visão consolidada de receitas, despesas e ocupação', icon: CalendarClock },
  { href: '/reports/events', label: 'Relatório de Eventos', desc: 'Eventos passados ou futuros por período', icon: UserCircle },
];

export default function ReportsIndexPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold tracking-tight">Relatórios</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {reports.map((report) => (
          <Link key={report.href} href={report.href}>
            <Card className="transition-colors hover:bg-muted/40">
              <CardContent className="flex items-start gap-3 p-4">
                <report.icon className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">{report.label}</p>
                  <p className="text-xs text-muted-foreground">{report.desc}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
