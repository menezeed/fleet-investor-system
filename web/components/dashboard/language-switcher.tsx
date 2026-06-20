'use client';

import { useRouter } from 'next/navigation';

export function LanguageSwitcher() {
  const router = useRouter();

  function setLocale(locale: 'pt' | 'en') {
    document.cookie = `locale=${locale}; path=/; max-age=31536000`;
    router.refresh();
  }

  return (
    <div className="flex items-center gap-1 rounded-md border border-border p-0.5 text-xs">
      <button
        onClick={() => setLocale('pt')}
        className="rounded px-2 py-1 font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        PT
      </button>
      <button
        onClick={() => setLocale('en')}
        className="rounded px-2 py-1 font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        EN
      </button>
    </div>
  );
}
