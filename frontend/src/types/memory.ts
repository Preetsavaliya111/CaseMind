// Organizational Memory Engine — type definitions

export interface MemoryEvidence {
  type: 'ticket' | 'knowledge_article' | 'incident_log' | 'runbook'
  id: string
  title: string
  url?: string
  date: string
}

export interface MemoryImpact {
  businessImpact: string   // e.g. "P1 — estimated $12K/hr"
  affectedCustomers: number
  affectedRevenue?: number
}

export interface OrganizationalMemory {
  id: string
  patternTitle: string       // Short label: "Payment gateway timeout"
  problemDescription: string // Detailed pattern description
  category: string
  rootCause: string
  rootCauseConfidence: number  // 0–1
  resolutionSteps: string[]
  evidenceSources: MemoryEvidence[]
  resolvedByTeam: string
  historicalTickets: string[]  // ticket IDs
  successRate: number          // 0–100
  avgResolutionHours: number
  usageCount: number
  lastUsedAt: string
  lastValidatedAt: string
  createdAt: string
  impact?: MemoryImpact
  tags: string[]
  isActive: boolean
}

export interface MemoryMatchResult {
  memory: OrganizationalMemory
  similarityScore: number   // 0–1
  matchedFields: string[]   // which fields triggered the match
}

export type MemoryItemType = 'issue_pattern' | 'root_cause' | 'resolution' | 'workaround' | 'known_limitation' | 'troubleshooting' | 'incident_insight'
export type MemoryVerificationState = 'draft' | 'verified' | 'deprecated'

export interface MemoryItemSource {
  id: string
  sourceType: 'case' | 'document'
  sourceId: string
  sourceTitle: string
  sourceLocator?: string
  createdAt: string
}

export interface MemoryItem {
  id: string
  title: string
  summary: string
  memoryType: MemoryItemType
  issuePattern: string
  rootCause?: string
  resolutionSteps: string[]
  confidence?: number
  verificationState: MemoryVerificationState
  tags: string[]
  product?: string
  category?: string
  usageCount: number
  createdByName: string
  verifiedByName?: string
  sources: MemoryItemSource[]
  createdAt: string
  updatedAt: string
  lastValidatedAt?: string
}
