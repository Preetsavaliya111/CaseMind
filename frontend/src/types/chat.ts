// Chat / AI Assistant type definitions

export type MessageRole = 'user' | 'assistant' | 'system'
export type SourceType = 'memory' | 'knowledge' | 'live' | 'none'

export interface CitationSource {
  id: string
  type: 'knowledge_article' | 'ticket' | 'memory_record' | 'incident_log'
  title: string
  relevanceScore: number  // 0–1
  url?: string
  excerpt?: string
}

export interface ChatMessage {
  id: string
  sessionId: string
  role: MessageRole
  content: string
  timestamp: string
  sources?: CitationSource[]
  suggestions?: string[]
  sourceType?: SourceType
  isStreaming?: boolean
  error?: string           // set when message failed to send / AI error
  confidenceScore?: number // 0–1, when AI provides confidence
}

export interface ChatSession {
  id: string
  title: string            // auto-generated from first message
  createdAt: string
  updatedAt: string
  messageCount: number
  lastMessage?: string     // preview of last message
  isReadOnly?: boolean     // old sessions can be read-only
}

export interface ChatSendRequest {
  sessionId: string
  content: string
}

export interface ChatSendResponse {
  message: ChatMessage
  session: ChatSession
}
