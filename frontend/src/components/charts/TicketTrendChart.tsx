import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'
import type { TicketTrend } from '@/types'
import { formatDate } from '@/utils'

interface TicketTrendChartProps {
  data: TicketTrend[]
}

export function TicketTrendChart({ data }: TicketTrendChartProps) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(221,83%,53%)" stopOpacity={0.15} />
            <stop offset="95%" stopColor="hsl(221,83%,53%)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(160,84%,39%)" stopOpacity={0.15} />
            <stop offset="95%" stopColor="hsl(160,84%,39%)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey="date"
          tickFormatter={(v) => formatDate(v, 'MMM d')}
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{
            background: 'hsl(var(--popover))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '6px',
            fontSize: '12px',
          }}
          labelFormatter={(v) => formatDate(v as string, 'MMM d, yyyy')}
        />
        <Legend wrapperStyle={{ fontSize: '12px' }} />
        <Area type="monotone" dataKey="created" name="Created" stroke="hsl(221,83%,53%)" fill="url(#colorCreated)" strokeWidth={2} dot={false} />
        <Area type="monotone" dataKey="resolved" name="Resolved" stroke="hsl(160,84%,39%)" fill="url(#colorResolved)" strokeWidth={2} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  )
}
