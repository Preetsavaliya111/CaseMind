import {
  Ticket, CheckCircle2, Clock, Star, Database, ShieldAlert, Sparkles, ArrowRight,
  TrendingUp, TrendingDown
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle, SkeletonCard, Button, Badge } from '@/components/ui'
import { StatCard, EmptyState, PriorityBadge, SLABadge } from '@/components/common'
import { TicketTrendChart } from '@/components/charts'
import {
  useDashboardMetrics,
  useTicketTrends,
  useAgentPerformance,
  useMyPerformance,
} from '@/features/dashboard/hooks/useDashboard'
import { useTickets } from '@/features/tickets/hooks/useTickets'
import { useAuth } from '@/app/providers'
import { useNavigate } from 'react-router-dom'


export function DashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const role = user?.role ?? ''

  const { data: metrics, isLoading: metricsLoading } = useDashboardMetrics()
  const { data: trends, isLoading: trendsLoading } = useTicketTrends()
  const { data: agents } = useAgentPerformance()
  const { data: myPerf } = useMyPerformance()
  const { data: ticketsData } = useTickets()

  const showPersonalStrip = role === 'agent' || role === 'cs'
  const showAgentTable = role === 'admin' || role === 'manager' || role === 'engineer'

  // Critical & At-Risk tickets
  const criticalTickets = ticketsData?.data.filter(
    (t) => t.priority === 'critical' || t.slaBreached || t.slaState === 'at_risk'
  ).slice(0, 3) ?? []

  // Sample sparklines for KPI cards
  const openSparkline = [
    { date: '1', value: 95 }, { date: '2', value: 92 }, { date: '3', value: 89 },
    { date: '4', value: 91 }, { date: '5', value: 88 }, { date: '6', value: 87 }
  ]
  const resolvedSparkline = [
    { date: '1', value: 20 }, { date: '2', value: 24 }, { date: '3', value: 28 },
    { date: '4', value: 22 }, { date: '5', value: 31 }, { date: '6', value: 34 }
  ]
  const csatSparkline = [
    { date: '1', value: 92 }, { date: '2', value: 93 }, { date: '3', value: 93.5 },
    { date: '4', value: 94 }, { date: '5', value: 94.2 }
  ]

  return (
    <div className="p-6 space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Critical SLA Breach Urgent Attention Banner */}
      {criticalTickets.length > 0 && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/[0.04] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-destructive font-semibold text-sm">
              <ShieldAlert className="h-4 w-4" />
              <span>{criticalTickets.length} Incident(s) Requiring Immediate Attention (Critical / SLA At Risk)</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs border-destructive/30 text-destructive hover:bg-destructive/10"
              onClick={() => navigate('/tickets')}
            >
              View All in Queue
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            {criticalTickets.map((t) => (
              <div
                key={t.id}
                onClick={() => navigate(`/tickets/${t.id}`)}
                className="flex items-start justify-between p-3 rounded-xl border bg-card hover:border-destructive/40 transition-colors cursor-pointer group"
              >
                <div className="space-y-1 min-w-0 pr-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-2xs font-semibold text-primary">{t.id}</span>
                    <SLABadge state={t.slaState} breached={t.slaBreached} />
                  </div>
                  <p className="text-xs font-semibold text-foreground truncate group-hover:text-destructive transition-colors">
                    {t.title}
                  </p>
                  <p className="text-2xs text-muted-foreground">{t.reporterName} · {t.assigneeName ?? 'Unassigned'}</p>
                </div>
                <PriorityBadge priority={t.priority} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Operational KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricsLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : metrics ? (
          <>
            <StatCard
              title="Open Support Tickets"
              value={metrics.openTickets}
              icon={Ticket}
              trend={{ value: -8.2, label: 'vs last week', isPositiveGood: true }}
              sparkline={openSparkline}
            />
            <StatCard
              title="Resolved Today (Reused)"
              value={metrics.resolvedToday}
              icon={CheckCircle2}
              trend={{ value: 14.5, label: 'vs yesterday', isPositiveGood: true }}
              iconClassName="bg-success/10"
              sparkline={resolvedSparkline}
              description={`↑ ${metrics.resolvedToday} added to Organizational Memory`}
            />
            <StatCard
              title="Avg Resolution Time"
              value={`${metrics.avgResolutionTime}h`}
              icon={Clock}
              trend={{ value: -12.4, label: 'vs last week', isPositiveGood: true }}
              iconClassName="bg-warning/10"
            />
            <StatCard
              title="Customer CSAT Score"
              value={`${metrics.customerSatisfaction}%`}
              icon={Star}
              trend={{ value: 2.1, label: 'vs target (92%)', isPositiveGood: true }}
              iconClassName="bg-purple-500/10"
              sparkline={csatSparkline}
            />
          </>
        ) : null}
      </div>

      {/* Charts & Memory Activity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 7-Day Trend Chart */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="font-display tracking-display text-sm font-semibold">
                Ticket Inflow vs Resolution Throughput
              </CardTitle>
              <Badge variant="secondary" className="text-2xs font-mono">Last 7 Days</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {trendsLoading ? (
              <div className="h-64 skeleton rounded-xl" />
            ) : trends ? (
              <TicketTrendChart data={trends} />
            ) : (
              <EmptyState title="No trend data" description="Trend data will appear here." />
            )}
          </CardContent>
        </Card>

        {/* Organizational Memory Status Card */}
        <Card className="border-purple-500/20 bg-purple-950/[0.06] shadow-sm flex flex-col justify-between">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="font-display tracking-display text-sm font-semibold text-purple-400 flex items-center gap-2">
                <Database className="h-4 w-4" />
                Organizational Memory
              </CardTitle>
              <Badge variant="default" className="text-2xs bg-purple-500/20 text-purple-300 border-purple-500/30">
                Active Engine
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="space-y-2">
              <p className="text-muted-foreground leading-relaxed">
                Institutional knowledge synthesized from every resolved support incident.
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="p-2.5 rounded-xl bg-card border text-center">
                  <p className="text-2xs text-muted-foreground">Solutions Synthesized</p>
                  <p className="text-lg font-bold font-mono text-foreground mt-0.5">142</p>
                </div>
                <div className="p-2.5 rounded-xl bg-card border text-center">
                  <p className="text-2xs text-muted-foreground">Reused This Week</p>
                  <p className="text-lg font-bold font-mono text-purple-400 mt-0.5">88</p>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-card border space-y-1.5">
              <p className="text-2xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-purple-400" /> Top Reused Solution
              </p>
              <p className="font-medium text-foreground">Payment Gateway Pool Exhaustion</p>
              <p className="text-2xs text-success font-medium">94% resolution success · 2.1h avg time</p>
            </div>

            <Button
              className="w-full text-xs h-8 bg-purple-600 hover:bg-purple-700 text-white"
              onClick={() => navigate('/memory')}
            >
              Open Memory Library
              <ArrowRight className="h-3 w-3 ml-1.5" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Personal Strip for Agents / CS */}
      {showPersonalStrip && myPerf && (
        <Card className="border-primary/20 bg-primary/[0.02] shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="font-display tracking-display text-sm flex items-center gap-2 text-primary">
              <Star className="h-4 w-4" aria-hidden="true" />
              My Personal Performance & Throughput ({user?.name})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              {[
                { label: 'Resolved This Week', value: myPerf.resolvedThisWeek },
                { label: 'Resolved This Month', value: myPerf.resolvedThisMonth },
                {
                  label: 'Personal CSAT',
                  value: `${myPerf.csat}%`,
                  trend: myPerf.csatTrend,
                },
                { label: 'SLA Compliance Rate', value: `${myPerf.slaCompliance}%` },
              ].map(({ label, value, trend }) => (
                <div key={label} className="p-3 rounded-xl bg-card border space-y-1">
                  <p className="text-2xs text-muted-foreground">{label}</p>
                  <p className="font-display text-xl font-bold tracking-tight font-mono">{value}</p>
                  {trend !== undefined && (
                    <p className={`text-2xs flex items-center gap-0.5 ${trend >= 0 ? 'text-success' : 'text-danger'}`}>
                      {trend >= 0
                        ? <TrendingUp className="h-3 w-3" aria-hidden="true" />
                        : <TrendingDown className="h-3 w-3" aria-hidden="true" />
                      }
                      {Math.abs(trend)}% vs last month
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team Performance Table for Managers / Admins */}
      {showAgentTable && agents && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="font-display tracking-display text-sm font-semibold">
                Support Team Benchmarks & Resolution Velocity
              </CardTitle>
              <Button variant="ghost" size="sm" className="h-7 text-xs text-primary" onClick={() => navigate('/analytics')}>
                Full Analytics Report
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground text-xs font-medium bg-muted/30">
                    <th scope="col" className="px-4 py-2.5">Agent</th>
                    <th scope="col" className="px-4 py-2.5 text-right">Resolved</th>
                    <th scope="col" className="px-4 py-2.5 text-right">Avg Time</th>
                    <th scope="col" className="px-4 py-2.5 text-right">CSAT</th>
                    <th scope="col" className="px-4 py-2.5 text-right">SLA Compliance</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {agents.map((agent) => (
                    <tr key={agent.agentId} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground">{agent.agentName}</td>
                      <td className="px-4 py-3 text-right font-mono text-xs font-semibold">{agent.resolved}</td>
                      <td className="px-4 py-3 text-right font-mono text-xs">{agent.avgResolutionTime}h</td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-success font-semibold">{agent.csat}%</td>
                      <td className="px-4 py-3 text-right font-mono text-xs">{agent.slaCompliance}%</td>
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
