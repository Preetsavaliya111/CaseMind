export type TicketStatus =
  | 'new'
  | 'assigned'
  | 'in_progress'
  | 'waiting_customer'
  | 'waiting_engineering'
  | 'resolved'
  | 'closed'
  | 'reopened'

export type TicketPriority = 'critical' | 'high' | 'medium' | 'low'

export type TicketCategory =
  | 'bug'
  | 'feature_request'
  | 'billing'
  | 'account'
  | 'authentication'
  | 'performance'
  | 'security'
  | 'integration'
  | 'other'

export type SentimentLabel = 'positive' | 'neutral' | 'negative'

export interface TicketAIAnalysis {
  category: TicketCategory
  categoryConfidence: number
  predictedPriority: TicketPriority
  priorityConfidence: number
  sentiment: SentimentLabel
  sentimentScore: number
  duplicateOf?: string
  similarTickets: string[]
  suggestedResolutions: string[]
}

export interface TicketComment {
  id: string
  ticketId: string
  authorId: string
  authorName: string
  authorAvatarUrl?: string
  content: string
  isInternal: boolean
  createdAt: string
  updatedAt: string
}

export interface CaseEscalation {
  id: string
  actorName: string
  fromLevel: number
  toLevel: number
  reason: string
  createdAt: string
}

export interface CaseAttachment {
  id: string
  ticketId: string
  uploadedById: string
  uploadedByName: string
  filename: string
  mediaType: string
  sizeBytes: number
  sha256: string
  createdAt: string
}

export interface Ticket {
  id: string
  caseNumber: string
  title: string
  description: string
  status: TicketStatus
  priority: TicketPriority
  category: TicketCategory
  assigneeId?: string
  assigneeName?: string
  teamId?: string
  departmentId?: string
  visibility: 'private_customer' | 'assigned_only' | 'team' | 'department' | 'organization' | 'restricted'
  reporterId: string
  reporterName: string
  organizationId: string
  tags: string[]
  aiAnalysis?: TicketAIAnalysis
  comments: TicketComment[]
  attachments: CaseAttachment[]
  createdAt: string
  updatedAt: string
  resolvedAt?: string
  closedAt?: string
  slaDeadline?: string
  slaBreached: boolean
  slaState: 'healthy' | 'at_risk' | 'breached'
  firstResponseDueAt?: string
  firstRespondedAt?: string
  escalationLevel: number
  escalations: CaseEscalation[]
}
