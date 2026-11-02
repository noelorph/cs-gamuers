import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Slot } from 'radix-ui';

const badgeVariants = cva(
  'inline-flex w-fit min-w-0 max-w-full items-center justify-center gap-1 rounded-full border border-transparent px-2 py-1 text-sm font-medium whitespace-normal [overflow-wrap:anywhere] transition-[color,background-color,border-color,box-shadow] duration-100 ease-feedback focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background aria-invalid:border-destructive aria-invalid:ring-destructive/20 [&>svg]:pointer-events-none [&>svg]:size-4 [&>svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-muted text-muted-foreground',
        secondary: 'bg-muted text-muted-foreground',
        destructive: 'bg-error-surface text-destructive',
        success: 'bg-success-surface text-success',
        warning: 'bg-warning-surface text-warning',
        info: 'bg-info-surface text-info',
        outline:
          'border-border text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground',
        ghost: '[a&]:hover:bg-accent [a&]:hover:text-accent-foreground',
        link: 'text-primary underline underline-offset-4',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

function Badge({
  className,
  variant = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'span';

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
