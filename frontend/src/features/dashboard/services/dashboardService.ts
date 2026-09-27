import { get } from '@/services/apiClient'

export interface AnalyticsOverview {
  total_cases: number
  open_cases: number
  resolved_today: number
  average_resolution_hours: number | null
  critical_cases: number
  verified_memory: number
  draft_memory: number
  published_knowledge: number
  indexed_documents: number
  documents_pending: number
  documents_failed: number
  ai_questions_asked: number
  teammates_invited: number
  trends: { date: string; created: number; resolved: number; open: number }[]
  attention_cases: { id: string; case_number: string; subject: string; priority: string; status: string; updated_at: string }[]
}

export interface WorkspaceDashboard {
  workspace: string
  role: string
  title: string
  description: string
  metrics: Array<{ key: string; label: string; value: number; tone: string; locator?: string }>
  priorities: string[]
}

export const dashboardService = {
  getOverview: () => get<AnalyticsOverview>('/analytics/overview'),
  getWorkspace: () => get<WorkspaceDashboard>('/dashboard/workspace'),
}
