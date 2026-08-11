import { useQuery } from '@tanstack/react-query'
import { dashboardService } from '../services/dashboardService'

export const dashboardKeys = {
  all: ['dashboard'] as const,
  metrics: () => [...dashboardKeys.all, 'metrics'] as const,
  trends: () => [...dashboardKeys.all, 'trends'] as const,
  categories: () => [...dashboardKeys.all, 'categories'] as const,
  agentPerformance: () => [...dashboardKeys.all, 'agent-performance'] as const,
}

export function useDashboardMetrics() {
  return useQuery({
    queryKey: dashboardKeys.metrics(),
    queryFn: dashboardService.getMetrics,
  })
}

export function useTicketTrends() {
  return useQuery({
    queryKey: dashboardKeys.trends(),
    queryFn: dashboardService.getTicketTrends,
  })
}

export function useCategoryDistribution() {
  return useQuery({
    queryKey: dashboardKeys.categories(),
    queryFn: dashboardService.getCategoryDistribution,
  })
}

export function useAgentPerformance() {
  return useQuery({
    queryKey: dashboardKeys.agentPerformance(),
    queryFn: dashboardService.getAgentPerformance,
  })
}
