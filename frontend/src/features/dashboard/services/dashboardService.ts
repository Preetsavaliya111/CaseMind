import type { DashboardMetrics, TicketTrend, CategoryDistribution, AgentPerformance, MyPerformance } from '@/types'
import { mockDashboardMetrics, mockTicketTrends, mockCategoryDistribution, mockAgentPerformance, mockMyPerformance } from '@/mocks'

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

export const dashboardService = {
  async getMetrics(): Promise<DashboardMetrics> {
    await delay(400)
    return mockDashboardMetrics
  },

  async getTicketTrends(): Promise<TicketTrend[]> {
    await delay(300)
    return mockTicketTrends
  },

  async getCategoryDistribution(): Promise<CategoryDistribution[]> {
    await delay(350)
    return mockCategoryDistribution
  },

  async getAgentPerformance(): Promise<AgentPerformance[]> {
    await delay(300)
    return mockAgentPerformance
  },

  async getMyPerformance(): Promise<MyPerformance> {
    await delay(300)
    return mockMyPerformance
  },
}
