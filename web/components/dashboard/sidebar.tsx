'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Car,
  UserCircle,
  CalendarClock,
  TrendingUp,
  TrendingDown,
  FileBarChart,
  Link2,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { getDeployInfo } from '@/lib/utils/deploy-info';

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
}

export function Sidebar({
  labels,
}: {
  labels: Record<string, string>;
}) {
  const pathname = usePathname();
  const { shortSha, commitMessage } = getDeployInfo();

  const items: NavItem[] = [
    { href: '/', label: labels.dashboard, icon: LayoutDashboard },
    { href: '/investors', label: labels.investors, icon: Users },
    { href: '/vehicles', label: labels.vehicles, icon: Car },
    { href: '/assignments', label: 'Alocações', icon: Link2 },
    { href: '/drivers', label: labels.drivers, icon: UserCircle },
    { href: '/events', label: labels.events, icon: CalendarClock },
    { href: '/revenues', label: labels.revenues, icon: TrendingUp },
    { href: '/expenses', label: labels.expenses, icon: TrendingDown },
    { href: '/reports', label: labels.reports, icon: FileBarChart },
    { href: '/settings', label: 'Configurações', icon: Settings },
  ];

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-border bg-card">
      <div className="flex h-14 items-center gap-2 border-b border-border px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
          F
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold tracking-tight">Fleet Investor</span>
          <span
            className="text-[10px] font-mono text-muted-foreground"
            title={commitMessage ? `Última alteração: ${commitMessage}` : undefined}
          >
            v.{shortSha}
          </span>
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 p-2">
        {items.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
