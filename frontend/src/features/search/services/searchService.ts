import type { Ticket, KnowledgeArticle, OrganizationalMemory } from '@/types'
import { mockTickets, mockKnowledgeArticles, mockMemoryRecords } from '@/mocks'

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

export interface GlobalSearchResult {
  tickets: Ticket[]
  knowledge: KnowledgeArticle[]
  memory: OrganizationalMemory[]
}

export interface ISearchService {
  globalSearch(query: string): Promise<GlobalSearchResult>
}

class MockSearchService implements ISearchService {
  async globalSearch(query: string): Promise<GlobalSearchResult> {
    await delay(150)
    const q = query.trim().toLowerCase()
    if (!q) {
      return {
        tickets: mockTickets.slice(0, 5),
        knowledge: mockKnowledgeArticles.slice(0, 5),
        memory: mockMemoryRecords.slice(0, 5),
      }
    }

    const tickets = mockTickets.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.tags.some((tag) => tag.toLowerCase().includes(q)),
    )

    const knowledge = mockKnowledgeArticles.filter(
      (k) =>
        k.title.toLowerCase().includes(q) ||
        k.summary.toLowerCase().includes(q) ||
        k.tags.some((tag) => tag.toLowerCase().includes(q)),
    )

    const memory = mockMemoryRecords.filter(
      (m) =>
        m.patternTitle.toLowerCase().includes(q) ||
        m.problemDescription.toLowerCase().includes(q) ||
        m.tags.some((tag) => tag.toLowerCase().includes(q)),
    )

    return { tickets, knowledge, memory }
  }
}

export const searchService: ISearchService = new MockSearchService()
