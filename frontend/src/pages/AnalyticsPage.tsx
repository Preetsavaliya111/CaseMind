import { Card, CardContent, CardHeader, CardTitle, SkeletonCard } from '@/components/ui'
import { StatCard } from '@/components/common'
import { TicketTrendChart, CategoryPieChart } from '@/components/charts'
import { useDashboardMetrics, useTicketTrends, useCategoryDistribution, useAgentPerformance } from '@/features/dashboard/hooks/useDashboard'
import { BarChart3, TrendingUp, Users, Clock } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export function AnalyticsPage() {
  const { data: metrics, isLoading: metricsLoading } = useDashboardMetrics()
  const { data: trends, isLoading: trendsLoading } = useTicketTrends()
  const { data: categories, isLoading: categoriesLoading } = useCategoryDistribution()
  const { data: agents, isLoading: agentsLoading } = useAgentPerformance()

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricsLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : metrics ? (
          <>
            <StatCard title="Total Tickets" value={metrics.totalTickets.toLocaleString()} icon={BarChart3} />
            <StatCard title="CSAT Score" value={`${metrics.customerSatisfaction}%`} icon={TrendingUp} iconClassName="bg-emerald-100 dark:bg-emerald-900/30" />
            <StatCard title="FCR Rate" value={`${metrics.firstContactResolution}%`} icon={Users} iconClassName="bg-purple-100 dark:bg-purple-900/30" />
            <StatCard title="Avg Resolution" value={`${metrics.avgResolutionTime}h`} icon={Clock} iconClassName="bg-amber-100 dark:bg-amber-900/30" />
          </>
        ) : null}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Ticket Volume (7 Days)</CardTitle></CardHeader>
          <CardContent>
            {trendsLoading ? <div className="h-60 skeleton rounded-md" /> : trends ? <TicketTrendChart data={trends} /> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Category Breakdown</CardTitle></CardHeader>
          <CardContent>
            {categoriesLoading ? <div className="h-60 skeleton rounded-md" /> : categories ? <CategoryPieChart data={categories} /> : null}
          </CardContent>
        </Card>
      </div>

      {/* Agent bar chart */}
      <Card>
        <CardHeader><CardTitle>Agent Resolved Tickets</CardTitle></CardHeader>
        <CardContent>
          {agentsLoading ? (
            <div className="h-48 skeleton rounded-md" />
          ) : agents ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={agents} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="agentName" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '6px', fontSize: '12px' }}
                />
                <Bar dataKey="resolved" name="Resolved" fill="hsl(221,83%,53%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
