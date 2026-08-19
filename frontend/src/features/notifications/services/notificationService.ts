import type { AppNotification } from '@/types'
import { initialMockNotifications } from '@/mocks'

const STORAGE_KEY = 'casemind_notifications_v1'
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

export interface INotificationService {
  getNotifications(): Promise<AppNotification[]>
  saveNotifications(notifications: AppNotification[]): Promise<void>
  markAsRead(id: string): Promise<void>
  markAllAsRead(): Promise<void>
}

class LocalNotificationService implements INotificationService {
  async getNotifications(): Promise<AppNotification[]> {
    await delay(100)
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) return JSON.parse(saved)
    } catch {
      // fallback
    }
    return initialMockNotifications
  }

  async saveNotifications(notifications: AppNotification[]): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications))
    } catch {
      // fallback
    }
  }

  async markAsRead(id: string): Promise<void> {
    const list = await this.getNotifications()
    const updated = list.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    await this.saveNotifications(updated)
  }

  async markAllAsRead(): Promise<void> {
    const list = await this.getNotifications()
    const updated = list.map((n) => ({ ...n, isRead: true }))
    await this.saveNotifications(updated)
  }
}

export const notificationService: INotificationService = new LocalNotificationService()
