import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/app/providers'
import { Button } from '@/components/ui'
import { cn } from '@/utils'

interface ThemeToggleProps {
  className?: string
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { resolvedTheme, toggleTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn('shrink-0 rounded-full', className)}
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to bright mode' : 'Switch to dark mode'}
      title={isDark ? 'Bright mode' : 'Dark mode'}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  )
}
