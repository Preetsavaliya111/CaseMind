import { get, post } from '@/services/apiClient'

export interface AIStatus {
  configured: boolean
  model: string | null
  indexed_documents: number
  verified_memory_items: number
  available_evidence: number
}

export interface AICitation {
  key: string
  source_type: 'memory' | 'case' | 'document' | 'knowledge'
  source_id: string
  title: string
  excerpt: string
  relevance_score: number
  locator: string
}

export interface AIAnswer {
  interaction_id: string
  answer: string
  citations: AICitation[]
  model: string
}

export const aiService = {
  status: () => get<AIStatus>('/ai/status'),
  query: (question: string) => post<AIAnswer>('/ai/query', { question }),
  feedback: (interactionId: string, rating: 'helpful' | 'not_helpful', note?: string) =>
    post<{ interaction_id: string; rating: 'helpful' | 'not_helpful' }>(`/ai/interactions/${interactionId}/feedback`, { rating, note }),
}
