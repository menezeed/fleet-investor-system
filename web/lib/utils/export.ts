'use client';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { formatCurrency, formatPercentage, formatDate } from '@/lib/utils/format';

export type ExportColumnType = 'text' | 'currency' | 'percentage' | 'date' | 'number';

export interface ExportColumn {
  header: string;
  key: string;
  /** Determines formatting in both PDF and Excel. Defaults to 'text'. */
  type?: ExportColumnType;
  /** Right-align numeric-looking columns (currency, percentage, number). Auto-set when type implies it. */
  align?: 'left' | 'right';
}

/**
 * Formats a raw cell value the same way it appears on screen (DataTable),
 * so exports match what the user sees: "R$ 1.234,56" instead of "1234.56",
 * "12,5%" instead of "12.5", dates as dd/mm/yyyy.
 */
function formatCell(value: unknown, type: ExportColumnType = 'text', locale: 'pt' | 'en' = 'pt'): string {
  if (value === null || value === undefined || value === '') return '—';

  switch (type) {
    case 'currency':
      return formatCurrency(Number(value), locale);
    case 'percentage':
      return formatPercentage(Number(value), locale);
    case 'date':
      return formatDate(String(value), locale);
    case 'number':
      return new Intl.NumberFormat(locale === 'pt' ? 'pt-BR' : 'en-US').format(Number(value));
    default:
      return String(value);
  }
}

function resolveAlign(col: ExportColumn): 'left' | 'right' {
  if (col.align) return col.align;
  return col.type === 'currency' || col.type === 'percentage' || col.type === 'number' ? 'right' : 'left';
}

export function exportToPdf(
  title: string,
  columns: ExportColumn[],
  rows: Record<string, unknown>[],
  locale: 'pt' | 'en' = 'pt'
) {
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text(title, 14, 16);
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(new Date().toLocaleDateString('pt-BR'), 14, 22);

  autoTable(doc, {
    startY: 28,
    head: [columns.map((c) => c.header)],
    body: rows.map((row) => columns.map((c) => formatCell(row[c.key], c.type, locale))),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [15, 81, 50] }, // primary green
    columnStyles: columns.reduce((acc, c, i) => {
      if (resolveAlign(c) === 'right') acc[i] = { halign: 'right' };
      return acc;
    }, {} as Record<number, { halign: 'right' }>),
  });

  doc.save(`${slugify(title)}.pdf`);
}

export function exportToExcel(
  title: string,
  columns: ExportColumn[],
  rows: Record<string, unknown>[],
  locale: 'pt' | 'en' = 'pt'
) {
  const data = rows.map((row) =>
    Object.fromEntries(columns.map((c) => [c.header, formatCell(row[c.key], c.type, locale)]))
  );
  const worksheet = XLSX.utils.json_to_sheet(data);

  // Column widths roughly matched to header length, with a floor so
  // currency/percentage columns don't look cramped.
  worksheet['!cols'] = columns.map((c) => ({ wch: Math.max(c.header.length + 2, 12) }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Dados');
  XLSX.writeFile(workbook, `${slugify(title)}.xlsx`);
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
