import type { AnalyticsTimeRange } from '../types'

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

export interface ResolutionBucket {
  bucket: string
  count: number
}

export interface AiAccuracyTrend {
  date: string
  classification: number
  priority: number
  memoryMatch: number
}

export interface IAnalyticsService {
  getResolutionBuckets(range: AnalyticsTimeRange): Promise<ResolutionBucket[]>
  getAiAccuracyTrends(range: AnalyticsTimeRange): Promise<AiAccuracyTrend[]>
  exportReport(range: AnalyticsTimeRange, format?: 'csv' | 'json' | 'pdf'): Promise<{ success: boolean; filename: string }>
}

const RANGE_MULTIPLIERS: Record<AnalyticsTimeRange, number> = {
  '7d': 1,
  '30d': 4.2,
  '90d': 12.8,
  '1y': 52,
}

class MockAnalyticsService implements IAnalyticsService {
  async getResolutionBuckets(range: AnalyticsTimeRange): Promise<ResolutionBucket[]> {
    await delay(250)
    const multiplier = RANGE_MULTIPLIERS[range]
    return [
      { bucket: '<1h', count: Math.round(89 * multiplier) },
      { bucket: '1–4h', count: Math.round(234 * multiplier) },
      { bucket: '4–8h', count: Math.round(178 * multiplier) },
      { bucket: '8–24h', count: Math.round(142 * multiplier) },
      { bucket: '1–3d', count: Math.round(67 * multiplier) },
      { bucket: '>3d', count: Math.round(23 * multiplier) },
    ]
  }

  async getAiAccuracyTrends(_range: AnalyticsTimeRange): Promise<AiAccuracyTrend[]> {
    await delay(300)
    return [
      { date: '2024-07-09', classification: 94.2, priority: 91.8, memoryMatch: 95.1 },
      { date: '2024-07-10', classification: 94.8, priority: 92.4, memoryMatch: 95.4 },
      { date: '2024-07-11', classification: 95.1, priority: 92.1, memoryMatch: 95.8 },
      { date: '2024-07-12', classification: 95.6, priority: 93.5, memoryMatch: 96.2 },
      { date: '2024-07-13', classification: 96.0, priority: 94.1, memoryMatch: 96.7 },
      { date: '2024-07-14', classification: 96.4, priority: 94.8, memoryMatch: 97.1 },
      { date: '2024-07-15', classification: 96.8, priority: 95.2, memoryMatch: 97.5 },
    ]
  }

  async exportReport(range: AnalyticsTimeRange, format: 'csv' | 'json' | 'pdf' = 'csv'): Promise<{ success: boolean; filename: string }> {
    await delay(800)
    const filename = `casemind-analytics-${range}-${new Date().toISOString().split('T')[0]}.${format}`
    return { success: true, filename }
  }
}

export const analyticsService: IAnalyticsService = new MockAnalyticsService()
