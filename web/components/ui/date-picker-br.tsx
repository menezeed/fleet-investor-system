'use client';

import { useState, useRef, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { isoDateToBr } from '@/lib/masks/br-format';
import 'react-day-picker/dist/style.css';

interface DatePickerBrProps {
  name: string;
  /** ISO date string (YYYY-MM-DD), matching what's stored in the database. */
  value?: string | null;
  /** Emits an ISO date string (YYYY-MM-DD), or empty string when cleared. */
  onChange: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  className?: string;
  /** Optional ISO date string; selectable dates cannot be after this. */
  max?: string;
  /** Optional ISO date string; selectable dates cannot be before this. */
  min?: string;
  placeholder?: string;
}

function parseIso(value?: string | null): Date | undefined {
  if (!value) return undefined;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return undefined;
  const [, y, m, d] = match;
  return new Date(Number(y), Number(m) - 1, Number(d));
}

function toIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * CR-007/008/009/010/015: visual calendar picker for all date fields,
 * displaying DD/MM/AAAA (CR-002/003 standard). Internally stores/emits ISO
 * (YYYY-MM-DD) so the rest of the form and the database are unaffected.
 * Clicking the input (or its calendar icon) opens a popup calendar; the
 * field itself is read-only to avoid invalid free-text entry.
 */
export function DatePickerBr({
  name,
  value,
  onChange,
  onBlur,
  disabled,
  className,
  max,
  min,
  placeholder = 'DD/MM/AAAA',
}: DatePickerBrProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        onBlur?.();
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const selectedDate = parseIso(value);

  function handleSelect(date: Date | undefined) {
    if (!date) {
      onChange('');
      return;
    }
    onChange(toIso(date));
    setOpen(false);
    onBlur?.();
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        name={name}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex h-9 w-full items-center justify-between gap-2 rounded-md border border-border bg-background px-3 text-left text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50',
          className
        )}
      >
        <span className={value ? '' : 'text-muted-foreground'}>{value ? isoDateToBr(value) : placeholder}</span>
        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 rounded-lg border border-border bg-card p-2 shadow-lg">
          <DayPicker
            mode="single"
            locale={ptBR}
            selected={selectedDate}
            onSelect={handleSelect}
            defaultMonth={selectedDate}
            disabled={(date) => {
              if (max && toIso(date) > max) return true;
              if (min && toIso(date) < min) return true;
              return false;
            }}
            classNames={{
              day_selected: 'bg-primary text-primary-foreground',
              day_today: 'font-bold text-primary',
            }}
          />
        </div>
      )}
    </div>
  );
}
