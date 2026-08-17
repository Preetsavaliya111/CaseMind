import type { ReactNode } from 'react'
import { QueryProvider } from './QueryProvider'
import { ThemeProvider } from './ThemeProvider'
import { AuthProvider } from './AuthProvider'
import { ToastNotificationProvider } from './ToastProvider'
import { NotificationProvider } from '@/features/notifications/context/NotificationContext'

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <ToastNotificationProvider>
              {children}
            </ToastNotificationProvider>
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryProvider>
  )
}

export { useAuth } from './AuthProvider'
export { useTheme } from './ThemeProvider'
export { useToast } from './ToastProvider'
export { useNotifications } from '@/features/notifications/context/NotificationContext'
