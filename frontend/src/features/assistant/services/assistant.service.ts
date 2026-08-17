import type {
  Conversation,
  AssistantMessage,
} from '../types'
import {
  MOCK_CONVERSATIONS,
  INITIAL_CITATIONS_AUGUST_SURGE,
  INITIAL_CONTEXT_AUGUST_SURGE,
} from './mockAssistantData'

export interface IAssistantService {
  getConversations(): Promise<Conversation[]>
  getConversation(id: string): Promise<Conversation | null>
  createConversation(title?: string): Promise<Conversation>
  deleteConversation(id: string): Promise<void>
  sendMessage(conversationId: string, content: string): Promise<AssistantMessage>
  retryMessage(conversationId: string, messageId: string): Promise<AssistantMessage>
}

/**
 * Intelligent Mock Response Generator
 * Produces structured enterprise insights with grounded citations and context intelligence.
 */
function generateMockResponse(conversationId: string, query: string): AssistantMessage {
  const q = query.toLowerCase()
  const msgId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`

  // 1. Specific Ticket Query (e.g., TKT-1001, CS-10482)
  if (q.match(/(tkt|cs)[-_]?\d+/i)) {
    const matchedId = (q.match(/(tkt|cs)[-_]?\d+/i)?.[0] || 'TKT-1001').toUpperCase()
    return {
      id: msgId,
      conversationId,
      role: 'assistant',
      status: 'complete',
      createdAt: new Date().toISOString(),
      content: `I retrieved the incident telemetry and audit logs for **${matchedId}**.

### Incident Breakdown
• **Incident ID**: \`${matchedId}\`
• **Category**: Enterprise Authentication & Checkout Gateway
• **Severity**: P1 Critical (SLA Target: 2.0 hrs)
• **Current Status**: **IN PROGRESS** (Assigned to Priya Sharma)
• **Affected Tenants**: Acme Corp, GlobalTech Inc. (approx. 2,400 active sessions affected)

### Root Cause Analysis
The logs show repeated PostgreSQL connection timeouts (\`ECONNREFUSED\`) under peak batch authorization workloads. The active connection pool is saturating after 10 concurrent requests.`,
      confidence: 0.96,
      keyFindings: [
        `Incident ${matchedId} was triggered by connection pool exhaustion during a scheduled batch sync.`,
        'Active pool limit is capped at 10 connections; required capacity is minimum 25 connections.',
        'SLA is currently at risk with 35 minutes remaining until target resolution threshold.',
      ],
      recommendedActions: [
        'Apply verified Organizational Memory Pattern MEM-001 (increase pool size to 25).',
        'Deploy circuit breaker pattern with exponential retry backoff.',
        'Notify account managers for Acme Corp and GlobalTech Inc.',
      ],
      citations: [
        {
          id: 'cit_tkt_01',
          type: 'ticket',
          title: `Incident Telemetry: ${matchedId}`,
          identifier: matchedId,
          relevanceScore: 0.98,
          snippet: 'DB connection timeouts occurring during peak checkout authorization windows.',
          url: '/tickets',
        },
        {
          id: 'cit_mem_01',
          type: 'memory',
          title: 'Database Connection Pool Exhaustion Fix SOP',
          identifier: 'Org Memory #MEM-001',
          relevanceScore: 0.94,
          snippet: 'Resolution steps validated with 94% historical success rate across 18 incidents.',
          url: '/memory',
        },
      ],
    }
  }

  // 2. SLA / Escalations / Critical Incidents
  if (q.match(/sla|breach|escalat|critical|p1|urgent/i)) {
    return {
      id: msgId,
      conversationId,
      role: 'assistant',
      status: 'complete',
      createdAt: new Date().toISOString(),
      content: `Here is the current operational SLA risk profile across all active enterprise support queues.

### Active SLA Summary
• **Open P1 / Critical Tickets**: **3 active incidents**
• **At-Risk Tickets (< 45 min to breach)**: **2 tickets** (TKT-1001, CS-10482)
• **SLA Compliance Rate (Last 30 Days)**: **96.2%** (Target: 98.0%)
• **Average MTTR for Enterprise Issues**: **2.4 hours**`,
      confidence: 0.93,
      keyFindings: [
        '2 critical tickets are currently entering the SLA At-Risk threshold.',
        'Escalation delays between Tier-1 support and Platform Engineering are the primary contributor to MTTR overruns.',
        'Automated AI triaging correctly flagged both issues within 90 seconds of creation.',
      ],
      recommendedActions: [
        'Trigger direct Slack alert to the Platform Engineering On-Call Lead.',
        'Reassign CS-10482 to Priya Sharma with priority override.',
        'Review ticket routing policies to eliminate the 25-minute manual triage bottleneck.',
      ],
      citations: INITIAL_CITATIONS_AUGUST_SURGE.slice(0, 2),
      context: INITIAL_CONTEXT_AUGUST_SURGE,
    }
  }

  // 3. Payment / Checkout / Pool issues
  if (q.match(/payment|gateway|checkout|pool|transaction|billing/i)) {
    return {
      id: msgId,
      conversationId,
      role: 'assistant',
      status: 'complete',
      createdAt: new Date().toISOString(),
      content: `Based on organizational memory and incident history, payment gateway timeout issues have a verified resolution procedure documented in **Org Memory Pattern #MEM-001**.

### System Impact & Behavior
Payment gateway timeouts occur primarily between **2:00 PM and 4:00 PM EST** due to connection pool starvation on \`payment-processor-service\`. During peak traffic, threads accumulate waiting for idle database connections, eventually failing after 30 seconds.`,
      confidence: 0.97,
      keyFindings: [
        'Root cause verified: DB_POOL_SIZE capped at 10 connections for 500+ concurrent checkout requests.',
        'Resolution pattern has been validated across 8 previous incidents with a 94% success rate.',
        'Estimated business impact: $12,000 / hour during peak checkout periods.',
      ],
      recommendedActions: [
        'Increase DB_POOL_SIZE from 10 to 25 in the service environment configuration.',
        'Increase CONNECTION_TIMEOUT from 30s to 120s.',
        'Implement circuit breaker pattern on the payment client to gracefully degrade on database saturation.',
      ],
      citations: [
        {
          id: 'cit_mem_pool',
          type: 'memory',
          title: 'Payment Gateway Connection Pool Exhaustion Precedent',
          identifier: 'Org Memory #MEM-001',
          relevanceScore: 0.97,
          snippet: 'Precedent resolution steps with 94% historical validation score.',
          url: '/memory',
        },
        {
          id: 'cit_doc_pool',
          type: 'document',
          title: 'Payment Gateway Troubleshooting Runbook',
          identifier: 'KB-Article #kb_001',
          relevanceScore: 0.92,
          snippet: 'Technical configuration guidelines for PostgreSQL connection pool management.',
          url: '/knowledge',
        },
      ],
    }
  }

  // 4. Default Comprehensive Support Intelligence Answer
  return {
    id: msgId,
    conversationId,
    role: 'assistant',
    status: 'complete',
    createdAt: new Date().toISOString(),
    content: `I analyzed your query across CaseMind's unified support intelligence layer, including **historical tickets**, **organizational memory patterns**, and **indexed technical documentation**.

### Analysis & Context
Based on recent support records and system metrics, here is the synthesized intelligence regarding your request. Our RAG pipeline retrieved **3 relevant precedents** and **2 documentation runbooks** grounded in your organization's verified data.`,
    confidence: 0.91,
    keyFindings: [
      'Identified relevant historical precedents in Organizational Memory matching your query parameters.',
      'Recent telemetry shows consistent correlation with platform release schedules and infrastructure limits.',
      'Recommended resolution path aligns with organizational best practices and SLA targets.',
    ],
    recommendedActions: [
      'Consult the referenced documentation and runbooks for verified resolution steps.',
      'Cross-reference active tickets with similar tags in the Tickets management module.',
      'Schedule a preventative review if this issue affects tier-1 enterprise accounts.',
    ],
    citations: [
      {
        id: 'cit_kb_gen',
        type: 'knowledge',
        title: 'CaseMind Enterprise Support Operations & Triaging Runbook',
        identifier: 'Knowledge Base',
        relevanceScore: 0.91,
        snippet: 'Standard operational guidelines for enterprise ticket triaging and knowledge grounding.',
        url: '/knowledge',
      },
      {
        id: 'cit_mem_gen',
        type: 'memory',
        title: 'Enterprise Incident Triaging & RCA Pattern Archive',
        identifier: 'Org Memory',
        relevanceScore: 0.88,
        snippet: 'Curated knowledge base of verified root causes and resolution workflows.',
        url: '/memory',
      },
    ],
    context: INITIAL_CONTEXT_AUGUST_SURGE,
  }
}

/**
 * Mock Assistant Service Implementation
 * Clean abstraction that can be seamlessly swapped with an HTTP client implementation.
 */
export class MockAssistantService implements IAssistantService {
  private conversations: Conversation[] = [...MOCK_CONVERSATIONS]

  async getConversations(): Promise<Conversation[]> {
    await this.simulateLatency(150)
    return [...this.conversations].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
  }

  async getConversation(id: string): Promise<Conversation | null> {
    await this.simulateLatency(100)
    const conv = this.conversations.find((c) => c.id === id)
    return conv ? { ...conv } : null
  }

  async createConversation(initialPrompt?: string): Promise<Conversation> {
    await this.simulateLatency(200)
    const id = `conv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
    const now = new Date().toISOString()

    const newConversation: Conversation = {
      id,
      title: initialPrompt ? this.generateTitle(initialPrompt) : 'New Conversation',
      createdAt: now,
      updatedAt: now,
      messages: [],
      summary: initialPrompt || 'New conversation started',
      contextSnapshot: INITIAL_CONTEXT_AUGUST_SURGE,
    }

    this.conversations = [newConversation, ...this.conversations]
    return newConversation
  }

  async deleteConversation(id: string): Promise<void> {
    await this.simulateLatency(150)
    this.conversations = this.conversations.filter((c) => c.id !== id)
  }

  async sendMessage(conversationId: string, content: string): Promise<AssistantMessage> {
    // Simulate realistic AI analysis and retrieval latency (600-900ms)
    await this.simulateLatency(750)

    const userMessage: AssistantMessage = {
      id: `msg_user_${Date.now()}`,
      conversationId,
      role: 'user',
      content,
      status: 'complete',
      createdAt: new Date().toISOString(),
    }

    const aiMessage = generateMockResponse(conversationId, content)

    // Update conversation in memory
    const convIndex = this.conversations.findIndex((c) => c.id === conversationId)
    if (convIndex !== -1) {
      const conv = this.conversations[convIndex]
      const updatedMessages = [...conv.messages, userMessage, aiMessage]
      const updatedTitle =
        conv.title === 'New Conversation' ? this.generateTitle(content) : conv.title

      this.conversations[convIndex] = {
        ...conv,
        title: updatedTitle,
        messages: updatedMessages,
        updatedAt: new Date().toISOString(),
        summary: content.slice(0, 100),
      }
    }

    return aiMessage
  }

  async retryMessage(conversationId: string, _messageId?: string): Promise<AssistantMessage> {
    await this.simulateLatency(600)
    const conv = this.conversations.find((c) => c.id === conversationId)
    const lastUserMsg = conv?.messages
      .slice()
      .reverse()
      .find((m) => m.role === 'user')

    return generateMockResponse(conversationId, lastUserMsg?.content || 'Retry previous inquiry')
  }

  private generateTitle(prompt: string): string {
    const cleaned = prompt.replace(/[^\w\s-]/g, '').trim()
    if (!cleaned) return 'New Inquiry'
    const words = cleaned.split(/\s+/).slice(0, 5).join(' ')
    return words.charAt(0).toUpperCase() + words.slice(1)
  }

  private simulateLatency(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

// Export singleton instance
export const assistantService: IAssistantService = new MockAssistantService()
