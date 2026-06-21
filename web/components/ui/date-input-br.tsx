'use client';

import { forwardRef, useState, useEffect, type ChangeEvent } from 'react';
import { cn } from '@/lib/utils/cn';
import { maskDateBr, brDateToIso, isoDateToBr } from '@/lib/masks/br-format';

interface DateInputBrProps {
  name: string;
  /** ISO date string (YYYY-MM-DD), matching what's stored in the database. */
  value?: string | null;
  /** Emits an ISO date string (YYYY-MM-DD), or empty string while incomplete/invalid. */
  onChange: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  className?: string;
  /** Optional ISO date string; typed date cannot be after this. */
  max?: string;
}

/**
 * Always displays and accepts dates as DD/MM/YYYY, regardless of the
 * browser/OS locale (CR-002 Change 1, CR-003 Change 2). Internally
 * stores/emits ISO (YYYY-MM-DD) so the rest of the form and the database
 * are unaffected.
 */
export const DateInputBr = forwardRef<HTMLInputElement, DateInputBrProps>(
  ({ name, value, onChange, onBlur, disabled, className, max }, ref) => {
    const [display, setDisplay] = useState(() => isoDateToBr(value));

    // Keep display in sync when the form loads an external value (e.g. edit page).
    useEffect(() => {
      setDisplay(isoDateToBr(value));
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    function handleChange(e: ChangeEvent<HTMLInputElement>) {
      const masked = maskDateBr(e.target.value);
      setDisplay(masked);

      const iso = brDateToIso(masked);
      if (iso) {
        if (max && iso > max) return; // silently ignore dates beyond max while typing
        onChange(iso);
      } else {
        onChange('');
      }
    }

    return (
      <input
        ref={ref}
        name={name}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={display}
        onChange={handleChange}
        onBlur={onBlur}
        disabled={disabled}
        placeholder="DD/MM/AAAA"
        className={cn(
          'h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50',
          className
        )}
      />
    );
  }
);

DateInputBr.displayName = 'DateInputBr';
