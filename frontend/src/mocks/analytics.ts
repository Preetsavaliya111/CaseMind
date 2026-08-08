import type { DashboardMetrics, TicketTrend, CategoryDistribution, AgentPerformance } from '@/types'

export const mockDashboardMetrics: DashboardMetrics = {
  totalTickets: 1284,
  openTickets: 87,
  resolvedToday: 34,
  avgResolutionTime: 4.2,
  slaBreachRate: 3.8,
  customerSatisfaction: 94.2,
  aiAcceptanceRate: 78.5,
  firstContactResolution: 67.3,
}

export const mockTicketTrends: TicketTrend[] = [
  { date: '2024-07-09', created: 42, resolved: 38, open: 91 },
  { date: '2024-07-10', created: 55, resolved: 49, open: 97 },
  { date: '2024-07-11', created: 38, resolved: 52, open: 83 },
  { date: '2024-07-12', created: 61, resolved: 44, open: 100 },
  { date: '2024-07-13', created: 47, resolved: 58, open: 89 },
  { date: '2024-07-14', created: 53, resolved: 61, open: 81 },
  { date: '2024-07-15', created: 34, resolved: 28, open: 87 },
]

export const mockCategoryDistribution: CategoryDistribution[] = [
  { category: 'Bug', count: 412, percentage: 32.1 },
  { category: 'Feature Request', count: 287, percentage: 22.4 },
  { category: 'Performance', count: 198, percentage: 15.4 },
  { category: 'Integration', count: 167, percentage: 13.0 },
  { category: 'Billing', count: 124, percentage: 9.7 },
  { category: 'Security', count: 96, percentage: 7.5 },
]

export const mockAgentPerformance: AgentPerformance[] = [
  { agentId: 'usr_003', agentName: 'Priya Sharma', resolved: 142, avgResolutionTime: 3.8, csat: 96.1, slaCompliance: 98.2 },
  { agentId: 'usr_004', agentName: 'Marcus Johnson', resolved: 128, avgResolutionTime: 4.1, csat: 94.7, slaCompliance: 96.8 },
  { agentId: 'usr_006', agentName: 'Alex Kim', resolved: 119, avgResolutionTime: 4.6, csat: 93.2, slaCompliance: 95.1 },
  { agentId: 'usr_007', agentName: 'Fatima Al-Hassan', resolved: 107, avgResolutionTime: 5.2, csat: 91.8, slaCompliance: 93.4 },
]
