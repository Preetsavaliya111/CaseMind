import type { MemoryItem, MemoryItemType, PaginatedResponse } from '@/types'
import { del, get, post } from '@/services/apiClient'


interface ApiMemoryItem {
  id: string
  title: string
  summary: string
  memory_type: MemoryItemType
  issue_pattern: string
  root_cause?: string
  resolution_steps: string[]
  confidence?: number
  verification_state: MemoryItem['verificationState']
  tags: string[]
  product?: string
  category?: string
  usage_count: number
  created_by_name: string
  verified_by_name?: string
  sources: Array<{ id: string; source_type: 'case' | 'document'; source_id: string; source_title: string; source_locator?: string; created_at: string }>
  created_at: string
  updated_at: string
  last_validated_at?: string
}

interface ApiMemoryList {
  items: ApiMemoryItem[]
  total: number
  page: number
  page_size: number
  pages: number
}

export interface CreateMemoryInput {
  title: string
  summary: string
  memoryType: MemoryItemType
  issuePattern: string
  rootCause?: string
  resolutionSteps: string[]
  tags: string[]
  category?: string
  sourceType: 'case' | 'document'
  sourceId: string
}

function mapMemory(item: ApiMemoryItem): MemoryItem {
  return {
    id: item.id,
    title: item.title,
    summary: item.summary,
    memoryType: item.memory_type,
    issuePattern: item.issue_pattern,
    rootCause: item.root_cause,
    resolutionSteps: item.resolution_steps,
    confidence: item.confidence,
    verificationState: item.verification_state,
    tags: item.tags,
    product: item.product,
    category: item.category,
    usageCount: item.usage_count,
    createdByName: item.created_by_name,
    verifiedByName: item.verified_by_name,
    sources: item.sources.map((source) => ({ id: source.id, sourceType: source.source_type, sourceId: source.source_id, sourceTitle: source.source_title, sourceLocator: source.source_locator, createdAt: source.created_at })),
    createdAt: item.created_at,
    updatedAt: item.updated_at,
    lastValidatedAt: item.last_validated_at,
  }
}

export const memoryService = {
  async list(search = ''): Promise<PaginatedResponse<MemoryItem>> {
    const response = await get<ApiMemoryList>('/memory-items', { params: { search: search || undefined, page_size: 100 } })
    return { data: response.items.map(mapMemory), total: response.total, page: response.page, pageSize: response.page_size, totalPages: response.pages }
  },

  async create(input: CreateMemoryInput): Promise<MemoryItem> {
    return mapMemory(await post<ApiMemoryItem>('/memory-items', {
      title: input.title,
      summary: input.summary,
      memory_type: input.memoryType,
      issue_pattern: input.issuePattern,
      root_cause: input.rootCause || null,
      resolution_steps: input.resolutionSteps,
      tags: input.tags,
      category: input.category || null,
      sources: [{ source_type: input.sourceType, source_id: input.sourceId }],
    }))
  },

  async verify(id: string): Promise<MemoryItem> {
    return mapMemory(await post<ApiMemoryItem>(`/memory-items/${id}/verify`))
  },

  async remove(id: string): Promise<void> {
    await del(`/memory-items/${id}`)
  },
}
