import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
  {
    variants: {
      variant: {
        default: 'bg-accent-primary text-white hover:bg-accent-primary-hover shadow-default hover:shadow-medium',
        primary: 'bg-accent-primary text-white hover:bg-accent-primary-hover shadow-default hover:shadow-medium',
        secondary: 'bg-bg-primary text-text-secondary border border-border-default hover:bg-bg-secondary hover:text-text-primary shadow-subtle',
        ghost: 'text-text-secondary hover:bg-hover hover:text-text-primary',
        outline: 'border border-border-default bg-bg-primary text-text-secondary hover:bg-bg-secondary hover:text-text-primary shadow-subtle',
        destructive: 'bg-error-bg text-error-text border border-error-border hover:bg-red-100/60 shadow-subtle',
        link: 'text-accent-primary underline-offset-4 hover:underline hover:text-accent-primary-hover',
      },
      size: {
        default: 'h-9 px-4 py-2 text-sm',
        sm: 'h-8 rounded-md px-3 text-xs',
        md: 'h-9 px-4 py-2 text-sm',
        lg: 'h-10 rounded-lg px-6 text-sm font-semibold',
        icon: 'h-9 w-9 rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        )}
        {children}
      </Comp>
    )
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }
