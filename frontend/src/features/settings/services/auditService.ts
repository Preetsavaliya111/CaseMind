import { get } from '@/services/apiClient'

export interface AuditEvent {
  id: string
  actor_name: string
  action: string
  entity_type: string
  entity_id?: string
  details: Record<string, unknown>
  created_at: string
}

export interface AuditEventPage {
  items: AuditEvent[]
  total: number
  page: number
  page_size: number
  pages: number
}

export const auditService = {
  events: (params?: { action?: string; entity_type?: string; page?: number }) => get<AuditEventPage>('/audit-events', { params }),
}
