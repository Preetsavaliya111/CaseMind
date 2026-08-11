import { Ticket, CheckCircle, Clock, AlertTriangle, Users, Brain, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, SkeletonCard } from '@/components/ui'
import { StatCard, EmptyState } from '@/components/common'
import { TicketTrendChart, CategoryPieChart } from '@/components/charts'
import { useDashboardMetrics, useTicketTrends, useCategoryDistribution, useAgentPerformance } from '@/features/dashboard/hooks/useDashboard'

export function DashboardPage() {
  const { data: metrics, isLoading: metricsLoading } = useDashboardMetrics()
  const { data: trends, isLoading: trendsLoading } = useTicketTrends()
  const { data: categories, isLoading: categoriesLoading } = useCategoryDistribution()
  const { data: agents } = useAgentPerformance()

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricsLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : metrics ? (
          <>
            <StatCard title="Open Tickets" value={metrics.openTickets} icon={Ticket} trend={{ value: -8.2, label: 'vs last week' }} />
            <StatCard title="Resolved Today" value={metrics.resolvedToday} icon={CheckCircle} trend={{ value: 12.5, label: 'vs yesterday' }} iconClassName="bg-emerald-100 dark:bg-emerald-900/30" />
            <StatCard title="Avg Resolution" value={`${metrics.avgResolutionTime}h`} icon={Clock} trend={{ value: -5.1, label: 'vs last week' }} iconClassName="bg-amber-100 dark:bg-amber-900/30" />
            <StatCard title="SLA Breach Rate" value={`${metrics.slaBreachRate}%`} icon={AlertTriangle} trend={{ value: -1.2, label: 'vs last week' }} iconClassName="bg-red-100 dark:bg-red-900/30" />
          </>
        ) : null}
      </div>

      {/* Secondary metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics && (
          <>
            <StatCard title="CSAT Score" value={`${metrics.customerSatisfaction}%`} icon={TrendingUp} iconClassName="bg-purple-100 dark:bg-purple-900/30" />
            <StatCard title="AI Acceptance" value={`${metrics.aiAcceptanceRate}%`} icon={Brain} iconClassName="bg-blue-100 dark:bg-blue-900/30" />
            <StatCard title="FCR Rate" value={`${metrics.firstContactResolution}%`} icon={CheckCircle} iconClassName="bg-teal-100 dark:bg-teal-900/30" />
            <StatCard title="Total Tickets" value={metrics.totalTickets.toLocaleString()} icon={Ticket} />
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Ticket Volume Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {trendsLoading ? (
              <div className="h-60 skeleton rounded-md" />
            ) : trends ? (
              <TicketTrendChart data={trends} />
            ) : (
              <EmptyState title="No trend data" description="Trend data will appear here." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Category Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {categoriesLoading ? (
              <div className="h-60 skeleton rounded-md" />
            ) : categories ? (
              <CategoryPieChart data={categories} />
            ) : (
              <EmptyState title="No data" description="Category data will appear here." />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Agent Performance */}
      {agents && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4" aria-hidden="true" />
              Agent Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 font-medium">Agent</th>
                    <th className="pb-3 font-medium text-right">Resolved</th>
                    <th className="pb-3 font-medium text-right">Avg Time</th>
                    <th className="pb-3 font-medium text-right">CSAT</th>
                    <th className="pb-3 font-medium text-right">SLA %</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {agents.map((agent) => (
                    <tr key={agent.agentId} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 font-medium">{agent.agentName}</td>
                      <td className="py-3 text-right">{agent.resolved}</td>
                      <td className="py-3 text-right">{agent.avgResolutionTime}h</td>
                      <td className="py-3 text-right text-emerald-600 dark:text-emerald-400">{agent.csat}%</td>
                      <td className="py-3 text-right">{agent.slaCompliance}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
