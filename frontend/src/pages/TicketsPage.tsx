import { useState } from 'react'
import { Plus, Search, Filter } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button, Input, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SkeletonTable } from '@/components/ui'
import { PriorityBadge, StatusBadge, EmptyState } from '@/components/common'
import { useTickets } from '@/features/tickets/hooks/useTickets'
import { formatRelative } from '@/utils'
import type { TicketStatus, TicketPriority } from '@/types'

export function TicketsPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<string>('')
  const [priority, setPriority] = useState<string>('')

  const { data, isLoading } = useTickets({
    search: search || undefined,
    status: (status as TicketStatus) || undefined,
    priority: (priority as TicketPriority) || undefined,
  })

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-1 gap-2 max-w-xl">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Input
              placeholder="Search tickets…"
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search tickets"
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-36" aria-label="Filter by status">
              <Filter className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Statuses</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="assigned">Assigned</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger className="w-36" aria-label="Filter by priority">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Priorities</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" onClick={() => navigate('/tickets/new')}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          New Ticket
        </Button>
      </div>

      {/* Table */}
      {isLoading ? (
        <SkeletonTable rows={6} />
      ) : !data?.data.length ? (
        <EmptyState
          title="No tickets found"
          description="No tickets match your current filters."
          action={{ label: 'Clear filters', onClick: () => { setSearch(''); setStatus(''); setPriority('') } }}
        />
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium">ID</th>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Priority</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Assignee</th>
                <th className="px-4 py-3 font-medium hidden lg:table-cell">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y bg-background">
              {data.data.map((ticket) => (
                <tr
                  key={ticket.id}
                  className="hover:bg-muted/30 cursor-pointer transition-colors"
                  onClick={() => navigate(`/tickets/${ticket.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && navigate(`/tickets/${ticket.id}`)}
                  aria-label={`View ticket ${ticket.id}: ${ticket.title}`}
                >
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{ticket.id}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium line-clamp-1">{ticket.title}</div>
                    {ticket.slaBreached && (
                      <span className="text-2xs text-red-600 dark:text-red-400 font-medium">SLA Breached</span>
                    )}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={ticket.status} /></td>
                  <td className="px-4 py-3"><PriorityBadge priority={ticket.priority} /></td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                    {ticket.assigneeName ?? '—'}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground text-xs">
                    {formatRelative(ticket.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t bg-muted/20 text-xs text-muted-foreground">
            Showing {data.data.length} of {data.total} tickets
          </div>
        </div>
      )}
    </div>
  )
}
