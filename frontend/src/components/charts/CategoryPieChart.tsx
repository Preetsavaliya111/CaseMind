import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { CategoryDistribution } from '@/types'

const COLORS = [
  'hsl(221,83%,53%)',
  'hsl(160,84%,39%)',
  'hsl(38,92%,50%)',
  'hsl(280,65%,60%)',
  'hsl(0,84%,60%)',
  'hsl(200,80%,50%)',
]

interface CategoryPieChartProps {
  data: CategoryDistribution[]
}

export function CategoryPieChart({ data }: CategoryPieChartProps) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={3}
          dataKey="count"
          nameKey="category"
        >
          {data.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: 'hsl(var(--popover))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '6px',
            fontSize: '12px',
          }}
          formatter={(value: number, name: string) => [`${value} tickets`, name]}
        />
        <Legend wrapperStyle={{ fontSize: '12px' }} />
      </PieChart>
    </ResponsiveContainer>
  )
}
