'use client';

import { forwardRef, type ChangeEvent, type KeyboardEvent } from 'react';
import { cn } from '@/lib/utils/cn';

interface SafeNumberInputProps {
  name: string;
  value?: number | null;
  onChange: (value: number | undefined) => void;
  onBlur?: () => void;
  disabled?: boolean;
  className?: string;
  /** Allow decimal point. Default true. Set false for integer-only fields like mileage. */
  allowDecimal?: boolean;
  placeholder?: string;
}

const BLOCKED_KEYS = ['e', 'E', '+', '-'];

/**
 * Plain numeric input (no currency formatting) that blocks letters,
 * scientific notation ("e"), and signs at the keystroke level. Use for
 * percentages, mileage, and other non-monetary numeric fields. For money,
 * use CurrencyInput instead.
 */
export const SafeNumberInput = forwardRef<HTMLInputElement, SafeNumberInputProps>(
  ({ name, value, onChange, onBlur, disabled, className, allowDecimal = true, placeholder }, ref) => {
    function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
      if (BLOCKED_KEYS.includes(e.key) || (!allowDecimal && e.key === '.')) {
        e.preventDefault();
      }
    }

    function handleChange(e: ChangeEvent<HTMLInputElement>) {
      let raw = e.target.value.replace(/[^0-9.]/g, '');
      if (!allowDecimal) raw = raw.replace(/\./g, '');
      // Keep only the first decimal point if multiple were pasted in.
      const firstDot = raw.indexOf('.');
      if (firstDot !== -1) {
        raw = raw.slice(0, firstDot + 1) + raw.slice(firstDot + 1).replace(/\./g, '');
      }
      e.target.value = raw;
      onChange(raw === '' ? undefined : Number(raw));
    }

    return (
      <input
        ref={ref}
        name={name}
        type="text"
        inputMode={allowDecimal ? 'decimal' : 'numeric'}
        autoComplete="off"
        value={value ?? ''}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={onBlur}
        disabled={disabled}
        placeholder={placeholder}
        className={cn(
          'h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50',
          className
        )}
      />
    );
  }
);

SafeNumberInput.displayName = 'SafeNumberInput';
