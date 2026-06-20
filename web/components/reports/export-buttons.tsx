'use client';

import { FileDown, FileSpreadsheet } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import { exportToPdf, exportToExcel, type ExportColumn } from '@/lib/utils/export';

interface ExportButtonsProps {
  title: string;
  columns: ExportColumn[];
  rows: Record<string, unknown>[];
}

export function ExportButtons({ title, columns, rows }: ExportButtonsProps) {
  const t = useTranslations('common');
  const locale = useLocale() as 'pt' | 'en';

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={() => exportToPdf(title, columns, rows, locale)}>
        <FileDown className="h-4 w-4" />
        {t('exportPdf')}
      </Button>
      <Button variant="outline" size="sm" onClick={() => exportToExcel(title, columns, rows, locale)}>
        <FileSpreadsheet className="h-4 w-4" />
        {t('exportExcel')}
      </Button>
    </div>
  );
}
