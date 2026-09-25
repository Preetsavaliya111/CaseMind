import type { Ticket, PaginatedResponse, CaseAttachment } from '@/types'
import { apiClient, del, get, patch, post } from '@/services/apiClient'

interface ApiComment {
  id: string
  case_id: string
  author_id: string
  author_name: string
  content: string
  is_internal: boolean
  created_at: string
  updated_at: string
}

interface ApiCase {
  id: string
  organization_id: string
  case_number: string
  subject: string
  description: string
  status: Ticket['status']
  priority: Ticket['priority']
  category: string
  reporter_id: string
  reporter_name: string
  assignee_id?: string
  assignee_name?: string
  team_id?: string
  department_id?: string
  visibility: Ticket['visibility']
  tags: string[]
  comments: ApiComment[]
  attachments: ApiAttachment[]
  created_at: string
  updated_at: string
  resolved_at?: string
  closed_at?: string
  first_response_due_at?: string
  first_responded_at?: string
  sla_deadline?: string
  sla_breached: boolean
  sla_state: Ticket['slaState']
  escalation_level: number
  escalations: Array<{ id: string; actor_name: string; from_level: number; to_level: number; reason: string; created_at: string }>
}

interface ApiAttachment {
  id: string
  case_id: string
  uploaded_by_id: string
  uploaded_by_name: string
  original_filename: string
  media_type: string
  size_bytes: number
  sha256: string
  created_at: string
}

function mapAttachment(item: ApiAttachment): CaseAttachment {
  return { id: item.id, ticketId: item.case_id, uploadedById: item.uploaded_by_id, uploadedByName: item.uploaded_by_name, filename: item.original_filename, mediaType: item.media_type, sizeBytes: item.size_bytes, sha256: item.sha256, createdAt: item.created_at }
}

interface ApiCaseList {
  items: ApiCase[]
  total: number
  page: number
  page_size: number
  pages: number
}

const categories: Ticket['category'][] = ['bug', 'feature_request', 'billing', 'account', 'authentication', 'performance', 'security', 'integration', 'other']

function mapCase(item: ApiCase): Ticket {
  return {
    id: item.id,
    caseNumber: item.case_number,
    title: item.subject,
    description: item.description,
    status: item.status,
    priority: item.priority,
    category: categories.includes(item.category as Ticket['category']) ? item.category as Ticket['category'] : 'other',
    assigneeId: item.assignee_id,
    assigneeName: item.assignee_name,
    teamId: item.team_id,
    departmentId: item.department_id,
    visibility: item.visibility,
    reporterId: item.reporter_id,
    reporterName: item.reporter_name,
    organizationId: item.organization_id,
    tags: item.tags,
    comments: item.comments.map((comment) => ({
      id: comment.id,
      ticketId: comment.case_id,
      authorId: comment.author_id,
      authorName: comment.author_name,
      content: comment.content,
      isInternal: comment.is_internal,
      createdAt: comment.created_at,
      updatedAt: comment.updated_at,
    })),
    attachments: item.attachments.map(mapAttachment),
    createdAt: item.created_at,
    updatedAt: item.updated_at,
    resolvedAt: item.resolved_at,
    closedAt: item.closed_at,
    slaDeadline: item.sla_deadline,
    slaBreached: item.sla_breached,
    slaState: item.sla_state,
    firstResponseDueAt: item.first_response_due_at,
    firstRespondedAt: item.first_responded_at,
    escalationLevel: item.escalation_level,
    escalations: item.escalations.map((event) => ({ id: event.id, actorName: event.actor_name, fromLevel: event.from_level, toLevel: event.to_level, reason: event.reason, createdAt: event.created_at })),
  }
}

export interface TicketFilters {
  search?: string
  status?: string
  priority?: string
  category?: string
  assigneeId?: string
  page?: number
  pageSize?: number
}

export interface CaseAssignee {
  id: string
  name: string
  role: string
  role_slug: string
  department: string
}

export const ticketService = {
  async getTickets(filters: TicketFilters = {}): Promise<PaginatedResponse<Ticket>> {
    const result = await get<ApiCaseList>('/cases', { params: { search: filters.search || undefined, status: filters.status || undefined, priority: filters.priority || undefined, page: filters.page ?? 1, page_size: filters.pageSize ?? 20 } })
    return {
      data: result.items.map(mapCase),
      total: result.total,
      page: result.page,
      pageSize: result.page_size,
      totalPages: result.pages,
    }
  },

  async getTicketById(id: string): Promise<Ticket> {
    return mapCase(await get<ApiCase>(`/cases/${id}`))
  },

  async createTicket(data: Partial<Ticket>): Promise<Ticket> {
    return mapCase(await post<ApiCase>('/cases', { subject: data.title, description: data.description, priority: data.priority ?? 'medium', category: data.category ?? 'other', assignee_id: data.assigneeId || null, tags: data.tags ?? [] }))
  },

  async updateTicketStatus(id: string, status: Ticket['status']): Promise<Ticket> {
    return mapCase(await patch<ApiCase>(`/cases/${id}/status`, { status }))
  },

  async updateTicket(id: string, data: Partial<Ticket>): Promise<Ticket> {
    return mapCase(await patch<ApiCase>(`/cases/${id}`, {
      subject: data.title,
      description: data.description,
      priority: data.priority,
      category: data.category,
      assignee_id: data.assigneeId === '' ? null : data.assigneeId,
      tags: data.tags,
    }))
  },

  async getAssignees(): Promise<CaseAssignee[]> {
    return get<CaseAssignee[]>('/cases/assignees')
  },

  async addComment(ticketId: string, content: string, isInternal: boolean): Promise<Ticket> {
    return mapCase(await post<ApiCase>(`/cases/${ticketId}/comments`, { content, is_internal: isInternal }))
  },

  async escalate(ticketId: string, reason: string): Promise<Ticket> {
    return mapCase(await post<ApiCase>(`/cases/${ticketId}/escalations`, { reason }))
  },

  async uploadAttachment(ticketId: string, file: File): Promise<CaseAttachment> {
    const data = new FormData()
    data.append('file', file)
    const result = await post<ApiAttachment>(`/cases/${ticketId}/attachments`, data, { headers: { 'Content-Type': 'multipart/form-data' } })
    return mapAttachment(result)
  },

  async downloadAttachment(ticketId: string, attachment: CaseAttachment): Promise<void> {
    const response = await apiClient.get(`/cases/${ticketId}/attachments/${attachment.id}`, { responseType: 'blob' })
    const url = URL.createObjectURL(response.data)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = attachment.filename
    anchor.click()
    URL.revokeObjectURL(url)
  },

  async deleteAttachment(ticketId: string, attachmentId: string): Promise<void> {
    await del(`/cases/${ticketId}/attachments/${attachmentId}`)
  },

  async deleteTicket(id: string): Promise<void> {
    await del(`/cases/${id}`)
  },
}

