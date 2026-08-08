import type { KnowledgeArticle, KnowledgeSearchResult } from '@/types'
import { mockKnowledgeArticles } from '@/mocks'

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

export const knowledgeService = {
  async getArticles(): Promise<KnowledgeArticle[]> {
    await delay(350)
    return mockKnowledgeArticles
  },

  async getArticleById(id: string): Promise<KnowledgeArticle> {
    await delay(250)
    const article = mockKnowledgeArticles.find((a) => a.id === id)
    if (!article) throw new Error(`Article ${id} not found`)
    return article
  },

  async search(query: string): Promise<KnowledgeSearchResult[]> {
    await delay(500)
    const q = query.toLowerCase()
    return mockKnowledgeArticles
      .filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.summary.toLowerCase().includes(q) ||
          a.tags.some((t) => t.includes(q)),
      )
      .map((article) => ({
        article,
        relevanceScore: Math.random() * 0.4 + 0.6,
        matchedChunks: [article.summary],
      }))
  },
}
