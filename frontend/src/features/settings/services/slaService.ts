import { get, patch } from '@/services/apiClient'

export interface SLAPolicy { id: string; priority: 'critical' | 'high' | 'medium' | 'low'; first_response_minutes: number; resolution_minutes: number; warning_percent: number; is_active: boolean }
export interface SLASummary { healthy: number; at_risk: number; breached: number; escalated: number }

export const slaService = {
  policies: () => get<SLAPolicy[]>('/sla/policies'),
  summary: () => get<SLASummary>('/sla/summary'),
  updatePolicy: (id: string, data: Partial<Omit<SLAPolicy, 'id' | 'priority'>>) => patch<SLAPolicy>(`/sla/policies/${id}`, data),
}
