import type { ReactNode } from 'react'
import { QueryProvider } from './QueryProvider'
import { ThemeProvider } from './ThemeProvider'
import { AuthProvider } from './AuthProvider'
import { ToastNotificationProvider } from './ToastProvider'

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <ThemeProvider>
        <AuthProvider>
          <ToastNotificationProvider>
            {children}
          </ToastNotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryProvider>
  )
}

export { useAuth } from './AuthProvider'
export { useTheme } from './ThemeProvider'
export { useToast } from './ToastProvider'
