import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Slot } from 'radix-ui';

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-normal transition-[color,background-color,border-color,box-shadow] duration-100 ease-feedback outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:bg-muted disabled:text-muted-foreground aria-invalid:border-destructive aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-pressed',
        destructive: 'bg-destructive text-white hover:bg-danger-hover active:bg-danger-pressed',
        outline: 'border border-input bg-background text-foreground hover:bg-muted',
        secondary: 'border border-input bg-background text-foreground hover:bg-muted',
        ghost: 'text-primary hover:bg-muted',
        link: 'text-primary underline underline-offset-4 hover:bg-muted',
      },
      size: {
        default: 'min-h-11 px-4 py-2 has-[>svg]:px-3',
        xs: 'min-h-11 gap-1 rounded-md px-2 text-sm has-[>svg]:px-1.5',
        sm: 'min-h-11 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5',
        lg: 'min-h-11 rounded-md px-6 has-[>svg]:px-4',
        icon: 'min-h-11 min-w-11',
        'icon-xs': 'min-h-11 min-w-11 rounded-md',
        'icon-sm': 'min-h-11 min-w-11',
        'icon-lg': 'min-h-11 min-w-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : 'button';

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
