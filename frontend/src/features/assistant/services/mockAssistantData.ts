import type { Conversation, Citation, ContextIntelligence } from '../types'

export const INITIAL_CITATIONS_AUGUST_SURGE: Citation[] = [
  {
    id: 'cit_01',
    type: 'ticket',
    title: 'Enterprise authentication failures during peak hours',
    identifier: 'Ticket #CS-10482',
    relevanceScore: 0.96,
    snippet: 'SAML IdP token exchange timeouts after deployment of v4.2.0 auth proxy cluster.',
    url: '/tickets/TKT-1002',
  },
  {
    id: 'cit_02',
    type: 'knowledge',
    title: 'Enterprise Authentication Troubleshooting Guide & Token Sync SOP',
    identifier: 'Knowledge Base',
    relevanceScore: 0.94,
    snippet: 'Step-by-step resolution for clock-skew tolerance and IdP cert fingerprint validation.',
    url: '/knowledge',
  },
  {
    id: 'cit_03',
    type: 'document',
    title: 'CaseMind Platform Release Notes v4.2 & Migration Checklist',
    identifier: 'Document v4.2',
    relevanceScore: 0.89,
    snippet: 'Introduced strict OAuth2 token exchange rate limits and new connection pool defaults.',
    url: '/knowledge',
  },
  {
    id: 'cit_04',
    type: 'memory',
    title: 'Payment Gateway & Auth Pool Connection Exhaustion Pattern',
    identifier: 'Org Memory #MEM-001',
    relevanceScore: 0.92,
    snippet: 'Historical precedent verified with 94% success rate across 18 historical incidents.',
    url: '/memory',
  },
]

export const INITIAL_CONTEXT_AUGUST_SURGE: ContextIntelligence = {
  relatedTickets: [
    {
      id: 'CS-10482',
      title: 'Enterprise authentication failure during checkout',
      status: 'in_progress',
      priority: 'critical',
      assignee: 'Priya Sharma',
      reporter: 'GlobalTech Enterprise',
      createdAt: '2026-08-14T09:20:00Z',
    },
    {
      id: 'CS-10491',
      title: 'Login failures after deployment of v4.2 auth proxy',
      status: 'assigned',
      priority: 'high',
      assignee: 'Marcus Johnson',
      reporter: 'Acme Corp',
      createdAt: '2026-08-15T11:45:00Z',
    },
    {
      id: 'CS-10504',
      title: 'Session expiry during batch export process',
      status: 'new',
      priority: 'medium',
      assignee: 'Unassigned',
      reporter: 'FinEdge Systems',
      createdAt: '2026-08-16T14:10:00Z',
    },
  ],
  relatedDocuments: [
    {
      id: 'doc_auth_sop',
      title: 'Authentication Troubleshooting SOP',
      category: 'Security & Auth',
      type: 'sop',
      lastUpdated: '2026-08-01',
      version: '3.1',
    },
    {
      id: 'doc_rel_42',
      title: 'Release Notes v4.2 — Auth & Pool Updates',
      category: 'Engineering Releases',
      type: 'release_notes',
      lastUpdated: '2026-08-10',
      version: '4.2.0',
    },
    {
      id: 'doc_runbook_pool',
      title: 'PostgreSQL & Redis Connection Pool Runbook',
      category: 'Platform Operations',
      type: 'runbook',
      lastUpdated: '2026-07-28',
      version: '2.4',
    },
  ],
  knowledgeUsed: [
    'Indexed Release Notes v4.2.0',
    'Historical Tickets Q2-Q3 2026',
    'Organizational Memory Pattern MEM-001',
    'SAML SSO Runbook v3.1',
  ],
  suggestedActions: [
    'Increase DB_POOL_SIZE and token timeout limit in payment-service config',
    'Trigger broadcast notification to Enterprise Tier tier-1 accounts',
    'Assign pending CS-10504 to Marcus Johnson (Auth SME)',
    'Generate incident postmortem draft for engineering sync',
  ],
  activeRootCause: 'DB_POOL_SIZE misconfigured at 10 connections for services handling 500+ concurrent SSO requests after v4.2 release.',
  confidenceScore: 0.94,
}

export const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv_august_surge',
    title: 'August revenue & support surge analysis',
    createdAt: '2026-08-17T09:30:00Z',
    updatedAt: '2026-08-17T10:15:00Z',
    summary: 'Root cause analysis of enterprise authentication surge and recommended SLA mitigation steps.',
    pinned: true,
    contextSnapshot: INITIAL_CONTEXT_AUGUST_SURGE,
    messages: [
      {
        id: 'msg_01',
        conversationId: 'conv_august_surge',
        role: 'user',
        content: 'Why did enterprise support tickets increase in August, and what should our support team do about it?',
        status: 'complete',
        createdAt: '2026-08-17T09:30:00Z',
      },
      {
        id: 'msg_02',
        conversationId: 'conv_august_surge',
        role: 'assistant',
        content: `Based on the resolved cases, ticket analytics, and available knowledge sources, the August increase is concentrated around enterprise authentication and deployment configuration issues introduced during the recent platform release.

### Root Cause & Volume Drivers
Our RAG retrieval and Organizational Memory engine identified **47 related incidents** across 12 tier-1 enterprise accounts in the last 14 days. The spike peaked following the August 10 deployment of Release v4.2.0.`,
        status: 'complete',
        createdAt: '2026-08-17T09:30:30Z',
        confidence: 0.94,
        keyFindings: [
          'Authentication failures increased by 68% following the deployment of v4.2.0 auth proxy clusters.',
          'Several enterprise customers experienced deployment and SAML token renewal issues during peak business hours (2–4 PM EST).',
          'Multiple P1 and P2 tickets reference the same release window and connection pool timeout limits.',
          'Mean Time to Resolution (MTTR) increased by 42 minutes because ticket triaging routed auth errors to general support instead of Tier-3 Identity Engineers.',
        ],
        recommendedActions: [
          'Review authentication configuration changes and DB_POOL_SIZE parameters introduced in Release v4.2.',
          'Publish and link the internal SAML SSO Troubleshooting SOP to all active authentication queues.',
          'Prioritize enterprise escalation routing directly to Identity & Security SMEs for faster resolution.',
          'Enable proactive telemetry monitoring on SAML token exchange latency ahead of the next scheduled release.',
        ],
        citations: INITIAL_CITATIONS_AUGUST_SURGE,
        context: INITIAL_CONTEXT_AUGUST_SURGE,
      },
    ],
  },
  {
    id: 'conv_eu_expansion',
    title: 'European market expansion onboarding',
    createdAt: '2026-08-16T14:20:00Z',
    updatedAt: '2026-08-16T15:05:00Z',
    summary: 'EU data residency compliance questions and GDPR-compliant memory retention guidelines.',
    messages: [
      {
        id: 'msg_eu_01',
        conversationId: 'conv_eu_expansion',
        role: 'user',
        content: 'Summarize our current EU data residency requirements for the upcoming enterprise client launch in Frankfurt.',
        status: 'complete',
        createdAt: '2026-08-16T14:20:00Z',
      },
      {
        id: 'msg_eu_02',
        conversationId: 'conv_eu_expansion',
        role: 'assistant',
        content: `According to CaseMind Compliance SOP v2.4 and Architecture Specification 07, all telemetry and memory records for EU-based enterprise tenants must remain within the \`eu-central-1\` AWS region.

### Compliance Checklist Summary
1. **Database Partitioning**: PostgreSQL schema tenancy isolates EU enterprise records from global clusters.
2. **Vector Embeddings**: Qdrant vector collections for EU tenants are isolated and encrypted with customer-managed keys (CMK).
3. **Data Retention**: Unresolved ticket PII is redacted automatically after 90 days.`,
        status: 'complete',
        createdAt: '2026-08-16T14:20:45Z',
        confidence: 0.97,
        keyFindings: [
          'EU data isolation is fully enforced on PostgreSQL and Qdrant vector stores in Frankfurt.',
          'Audit logs require 365-day immutable retention in compliant S3 buckets.',
        ],
        recommendedActions: [
          'Verify CMK key rotation schedule with the customer security delegate.',
          'Attach GDPR Data Processing Addendum to customer workspace profile.',
        ],
        citations: [
          {
            id: 'cit_eu_01',
            type: 'document',
            title: 'CaseMind EU Data Residency Architecture & Compliance Spec',
            identifier: 'Doc #SEC-EU-01',
            relevanceScore: 0.98,
          },
        ],
      },
    ],
  },
  {
    id: 'conv_churn_analysis',
    title: 'Enterprise churn analysis & SLA risk',
    createdAt: '2026-08-15T11:00:00Z',
    updatedAt: '2026-08-15T11:45:00Z',
    summary: 'High-risk enterprise accounts with recurring SLA breaches and unverified resolutions.',
    messages: [
      {
        id: 'msg_churn_01',
        conversationId: 'conv_churn_analysis',
        role: 'user',
        content: 'Which enterprise customers have the highest risk of churn based on recent SLA breaches?',
        status: 'complete',
        createdAt: '2026-08-15T11:00:00Z',
      },
      {
        id: 'msg_churn_02',
        conversationId: 'conv_churn_analysis',
        role: 'assistant',
        content: `Analysis of Q3 support telemetry indicates **GlobalTech Inc** and **Acme Corp** have experienced consecutive P1 incidents that breached the 2-hour resolution SLA.

### At-Risk Accounts Overview
• **GlobalTech Inc**: 3 SLA breaches in 30 days (Payment timeout + SAML token lock). Estimated $48K ARR at risk.
• **Acme Corp**: 2 SLA breaches due to batch CSV export timeouts.`,
        status: 'complete',
        createdAt: '2026-08-15T11:00:40Z',
        confidence: 0.91,
        keyFindings: [
          'Recurring P1 incidents on GlobalTech account correlate with peak checkout windows.',
          'CSAT rating from Acme Corp dropped to 3.2 following unresolved export latency.',
        ],
        recommendedActions: [
          'Schedule an Executive CS review with GlobalTech account stakeholders.',
          'Apply Org Memory Pattern MEM-001 to resolve connection pool bottlenecks permanently.',
        ],
      },
    ],
  },
  {
    id: 'conv_escalation_summary',
    title: 'Customer escalation summary — GlobalTech',
    createdAt: '2026-08-14T09:15:00Z',
    updatedAt: '2026-08-14T10:00:00Z',
    summary: 'Incident timeline and engineering postmortem for GlobalTech checkout interruption.',
    messages: [
      {
        id: 'msg_esc_01',
        conversationId: 'conv_escalation_summary',
        role: 'user',
        content: 'Give me the complete timeline of the GlobalTech checkout interruption incident.',
        status: 'complete',
        createdAt: '2026-08-14T09:15:00Z',
      },
      {
        id: 'msg_esc_02',
        conversationId: 'conv_escalation_summary',
        role: 'assistant',
        content: `### GlobalTech Escalation Timeline (INC-2847)
• **14:02 EST**: Initial payment gateway timeout alerts triggered.
• **14:15 EST**: Ticket TKT-1001 created by customer reporting 15% checkout failure rate.
• **14:35 EST**: Escalated to Platform Engineering.
• **15:10 EST**: Pool size increased from 10 to 25 connections; services restarted.
• **15:25 EST**: Full throughput restored; zero failed transactions reported post-restart.`,
        status: 'complete',
        createdAt: '2026-08-14T09:15:35Z',
        confidence: 0.96,
      },
    ],
  },
  {
    id: 'conv_q3_trends',
    title: 'Q3 support trends & MTTR drivers',
    createdAt: '2026-08-12T16:00:00Z',
    updatedAt: '2026-08-12T16:30:00Z',
    summary: 'Cross-category resolution speed analysis comparing AI-assisted vs manual tickets.',
    messages: [
      {
        id: 'msg_q3_01',
        conversationId: 'conv_q3_trends',
        role: 'user',
        content: 'How has the AI Organizational Memory engine impacted MTTR across different ticket categories?',
        status: 'complete',
        createdAt: '2026-08-12T16:00:00Z',
      },
      {
        id: 'msg_q3_02',
        conversationId: 'conv_q3_role',
        role: 'assistant',
        content: `### MTTR Impact Analysis (Q3 2026)
Tickets resolved with matched Organizational Memory patterns show a **58% reduction in MTTR** compared to unassisted resolutions (1.8 hours vs 4.3 hours).

### Category Breakdown
• **Bug & Database**: -64% MTTR (from 5.1h to 1.8h)
• **Integration / SAML**: -52% MTTR (from 3.8h to 1.8h)
• **Performance**: -45% MTTR (from 4.0h to 2.2h)`,
        status: 'complete',
        createdAt: '2026-08-12T16:00:30Z',
        confidence: 0.95,
      },
    ],
  },
  {
    id: 'conv_rel_42_incident',
    title: 'Release 4.2 incident & connection pool root-cause',
    createdAt: '2026-08-10T11:20:00Z',
    updatedAt: '2026-08-10T12:00:00Z',
    summary: 'Technical root-cause verification for payment-processor thread exhaustion.',
    messages: [
      {
        id: 'msg_rel_01',
        conversationId: 'conv_rel_42_incident',
        role: 'user',
        content: 'What was the exact root cause of the payment processor service failure during Release 4.2?',
        status: 'complete',
        createdAt: '2026-08-10T11:20:00Z',
      },
      {
        id: 'msg_rel_02',
        conversationId: 'conv_rel_42_incident',
        role: 'assistant',
        content: `The incident was caused by \`DB_POOL_SIZE\` being capped at 10 connections in the payment service Helm chart, whereas the v4.2 background health-probe introduced additional concurrent keep-alive connections that saturated the pool under 500+ active sessions.`,
        status: 'complete',
        createdAt: '2026-08-10T11:20:30Z',
        confidence: 0.99,
      },
    ],
  },
]
