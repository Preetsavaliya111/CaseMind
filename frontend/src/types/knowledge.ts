export interface KnowledgeArticle {
  id: string
  title: string
  content: string
  summary: string
  category: string
  tags: string[]
  authorId: string
  authorName: string
  viewCount: number
  helpfulCount: number
  unhelpfulCount: number
  isPublished: boolean
  version: number
  createdAt: string
  updatedAt: string
  relatedTicketIds: string[]
  relatedMemoryIds?: string[]
}

export interface KnowledgeSearchResult {
  article: KnowledgeArticle
  relevanceScore: number   // 0–1
  matchedChunks: string[]
}

export interface Citation {
  index: number            // [1], [2], [3] in AI answer text
  sourceId: string
  sourceType: 'knowledge_article' | 'ticket' | 'memory_record'
  title: string
  relevanceScore: number
  excerpt: string
}

export interface RAGSearchResult {
  query: string
  aiAnswer: string         // LLM-synthesized answer (may contain [1], [2] citation markers)
  citations: Citation[]
  confidence: number       // 0–1
  processingTimeMs: number
  documents: KnowledgeSearchResult[]
  warning?: string         // e.g. "Low confidence — verify before applying"
}

