import { HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
  {
    variants: {
      variant: {
        default: 'bg-muted text-muted-foreground',
        success: 'bg-success/10 text-success',
        warning: 'bg-warning/10 text-warning',
        destructive: 'bg-destructive/10 text-destructive',
        primary: 'bg-primary/10 text-primary',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

/** Maps domain status values to a visual variant. Single source of truth for status colors. */
export function statusToVariant(
  status: string
): 'default' | 'success' | 'warning' | 'destructive' | 'primary' {
  switch (status) {
    case 'available':
    case 'active':
    case 'occupied':
      return 'success';
    case 'rented':
      return 'primary';
    case 'maintenance':
      return 'warning';
    case 'sold':
    case 'inactive':
      return 'default';
    case 'suspended':
      return 'destructive';
    default:
      return 'default';
  }
}
