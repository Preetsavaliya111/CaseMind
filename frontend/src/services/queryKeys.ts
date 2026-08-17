/**
 * Centralized TanStack Query key factory.
 * All query keys defined here — never inline in hooks.
 *
 * Pattern: [domain, resource, params]
 *   queryKeys.tickets.list({ status: 'new' }) → ['tickets', 'list', { status: 'new' }]
 *   queryKeys.tickets.detail('TKT-1001')      → ['tickets', 'detail', 'TKT-1001']
 */

export const queryKeys = {
  // Auth
  auth: {
    me: () => ['auth', 'me'] as const,
  },

  // Tickets
  tickets: {
    all: () => ['tickets'] as const,
    lists: () => ['tickets', 'list'] as const,
    list: (filters?: Record<string, unknown>) => ['tickets', 'list', filters ?? {}] as const,
    details: () => ['tickets', 'detail'] as const,
    detail: (id: string) => ['tickets', 'detail', id] as const,
    comments: (ticketId: string) => ['tickets', 'comments', ticketId] as const,
  },

  // Dashboard
  dashboard: {
    metrics: () => ['dashboard', 'metrics'] as const,
    trends: () => ['dashboard', 'trends'] as const,
    categories: () => ['dashboard', 'categories'] as const,
    agentPerformance: () => ['dashboard', 'agent-performance'] as const,
    myPerformance: () => ['dashboard', 'my-performance'] as const,
    recentActivity: () => ['dashboard', 'recent-activity'] as const,
    criticalTickets: () => ['dashboard', 'critical-tickets'] as const,
  },

  // Knowledge Base
  knowledge: {
    all: () => ['knowledge'] as const,
    articles: () => ['knowledge', 'articles'] as const,
    article: (id: string) => ['knowledge', 'article', id] as const,
    search: (query: string) => ['knowledge', 'search', query] as const,
    ragSearch: (query: string) => ['knowledge', 'rag-search', query] as const,
    ingestionJobs: () => ['knowledge', 'ingestion-jobs'] as const,
    ingestionJob: (id: string) => ['knowledge', 'ingestion-job', id] as const,
  },

  // Organizational Memory
  memory: {
    all: () => ['memory'] as const,
    list: (filters?: Record<string, unknown>) => ['memory', 'list', filters ?? {}] as const,
    record: (id: string) => ['memory', 'record', id] as const,
    matches: (ticketId: string) => ['memory', 'matches', ticketId] as const,
    activity: () => ['memory', 'activity'] as const,
  },

  // Analytics
  analytics: {
    all: () => ['analytics'] as const,
    summary: (range: string) => ['analytics', 'summary', range] as const,
    resolutionTime: (range: string) => ['analytics', 'resolution-time', range] as const,
    slaPerformance: (range: string) => ['analytics', 'sla-performance', range] as const,
    agentPerformance: (range: string) => ['analytics', 'agent-performance', range] as const,
    aiAccuracy: (range: string) => ['analytics', 'ai-accuracy', range] as const,
  },

  // Chat
  chat: {
    sessions: () => ['chat', 'sessions'] as const,
    session: (id: string) => ['chat', 'session', id] as const,
    messages: (sessionId: string) => ['chat', 'messages', sessionId] as const,
  },

  // Admin
  admin: {
    users: (filters?: Record<string, unknown>) => ['admin', 'users', filters ?? {}] as const,
    user: (id: string) => ['admin', 'user', id] as const,
    models: () => ['admin', 'models'] as const,
    model: (id: string) => ['admin', 'model', id] as const,
    experiments: () => ['admin', 'experiments'] as const,
    experiment: (id: string) => ['admin', 'experiment', id] as const,
  },
} as const
