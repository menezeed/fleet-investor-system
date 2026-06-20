'use client';

import { forwardRef, type ChangeEvent } from 'react';
import { cn } from '@/lib/utils/cn';

interface MaskedInputProps {
  name: string;
  value?: string | null;
  onChange: (value: string) => void;
  onBlur?: () => void;
  mask: (value: string) => string;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

/** Generic text input that re-applies a formatting mask on every keystroke. */
export const MaskedInput = forwardRef<HTMLInputElement, MaskedInputProps>(
  ({ name, value, onChange, onBlur, mask, disabled, className, placeholder }, ref) => {
    function handleChange(e: ChangeEvent<HTMLInputElement>) {
      onChange(mask(e.target.value));
    }

    return (
      <input
        ref={ref}
        name={name}
        type="text"
        autoComplete="off"
        value={value ?? ''}
        onChange={handleChange}
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

MaskedInput.displayName = 'MaskedInput';
