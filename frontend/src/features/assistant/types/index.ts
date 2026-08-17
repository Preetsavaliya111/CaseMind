export type MessageRole = 'user' | 'assistant' | 'system'

export type MessageStatus = 'idle' | 'thinking' | 'streaming' | 'complete' | 'error'

export type SourceType = 'ticket' | 'knowledge' | 'memory' | 'document' | 'metric'

export interface Citation {
  id: string
  type: SourceType
  title: string
  identifier: string // e.g., 'Ticket #CS-10482', 'KB-Runbook #04', 'Doc v4.2'
  relevanceScore?: number // e.g., 0.94 for 94%
  snippet?: string
  url?: string
}

export interface RelatedTicket {
  id: string
  title: string
  status: 'new' | 'assigned' | 'in_progress' | 'waiting_customer' | 'waiting_engineering' | 'resolved' | 'closed'
  priority: 'critical' | 'high' | 'medium' | 'low'
  assignee?: string
  reporter?: string
  createdAt?: string
}

export interface RelatedDocument {
  id: string
  title: string
  category: string
  type: 'runbook' | 'sop' | 'release_notes' | 'architecture' | 'policy'
  lastUpdated?: string
  version?: string
}

export interface ContextIntelligence {
  relatedTickets: RelatedTicket[]
  relatedDocuments: RelatedDocument[]
  knowledgeUsed: string[]
  suggestedActions: string[]
  activeRootCause?: string
  confidenceScore?: number
}

export interface AssistantMessage {
  id: string
  conversationId: string
  role: MessageRole
  content: string
  status: MessageStatus
  createdAt: string
  keyFindings?: string[]
  recommendedActions?: string[]
  citations?: Citation[]
  context?: ContextIntelligence
  confidence?: number
  error?: string
}

export interface Conversation {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  messages: AssistantMessage[]
  summary?: string
  pinned?: boolean
  contextSnapshot?: ContextIntelligence
}

export interface ConversationGroup {
  label: 'Today' | 'Yesterday' | 'Previous 7 days' | 'Older'
  conversations: Conversation[]
}

export interface AssistantState {
  status: MessageStatus
  activeConversationId: string | null
  knowledgeConnected: boolean
  contextPanelOpen: boolean
  historySidebarOpen: boolean
  searchQuery: string
}
