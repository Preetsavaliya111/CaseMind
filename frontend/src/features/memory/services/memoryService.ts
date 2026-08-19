import type { OrganizationalMemory, MemoryMatchResult } from '@/types'
import { mockMemoryRecords } from '@/mocks'

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

export interface MemoryFilterParams {
  category?: string
  search?: string
}

export interface IMemoryService {
  getMemoryRecords(filters?: MemoryFilterParams): Promise<OrganizationalMemory[]>
  getMemoryRecordById(id: string): Promise<OrganizationalMemory>
  simulateMatch(query: string): Promise<MemoryMatchResult | null>
  createMemoryRecord(data: Partial<OrganizationalMemory>): Promise<OrganizationalMemory>
  updateMemoryRecord(id: string, data: Partial<OrganizationalMemory>): Promise<OrganizationalMemory>
  deleteMemoryRecord(id: string): Promise<void>
}

/**
 * Temporary mock memory service implementation.
 * Swappable with central API client (GET /api/v1/memory) when backend endpoint is live.
 */
class MockMemoryService implements IMemoryService {
  private records: OrganizationalMemory[] = [...mockMemoryRecords]

  async getMemoryRecords(filters?: MemoryFilterParams): Promise<OrganizationalMemory[]> {
    await delay(300)
    let list = [...this.records]

    if (filters?.category && filters.category !== 'all') {
      list = list.filter((r) => r.category === filters.category)
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase()
      list = list.filter(
        (r) =>
          r.patternTitle.toLowerCase().includes(q) ||
          r.problemDescription.toLowerCase().includes(q) ||
          r.rootCause.toLowerCase().includes(q) ||
          r.tags.some((t) => t.toLowerCase().includes(q)),
      )
    }

    return list
  }

  async getMemoryRecordById(id: string): Promise<OrganizationalMemory> {
    await delay(200)
    const rec = this.records.find((r) => r.id === id)
    if (!rec) throw new Error(`Memory pattern ${id} not found`)
    return rec
  }

  async simulateMatch(query: string): Promise<MemoryMatchResult | null> {
    await delay(400)
    if (!query.trim()) return null
    const q = query.toLowerCase()

    let match = this.records.find((r) =>
      r.tags.some((t) => q.includes(t.toLowerCase())) ||
      r.patternTitle.toLowerCase().split(' ').some((w) => w.length > 3 && q.includes(w)),
    )

    if (!match && this.records.length > 0) {
      match = this.records[0]
    }

    if (!match) return null

    return {
      memory: match,
      similarityScore: 0.94,
      matchedFields: ['patternTitle', 'tags', 'rootCause'],
    }
  }

  async createMemoryRecord(data: Partial<OrganizationalMemory>): Promise<OrganizationalMemory> {
    await delay(500)
    const newRecord: OrganizationalMemory = {
      id: `MEM-${String(this.records.length + 1).padStart(3, '0')}`,
      patternTitle: data.patternTitle || 'Untitled Pattern',
      problemDescription: data.problemDescription || '',
      category: data.category || 'general',
      rootCause: data.rootCause || '',
      rootCauseConfidence: data.rootCauseConfidence || 0.85,
      resolutionSteps: data.resolutionSteps || [],
      evidenceSources: data.evidenceSources || [],
      resolvedByTeam: data.resolvedByTeam || 'Engineering Support',
      historicalTickets: data.historicalTickets || [],
      successRate: data.successRate || 90,
      avgResolutionHours: data.avgResolutionHours || 1.5,
      usageCount: 1,
      lastUsedAt: new Date().toISOString(),
      lastValidatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      tags: data.tags || [],
      isActive: true,
      impact: data.impact,
    }
    this.records.unshift(newRecord)
    return newRecord
  }

  async updateMemoryRecord(id: string, data: Partial<OrganizationalMemory>): Promise<OrganizationalMemory> {
    await delay(300)
    const idx = this.records.findIndex((r) => r.id === id)
    if (idx === -1) throw new Error(`Memory record ${id} not found`)
    this.records[idx] = {
      ...this.records[idx],
      ...data,
      lastValidatedAt: new Date().toISOString(),
    }
    return this.records[idx]
  }

  async deleteMemoryRecord(id: string): Promise<void> {
    await delay(300)
    this.records = this.records.filter((r) => r.id !== id)
  }
}

export const memoryService: IMemoryService = new MockMemoryService()
