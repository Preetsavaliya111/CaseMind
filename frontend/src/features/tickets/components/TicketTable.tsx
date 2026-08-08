import { type ColumnDef } from '@tanstack/react-table'
import { useNavigate } from 'react-router-dom'
import { DataTable } from '@/components/tables'
import { PriorityBadge, StatusBadge } from '@/components/common'
import { formatRelative } from '@/utils'
import type { Ticket } from '@/types'

const columns: ColumnDef<Ticket, unknown>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    cell: ({ getValue }) => (
      <span className="font-mono text-xs text-muted-foreground">{getValue() as string}</span>
    ),
    size: 100,
  },
  {
    accessorKey: 'title',
    header: 'Title',
    cell: ({ row }) => (
      <div>
        <p className="font-medium line-clamp-1">{row.original.title}</p>
        {row.original.slaBreached && (
          <span className="text-2xs text-red-600 dark:text-red-400 font-medium">SLA Breached</span>
        )}
      </div>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ getValue }) => <StatusBadge status={getValue() as Ticket['status']} />,
    size: 140,
  },
  {
    accessorKey: 'priority',
    header: 'Priority',
    cell: ({ getValue }) => <PriorityBadge priority={getValue() as Ticket['priority']} />,
    size: 100,
  },
  {
    accessorKey: 'assigneeName',
    header: 'Assignee',
    cell: ({ getValue }) => (
      <span className="text-muted-foreground">{(getValue() as string | undefined) ?? '—'}</span>
    ),
    size: 140,
  },
  {
    accessorKey: 'createdAt',
    header: 'Created',
    cell: ({ getValue }) => (
      <span className="text-xs text-muted-foreground">{formatRelative(getValue() as string)}</span>
    ),
    size: 120,
  },
]

interface TicketTableProps {
  tickets: Ticket[]
  globalFilter?: string
  selectable?: boolean
}

export function TicketTable({ tickets, globalFilter, selectable }: TicketTableProps) {
  const navigate = useNavigate()
  return (
    <DataTable
      data={tickets}
      columns={columns}
      globalFilter={globalFilter}
      selectable={selectable}
      onRowClick={(ticket) => navigate(`/tickets/${ticket.id}`)}
      emptyMessage="No tickets match your filters."
    />
  )
}
