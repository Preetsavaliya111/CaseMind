import { get, patch, post, put } from '@/services/apiClient'

export interface NotificationItem { id: string; actor_name?: string; notification_type: string; severity: 'info' | 'warning' | 'critical' | string; title: string; message: string; locator?: string; entity_type?: string; entity_id?: string; read_at?: string; created_at: string }
export interface NotificationPage { items: NotificationItem[]; total: number; unread: number; page: number; page_size: number; pages: number }
export interface NotificationPreferences { case_assigned: boolean; case_reply: boolean; case_escalated: boolean; sla_alerts: boolean }

export const notificationService = {
  list: (params?: { unread_only?: boolean; page?: number; page_size?: number }) => get<NotificationPage>('/notifications', { params }),
  markRead: (id: string) => patch<NotificationItem>(`/notifications/${id}/read`),
  markAllRead: () => post<void>('/notifications/read-all'),
  preferences: () => get<NotificationPreferences>('/notifications/preferences'),
  savePreferences: (preferences: NotificationPreferences) => put<NotificationPreferences>('/notifications/preferences', preferences),
}
