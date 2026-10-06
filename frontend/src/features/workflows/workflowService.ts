import { get, patch, post, put } from '@/services/apiClient'

export const events = ['case.created', 'case.assigned', 'case.priority_changed', 'case.status_changed', 'case.resolved'] as const
export const priorities = ['critical', 'high', 'medium', 'low'] as const
export const statuses = ['new', 'assigned', 'in_progress', 'waiting_customer', 'waiting_engineering', 'resolved', 'closed', 'reopened'] as const
export const fields = ['priority', 'status', 'category', 'team_id', 'assignee_id', 'tags'] as const
export const actionLabels = { assign_user: 'Assign a user', assign_team: 'Assign a team', set_priority: 'Change priority', set_status: 'Change status', internal_note: 'Add internal note', notify_user: 'Notify an internal user' }
export const fieldLabels = { priority: 'Priority', status: 'Status', category: 'Category', team_id: 'Assigned team', assignee_id: 'Assigned user', tags: 'Has tag' }
export const eventLabels = { 'case.created': 'Case created', 'case.assigned': 'Case assigned', 'case.priority_changed': 'Priority changed', 'case.status_changed': 'Status changed', 'case.resolved': 'Case resolved' }
export type Action =
  | { type: 'assign_user'; user_id: string }
  | { type: 'assign_team'; team_id: string }
  | { type: 'set_status'; status: typeof statuses[number] }
  | { type: 'set_priority'; priority: typeof priorities[number] }
  | { type: 'internal_note'; content: string }
  | { type: 'notify_user'; user_id: string; message: string }
export type Condition = { field: typeof fields[number]; operator: 'equals' | 'contains'; value: string }
export interface WorkflowDraft { name: string; description: string; event_type: typeof events[number]; conditions: Condition[]; actions: Action[]; enabled: boolean }
export interface Workflow extends WorkflowDraft { id: string; revision: number; created_at: string; updated_at: string }
export interface WorkflowRun { id: string; event_id: string; case_id: string; actor_id: string; event_type: typeof events[number]; workflow_revision: number; definition: WorkflowDraft; status: 'succeeded' | 'skipped' | 'failed' | 'running'; executed_actions: { index: number; type: Action['type']; status: string }[]; failure_code: string | null; failure_detail: string | null; started_at: string; finished_at: string | null }
export interface WorkflowOptions { users: { id: string; name: string }[]; teams: { id: string; name: string }[]; recipients: { id: string; name: string }[] }

export const workflowService = {
  list: () => get<{ items: Workflow[]; total: number }>('/workflows'),
  options: () => get<WorkflowOptions>('/workflows/options'),
  create: (data: WorkflowDraft) => post<Workflow>('/workflows', data),
  update: (id: string, data: WorkflowDraft, revision: number) => put<Workflow>(`/workflows/${id}`, { ...data, revision }),
  toggle: (item: Workflow) => patch<Workflow>(`/workflows/${item.id}/enabled`, { enabled: !item.enabled, revision: item.revision }),
  runs: (id: string, page: number) => get<{ items: WorkflowRun[]; total: number }>(`/workflows/${id}/runs`, { params: { page, page_size: 20 } }),
}

export const starterTemplates: WorkflowDraft[] = [
  { name: 'High-priority triage', description: 'Add a review checklist when a high-priority case is created.', event_type: 'case.created', conditions: [{ field: 'priority', operator: 'equals', value: 'high' }], actions: [{ type: 'internal_note', content: 'Triage checklist: confirm impact, inspect related evidence and agree on the next step.' }], enabled: false },
  { name: 'Resolution review', description: 'Prompt staff to capture useful lessons after a case is resolved.', event_type: 'case.resolved', conditions: [], actions: [{ type: 'internal_note', content: 'Review the resolution for reusable knowledge. Link supporting evidence before requesting memory verification.' }], enabled: false },
  { name: 'Assignment handoff', description: 'Add an internal handoff reminder after assignment.', event_type: 'case.assigned', conditions: [], actions: [{ type: 'internal_note', content: 'Handoff reminder: review the investigation, current impact and agreed next steps.' }], enabled: false },
]

export function newAction(type: Action['type']): Action {
  switch (type) {
    case 'assign_user': return { type, user_id: '' }
    case 'assign_team': return { type, team_id: '' }
    case 'set_status': return { type, status: 'in_progress' }
    case 'set_priority': return { type, priority: 'high' }
    case 'notify_user': return { type, user_id: '', message: '' }
    case 'internal_note': return { type, content: '' }
  }
}
