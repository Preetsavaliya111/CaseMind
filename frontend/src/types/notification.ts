export type NotificationType =
  | 'sla_alert'
  | 'ticket_assigned'
  | 'memory_match'
  | 'ai_insight'
  | 'system'
  | 'knowledge'

export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical'

export interface AppNotification {
  id: string
  type: NotificationType
  title: string
  message: string
  timestamp: string // ISO string
  isRead: boolean
  priority: NotificationPriority
  link?: string
  ticketId?: string
  articleId?: string
  memoryId?: string
}
