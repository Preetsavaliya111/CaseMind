export type SLAState = 'healthy' | 'at_risk' | 'breached'

export interface SparklinePoint {
  date: string
  value: number
}

export interface KPICardData {
  value: number
  delta: number           // positive = up, negative = down
  deltaLabel: string      // e.g. "+8 from yesterday"
  isPositive: boolean     // true if delta is "good" (context-dependent)
  sparkline: SparklinePoint[]
}

export interface MyPerformance {
  resolvedThisWeek: number
  resolvedThisMonth: number
  avgResolutionTime: number
  csat: number
  csatTrend: number
  slaCompliance: number
  resolutionTrend: SparklinePoint[]
}

export interface AnalyticsHistoricalMetrics {
  totalTickets: number
  customerSatisfaction: number
  csatTrend: number
  firstContactResolution: number
  fcrTrend: number
  aiAcceptanceRate: number
  aiTrend: number
  avgResolutionTime: number
  resolutionTrend: number
}

export interface DashboardMetrics {
  totalTickets: number
  openTickets: number
  inProgressTickets: number
  resolvedToday: number
  slaBreached: number
  avgResolutionTime: number
  slaBreachRate: number
  customerSatisfaction: number
  aiAcceptanceRate: number
  firstContactResolution: number
  // Memory activity
  memoryMatchesToday: number
  newMemoryRecordsToday: number
  topMemoryPattern: string
}

export interface TicketTrend {
  date: string
  created: number
  resolved: number
  open: number
}

export interface CategoryDistribution {
  category: string
  count: number
  percentage: number
  avgResolutionHours?: number
}

export interface AgentPerformance {
  agentId: string
  agentName: string
  resolved: number
  avgResolutionTime: number
  csat: number
  slaCompliance: number
  csatScore?: number
}

export interface ResolutionTimeHistogram {
  bucket: string    // "<1h", "1–4h", "4–8h", "8–24h", "1–3d", ">3d"
  count: number
}

export interface SLAPerformanceWeek {
  week: string
  met: number
  breached: number
}

