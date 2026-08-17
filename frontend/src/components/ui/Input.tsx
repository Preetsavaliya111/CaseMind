import * as React from 'react'
import { cn } from '@/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-9 w-full rounded-lg border bg-bg-primary px-3 py-1.5 text-sm text-text-primary shadow-subtle',
          'placeholder:text-text-disabled',
          'transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/40 focus-visible:border-accent-primary focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error
            ? 'border-error-border focus-visible:ring-error-text/30 focus-visible:border-error-text'
            : 'border-border-default hover:border-border-strong',
          className,
        )}
        ref={ref}
        {...props}
      />
    )
  },
)
Input.displayName = 'Input'

export { Input }
