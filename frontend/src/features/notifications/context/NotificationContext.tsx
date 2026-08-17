import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import type { AppNotification } from '@/types'
import { initialMockNotifications } from '@/mocks'

const STORAGE_KEY = 'casemind_notifications_v1'

interface NotificationContextValue {
  notifications: AppNotification[]
  unreadCount: number
  hasCriticalAlerts: boolean
  markAsRead: (id: string) => void
  markAsUnread: (id: string) => void
  markAllAsRead: () => void
  removeNotification: (id: string) => void
  clearAll: () => void
  addNotification: (notification: Omit<AppNotification, 'id' | 'timestamp' | 'isRead'> & { isRead?: boolean }) => void
}

const NotificationContext = createContext<NotificationContextValue | null>(null)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        return JSON.parse(saved)
      }
    } catch (e) {
      console.warn('Failed to load notifications from localStorage', e)
    }
    return initialMockNotifications
  })

  // Save to localStorage when notifications change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications))
    } catch (e) {
      console.warn('Failed to save notifications to localStorage', e)
    }
  }, [notifications])

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  )

  const hasCriticalAlerts = useMemo(
    () => notifications.some((n) => !n.isRead && n.priority === 'critical'),
    [notifications]
  )

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    )
  }, [])

  const markAsUnread = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: false } : n))
    )
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  const addNotification = useCallback(
    (notification: Omit<AppNotification, 'id' | 'timestamp' | 'isRead'> & { isRead?: boolean }) => {
      const newNotif: AppNotification = {
        ...notification,
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        timestamp: new Date().toISOString(),
        isRead: notification.isRead ?? false,
      }
      setNotifications((prev) => [newNotif, ...prev])
    },
    []
  )

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      hasCriticalAlerts,
      markAsRead,
      markAsUnread,
      markAllAsRead,
      removeNotification,
      clearAll,
      addNotification,
    }),
    [
      notifications,
      unreadCount,
      hasCriticalAlerts,
      markAsRead,
      markAsUnread,
      markAllAsRead,
      removeNotification,
      clearAll,
      addNotification,
    ]
  )

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}
