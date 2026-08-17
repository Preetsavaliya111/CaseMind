import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-accent-primary/40 focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-border-default bg-bg-secondary text-text-secondary',
        primary: 'border-amber-200 bg-amber-50 text-amber-800',
        secondary: 'border-border-default bg-bg-secondary text-text-secondary',
        destructive: 'border-error-border bg-error-bg text-error-text',
        error: 'border-error-border bg-error-bg text-error-text',
        critical: 'border-error-border bg-error-bg text-error-text font-semibold',
        warning: 'border-warning-border bg-warning-bg text-warning-text',
        success: 'border-success-border bg-success-bg text-success-text',
        info: 'border-info-border bg-info-bg text-info-text',
        outline: 'border-border-default text-text-secondary bg-transparent',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
