import type { KnowledgeArticle, KnowledgeSearchResult } from '@/types'
import { get, post } from '@/services/apiClient'

interface ApiArticle {
  id: string
  title: string
  summary: string
  content: string
  category: string
  tags: string[]
  state: 'draft' | 'published' | 'archived'
  version: number
  author_name: string
  created_at: string
  updated_at: string
  published_at: string | null
}

interface ApiArticleList { items: ApiArticle[]; total: number }

export interface CreateKnowledgeArticle {
  title: string
  summary: string
  content: string
  category: string
  tags: string[]
}

function mapArticle(article: ApiArticle): KnowledgeArticle {
  return {
    id: article.id, title: article.title, summary: article.summary, content: article.content,
    category: article.category, tags: article.tags, authorId: '', authorName: article.author_name,
    viewCount: 0, helpfulCount: 0, unhelpfulCount: 0, isPublished: article.state === 'published',
    state: article.state, version: article.version, createdAt: article.created_at, updatedAt: article.updated_at,
    relatedTicketIds: [],
  }
}

export const knowledgeService = {
  async getArticles(): Promise<KnowledgeArticle[]> {
    const response = await get<ApiArticleList>('/knowledge', { params: { page_size: 100 } })
    return response.items.map(mapArticle)
  },
  async getArticleById(id: string): Promise<KnowledgeArticle> {
    return mapArticle(await get<ApiArticle>(`/knowledge/${id}`))
  },
  async search(query: string): Promise<KnowledgeSearchResult[]> {
    const response = await get<ApiArticleList>('/knowledge', { params: { search: query, page_size: 100 } })
    return response.items.map((article) => ({ article: mapArticle(article), relevanceScore: 0, matchedChunks: [] }))
  },
  async create(data: CreateKnowledgeArticle): Promise<KnowledgeArticle> {
    return mapArticle(await post<ApiArticle>('/knowledge', data))
  },
  async publish(id: string): Promise<KnowledgeArticle> {
    return mapArticle(await post<ApiArticle>(`/knowledge/${id}/publish`))
  },
}
