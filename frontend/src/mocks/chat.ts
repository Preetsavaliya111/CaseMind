import type { ChatSession, ChatMessage } from '@/types'

export const mockChatSessions: ChatSession[] = [
  {
    id: 'session_001',
    title: 'Payment Gateway Timeout Investigation',
    createdAt: '2024-07-15T10:35:00Z',
    updatedAt: '2024-07-15T10:45:00Z',
    messageCount: 4,
    lastMessage: 'Summary of connection pool resolution steps',
  },
  {
    id: 'session_002',
    title: 'SSO SAML Certificate Expiry Runbook',
    createdAt: '2024-07-15T09:20:00Z',
    updatedAt: '2024-07-15T09:30:00Z',
    messageCount: 3,
    lastMessage: 'Certificate rotation command syntax',
  },
  {
    id: 'session_003',
    title: 'Platform SLA & Metrics Inquiry',
    createdAt: '2024-07-14T16:00:00Z',
    updatedAt: '2024-07-14T16:05:00Z',
    messageCount: 2,
    lastMessage: 'Overall team SLA compliance stands at 96.1%',
  },
]

export const mockChatMessages: Record<string, ChatMessage[]> = {
  session_001: [
    {
      id: 'msg_001',
      sessionId: 'session_001',
      role: 'user',
      content: 'What is the root cause for ticket TKT-1001 payment gateway timeouts?',
      timestamp: '2024-07-15T10:35:00Z',
    },
    {
      id: 'msg_002',
      sessionId: 'session_001',
      role: 'assistant',
      content:
        'Based on **TKT-1001** and organizational memory records:\n\n### Root Cause Analysis\n* **DB_POOL_SIZE exhaustion**: The connection pool was capped at 10 connections for over 500 concurrent checkout users.\n* **Thread Pileup**: 30-second default timeout compounded thread starvation during peak load.\n\n### Recommended Actions\n1. Increase `DB_POOL_SIZE` from 10 to 25.\n2. Implement a circuit breaker with exponential backoff on payment API calls.\n3. Verify against **TKT-0887** and **TKT-0923** historical fixes.',
      timestamp: '2024-07-15T10:35:05Z',
      sourceType: 'memory',
      sources: [
        {
          id: 'mem_001',
          type: 'memory_record',
          title: 'Payment gateway connection pool exhaustion',
          relevanceScore: 0.96,
        },
        {
          id: 'TKT-1001',
          type: 'ticket',
          title: 'Payment gateway timeout during checkout',
          relevanceScore: 0.98,
        },
      ],
      suggestions: ['Show resolution steps', 'View related runbook', 'Check SLA status'],
    },
  ],
}
