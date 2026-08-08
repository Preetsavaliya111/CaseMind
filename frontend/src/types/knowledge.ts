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
  isPublished: boolean
  createdAt: string
  updatedAt: string
  relatedTicketIds: string[]
}

export interface KnowledgeSearchResult {
  article: KnowledgeArticle
  relevanceScore: number
  matchedChunks: string[]
}
