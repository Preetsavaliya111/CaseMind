import { useQuery, useMutation } from '@tanstack/react-query'
import { analyticsService } from '../services/analyticsService'
import type { AnalyticsTimeRange } from '../types'

export const analyticsKeys = {
  all: ['analytics'] as const,
  buckets: (range: AnalyticsTimeRange) => [...analyticsKeys.all, 'buckets', range] as const,
  aiAccuracy: (range: AnalyticsTimeRange) => [...analyticsKeys.all, 'aiAccuracy', range] as const,
}

export function useResolutionBuckets(range: AnalyticsTimeRange) {
  return useQuery({
    queryKey: analyticsKeys.buckets(range),
    queryFn: () => analyticsService.getResolutionBuckets(range),
  })
}

export function useAiAccuracyTrends(range: AnalyticsTimeRange) {
  return useQuery({
    queryKey: analyticsKeys.aiAccuracy(range),
    queryFn: () => analyticsService.getAiAccuracyTrends(range),
  })
}

export function useExportAnalyticsReport() {
  return useMutation({
    mutationFn: ({ range, format }: { range: AnalyticsTimeRange; format?: 'csv' | 'json' | 'pdf' }) =>
      analyticsService.exportReport(range, format),
  })
}
