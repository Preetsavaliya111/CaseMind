import { useQuery } from '@tanstack/react-query'
import { dashboardService } from '../services/dashboardService'

export const dashboardKeys = { all: ['dashboard'] as const, overview: () => ['dashboard', 'overview'] as const }

export function useDashboardOverview() {
  return useQuery({ queryKey: dashboardKeys.overview(), queryFn: dashboardService.getOverview })
}

export function useWorkspaceDashboard() {
  return useQuery({ queryKey: [...dashboardKeys.all, 'workspace'], queryFn: dashboardService.getWorkspace })
}
