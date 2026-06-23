'use client';

import { forwardRef, useState, useEffect, type ChangeEvent } from 'react';
import { cn } from '@/lib/utils/cn';

interface CurrencyInputProps {
  name: string;
  value?: number | null;
  onChange: (value: number | undefined) => void;
  onBlur?: () => void;
  disabled?: boolean;
  className?: string;
  /** Applied to the <input> itself (e.g. text color), as opposed to className which wraps the container. */
  inputClassName?: string;
}

/**
 * Money input that only ever holds a valid non-negative number internally.
 * Displays as Brazilian currency (1.234,56) while typing; emits a plain
 * number (or undefined when empty) to the form. Blocks letters, "e", "+",
 * "-" and extra separators at the keystroke level — not just on blur.
 */
export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ name, value, onChange, onBlur, disabled, className, inputClassName }, ref) => {
    const [display, setDisplay] = useState('');

    // Keep the displayed text in sync whenever the external value changes —
    // not just on first mount. CR-008 (v1.3) bug fix: forms that load an
    // existing record asynchronously (waiting on a lookup fetch before
    // calling reset()) were mounting this input with value=undefined first;
    // with an empty dependency array, this effect ran once and never
    // re-synced display once the real value arrived, leaving the field
    // permanently blank. Re-running on every `value` change fixes this,
    // while still not fighting the user's own typing (onChange already
    // keeps `display` correct character-by-character; this effect only
    // matters for externally-driven changes like reset()).
    useEffect(() => {
      if (value == null) {
        setDisplay('');
      } else {
        setDisplay(formatDigitsToDisplay(toDigits(String(value.toFixed(2)))));
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    function toDigits(raw: string): string {
      // Keep only digits; everything else (letters, e, +, -, multiple commas) is dropped.
      return raw.replace(/\D/g, '');
    }

    function formatDigitsToDisplay(digits: string): string {
      if (!digits) return '';
      const normalized = digits.replace(/^0+(?=\d)/, ''); // drop leading zeros, keep one
      const padded = normalized.padStart(3, '0');
      const cents = padded.slice(-2);
      const wholeRaw = padded.slice(0, -2) || '0';
      const whole = wholeRaw.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      return `${whole},${cents}`;
    }

    function digitsToNumber(digits: string): number | undefined {
      if (!digits) return undefined;
      return Number(digits) / 100;
    }

    function handleChange(e: ChangeEvent<HTMLInputElement>) {
      const digits = toDigits(e.target.value);
      setDisplay(formatDigitsToDisplay(digits));
      onChange(digitsToNumber(digits));
    }

    return (
      <div className={cn('relative flex items-center', className)}>
        <span className="pointer-events-none absolute left-3 text-sm text-muted-foreground">R$</span>
        <input
          ref={ref}
          name={name}
          inputMode="decimal"
          autoComplete="off"
          value={display}
          onChange={handleChange}
          onBlur={onBlur}
          disabled={disabled}
          placeholder="0,00"
          className={cn(
            'h-9 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50',
            inputClassName
          )}
        />
      </div>
    );
  }
);

CurrencyInput.displayName = 'CurrencyInput';
