export interface DashboardMetrics {
  totalTickets: number
  openTickets: number
  resolvedToday: number
  avgResolutionTime: number
  slaBreachRate: number
  customerSatisfaction: number
  aiAcceptanceRate: number
  firstContactResolution: number
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
}

export interface AgentPerformance {
  agentId: string
  agentName: string
  resolved: number
  avgResolutionTime: number
  csat: number
  slaCompliance: number
}
