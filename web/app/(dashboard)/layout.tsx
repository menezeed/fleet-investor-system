import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/dashboard/sidebar';
import { LogoutButton } from '@/components/dashboard/logout-button';
import { LanguageSwitcher } from '@/components/dashboard/language-switcher';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single();

  const t = await getTranslations('nav');

  return (
    <div className="flex">
      <Sidebar
        labels={{
          dashboard: t('dashboard'),
          investors: t('investors'),
          vehicles: t('vehicles'),
          drivers: t('drivers'),
          events: t('events'),
          reports: t('reports'),
        }}
      />
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-border bg-card px-6">
          <span className="text-sm text-muted-foreground">
            {profile?.full_name ?? user.email}
          </span>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <LogoutButton label={t('logout')} />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
