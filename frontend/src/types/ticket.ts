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

export interface Ticket {
  id: string
  title: string
  description: string
  status: TicketStatus
  priority: TicketPriority
  category: TicketCategory
  assigneeId?: string
  assigneeName?: string
  reporterId: string
  reporterName: string
  organizationId: string
  tags: string[]
  aiAnalysis?: TicketAIAnalysis
  comments: TicketComment[]
  attachments: string[]
  createdAt: string
  updatedAt: string
  resolvedAt?: string
  closedAt?: string
  slaDeadline?: string
  slaBreached: boolean
  slaState: 'healthy' | 'at_risk' | 'breached'
}
