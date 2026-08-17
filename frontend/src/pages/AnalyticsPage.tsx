import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, SkeletonCard, Button, Badge } from '@/components/ui'
import { StatCard } from '@/components/common'
import { CategoryPieChart } from '@/components/charts'
import { TimeRangeSelector } from '@/features/analytics/components/TimeRangeSelector'
import {
  useDashboardMetrics,
  useTicketTrends,
  useCategoryDistribution,
} from '@/features/dashboard/hooks/useDashboard'
import type { AnalyticsTimeRange } from '@/features/analytics/types'
import {
  TrendingUp, Users, Brain, Clock, Download, Sparkles
} from 'lucide-react'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { formatDate } from '@/utils'


const RANGE_MULTIPLIERS: Record<AnalyticsTimeRange, number> = {
  '7d': 1,
  '30d': 4.2,
  '90d': 12.8,
  '1y': 52,
}

export function AnalyticsPage() {
  const [range, setRange] = useState<AnalyticsTimeRange>('30d')
  const [isExporting, setIsExporting] = useState(false)

  const { data: metrics, isLoading: metricsLoading } = useDashboardMetrics()
  const { data: trends, isLoading: trendsLoading } = useTicketTrends()
  const { data: categories, isLoading: categoriesLoading } = useCategoryDistribution()

  const multiplier = RANGE_MULTIPLIERS[range]


  // Scaled trends
  const scaledTrends = trends?.map((t, i) => ({
    ...t,
    created: Math.round(t.created * multiplier * (0.9 + Math.sin(i) * 0.1)),
    resolved: Math.round(t.resolved * multiplier * (0.85 + Math.cos(i) * 0.1)),
  }))

  // Resolution histogram
  const resolutionBuckets = [
    { bucket: '<1h', count: Math.round(89 * multiplier) },
    { bucket: '1–4h', count: Math.round(234 * multiplier) },
    { bucket: '4–8h', count: Math.round(178 * multiplier) },
    { bucket: '8–24h', count: Math.round(142 * multiplier) },
    { bucket: '1–3d', count: Math.round(67 * multiplier) },
    { bucket: '>3d', count: Math.round(23 * multiplier) },
  ]

  // AI Model Accuracy over time
  const aiAccuracyTrend = [
    { date: '2024-07-09', classification: 94.2, priority: 91.8, memoryMatch: 95.1 },
    { date: '2024-07-10', classification: 94.8, priority: 92.4, memoryMatch: 95.4 },
    { date: '2024-07-11', classification: 95.1, priority: 92.1, memoryMatch: 95.0 },
    { date: '2024-07-12', classification: 95.6, priority: 93.0, memoryMatch: 96.2 },
    { date: '2024-07-13', classification: 95.8, priority: 93.2, memoryMatch: 96.5 },
    { date: '2024-07-14', classification: 96.2, priority: 93.8, memoryMatch: 96.8 },
    { date: '2024-07-15', classification: 96.4, priority: 94.0, memoryMatch: 97.2 },
  ]

  const handleExportCSV = () => {
    setIsExporting(true)
    setTimeout(() => {
      const csvContent =
        'data:text/csv;charset=utf-8,' +
        'Date,Created,Resolved,CSAT,FCR,AIAcceptance\n' +
        (scaledTrends?.map((t) => `${t.date},${t.created},${t.resolved},94.2%,67.3%,78.5%`).join('\n') ?? '')
      const encodedUri = encodeURI(csvContent)
      const link = document.createElement('a')
      link.setAttribute('href', encodedUri)
      link.setAttribute('download', `casemind-analytics-${range}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      setIsExporting(false)
    }, 600)
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight text-foreground">
            Platform Analytics & Intelligence
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Operational throughput, customer satisfaction, and ML model accuracy trends.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <TimeRangeSelector value={range} onChange={setRange} />
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={handleExportCSV}
            loading={isExporting}
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Historical KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricsLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : metrics ? (
          <>
            <StatCard
              title="Customer Satisfaction (CSAT)"
              value={`${metrics.customerSatisfaction}%`}
              icon={TrendingUp}
              trend={{ value: 2.1, label: `vs prev ${range}`, isPositiveGood: true }}
              iconClassName="bg-success/10"
            />
            <StatCard
              title="First Contact Resolution (FCR)"
              value={`${metrics.firstContactResolution}%`}
              icon={Users}
              trend={{ value: 1.4, label: `vs prev ${range}`, isPositiveGood: true }}
              iconClassName="bg-info/10"
            />
            <StatCard
              title="AI Resolution Acceptance"
              value={`${metrics.aiAcceptanceRate}%`}
              icon={Brain}
              trend={{ value: 3.7, label: `vs prev ${range}`, isPositiveGood: true }}
              iconClassName="bg-primary/10"
            />
            <StatCard
              title="Avg Resolution Time"
              value={`${metrics.avgResolutionTime}h`}
              icon={Clock}
              trend={{ value: -0.6, label: `vs prev ${range}`, isPositiveGood: true }}
              iconClassName="bg-warning/10"
            />
          </>
        ) : null}
      </div>

      {/* Trend + Category Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold font-display">
                Ticket Creation vs Resolution Rate
              </CardTitle>
              <Badge variant="secondary" className="text-2xs font-mono">{range}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {trendsLoading ? (
              <div className="h-64 skeleton rounded-xl" />
            ) : scaledTrends ? (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={scaledTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(d) => formatDate(d).slice(0, 5)}
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '11px',
                    }}
                    labelFormatter={(d) => formatDate(d)}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Line type="monotone" dataKey="created" name="Tickets Created" stroke="hsl(221,83%,60%)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="resolved" name="Tickets Resolved" stroke="hsl(142,71%,45%)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : null}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold font-display">
              Incident Category Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {categoriesLoading ? (
              <div className="h-64 skeleton rounded-xl" />
            ) : categories ? (
              <CategoryPieChart data={categories} />
            ) : null}
          </CardContent>
        </Card>
      </div>

      {/* AI Accuracy & Resolution Distribution Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Model Performance Over Time */}
        <Card className="shadow-sm border-primary/20">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold font-display flex items-center gap-1.5 text-primary">
                <Sparkles className="h-4 w-4" />
                AI Inference Accuracy & Precision (%)
              </CardTitle>
              <Badge variant="default" className="text-2xs bg-primary/20 text-primary border-primary/30">
                BERT v2.4
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={aiAccuracyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(d) => formatDate(d).slice(0, 5)}
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[85, 100]}
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                  formatter={(v: number) => [`${v}%`]}
                  labelFormatter={(d) => formatDate(d)}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line type="monotone" dataKey="classification" name="Category Accuracy" stroke="hsl(221,83%,60%)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="priority" name="Priority Precision" stroke="hsl(38,92%,50%)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="memoryMatch" name="Memory Match Success" stroke="hsl(262,83%,58%)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Resolution Time Histogram */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold font-display">
              Resolution Time Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={resolutionBuckets} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis
                  dataKey="bucket"
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                />
                <Bar dataKey="count" name="Tickets" fill="hsl(199,89%,48%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
