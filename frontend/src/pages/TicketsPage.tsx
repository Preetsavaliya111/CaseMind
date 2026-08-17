import { useState, useMemo } from 'react'
import {
  Plus, Search, X, Trash2, AlertTriangle,
  ArrowUpDown, ChevronLeft, ChevronRight
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  Button, Input,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
  SkeletonTable,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui'
import { PriorityBadge, StatusBadge, SLABadge, EmptyState } from '@/components/common'
import { useTickets, useDeleteTicket } from '@/features/tickets/hooks/useTickets'
import { usePermission } from '@/permissions'
import { useDebounce } from '@/hooks'
import { formatRelative } from '@/utils'
import type { Ticket, TicketPriority } from '@/types'

type SortField = 'id' | 'title' | 'status' | 'priority' | 'createdAt'
type SortOrder = 'asc' | 'desc'

export function TicketsPage() {
  const navigate = useNavigate()
  const canDelete = usePermission('tickets.delete')
  const canCreate = usePermission('tickets.create')


  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<string>('all')
  const [priority, setPriority] = useState<string>('all')
  const [slaFilter, setSlaFilter] = useState<string>('all')
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [page, setPage] = useState(1)
  const pageSize = 10

  const [deleteTarget, setDeleteTarget] = useState<Ticket | null>(null)

  const debouncedSearch = useDebounce(search, 300)

  const { data: allData, isLoading } = useTickets({})
  const { mutate: deleteTicket, isPending: isDeleting } = useDeleteTicket()

  // Filter & Sort
  const processedTickets = useMemo(() => {
    if (!allData?.data) return []
    let list = [...allData.data]

    // Search
    const q = debouncedSearch.toLowerCase().trim()
    if (q) {
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.id.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.reporterName.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.toLowerCase().includes(q)),
      )
    }

    // Status filter
    if (status !== 'all') {
      list = list.filter((t) => t.status === status)
    }

    // Priority filter
    if (priority !== 'all') {
      list = list.filter((t) => t.priority === priority)
    }

    // SLA filter
    if (slaFilter === 'breached') {
      list = list.filter((t) => t.slaBreached)
    } else if (slaFilter === 'at_risk') {
      list = list.filter((t) => t.slaState === 'at_risk')
    }

    // Sort
    list.sort((a, b) => {
      let comp = 0
      if (sortField === 'id') comp = a.id.localeCompare(b.id)
      else if (sortField === 'title') comp = a.title.localeCompare(b.title)
      else if (sortField === 'status') comp = a.status.localeCompare(b.status)
      else if (sortField === 'priority') {
        const pOrder: Record<TicketPriority, number> = { critical: 4, high: 3, medium: 2, low: 1 }
        comp = pOrder[a.priority] - pOrder[b.priority]
      } else if (sortField === 'createdAt') {
        comp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      }
      return sortOrder === 'asc' ? comp : -comp
    })

    return list
  }, [allData, debouncedSearch, status, priority, slaFilter, sortField, sortOrder])

  // Pagination calculation
  const totalCount = processedTickets.length
  const totalPages = Math.ceil(totalCount / pageSize) || 1
  const paginatedTickets = useMemo(() => {
    const start = (page - 1) * pageSize
    return processedTickets.slice(start, start + pageSize)
  }, [processedTickets, page, pageSize])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return
    deleteTicket(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    })
  }

  const clearFilters = () => {
    setSearch('')
    setStatus('all')
    setPriority('all')
    setSlaFilter('all')
    setPage(1)
  }

  return (
    <div className="p-6 space-y-4 animate-fade-in max-w-7xl mx-auto">
      {/* Header & New Ticket Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight text-foreground">
            Support Tickets
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Monitor, triage, and resolve customer support incidents across your organization.
          </p>
        </div>

        {canCreate && (
          <Button size="sm" onClick={() => navigate('/tickets/new')} className="gap-1.5 shrink-0">
            <Plus className="h-4 w-4" aria-hidden="true" />
            New Ticket
          </Button>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="p-3 rounded-xl border bg-card/60 backdrop-blur space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
            <Input
              placeholder="Search by title, ID, reporter, tags…"
              className="pl-8 pr-8 text-xs h-9"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              aria-label="Search tickets"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Select value={status} onValueChange={(val) => { setStatus(val); setPage(1); }}>
              <SelectTrigger className="w-32 text-xs h-9">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="waiting_customer">Waiting Cust.</SelectItem>
                <SelectItem value="waiting_engineering">Waiting Eng.</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priority} onValueChange={(val) => { setPriority(val); setPage(1); }}>
              <SelectTrigger className="w-32 text-xs h-9">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select value={slaFilter} onValueChange={(val) => { setSlaFilter(val); setPage(1); }}>
              <SelectTrigger className="w-32 text-xs h-9">
                <SelectValue placeholder="SLA State" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All SLA</SelectItem>
                <SelectItem value="breached">Breached Only</SelectItem>
                <SelectItem value="at_risk">At Risk Only</SelectItem>
              </SelectContent>
            </Select>

            {(status !== 'all' || priority !== 'all' || slaFilter !== 'all' || search) && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs h-9 px-2 text-muted-foreground">
                Reset
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Ticket Table */}
      {isLoading ? (
        <SkeletonTable rows={8} />
      ) : !paginatedTickets.length ? (
        <EmptyState
          title="No tickets match your filters"
          description="Try broadening your search or resetting active filters."
          action={{ label: 'Clear all filters', onClick: clearFilters }}
        />
      ) : (
        <div className="rounded-xl border overflow-hidden bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 border-b">
                <tr className="text-left text-muted-foreground text-xs font-medium">
                  <th scope="col" className="px-4 py-3 cursor-pointer select-none" onClick={() => handleSort('id')}>
                    <div className="flex items-center gap-1">
                      <span>ID</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th scope="col" className="px-4 py-3 cursor-pointer select-none" onClick={() => handleSort('title')}>
                    <div className="flex items-center gap-1">
                      <span>Title & Topic</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th scope="col" className="px-4 py-3 cursor-pointer select-none" onClick={() => handleSort('status')}>
                    <div className="flex items-center gap-1">
                      <span>Status</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th scope="col" className="px-4 py-3 cursor-pointer select-none" onClick={() => handleSort('priority')}>
                    <div className="flex items-center gap-1">
                      <span>Priority</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th scope="col" className="px-4 py-3">SLA Status</th>
                  <th scope="col" className="px-4 py-3 hidden md:table-cell">Assignee</th>
                  <th scope="col" className="px-4 py-3 cursor-pointer select-none hidden lg:table-cell" onClick={() => handleSort('createdAt')}>
                    <div className="flex items-center gap-1">
                      <span>Created</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  {canDelete && (
                    <th scope="col" className="px-4 py-3 w-16 text-center">Action</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {paginatedTickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="hover:bg-muted/30 transition-colors group cursor-pointer"
                    onClick={() => navigate(`/tickets/${ticket.id}`)}
                  >
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-primary">
                      {ticket.id}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                        {ticket.title}
                      </div>
                      <div className="text-2xs text-muted-foreground flex items-center gap-2 mt-0.5">
                        <span>{ticket.reporterName}</span>
                        <span>·</span>
                        <span className="capitalize">{ticket.category.replace('_', ' ')}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={ticket.status} />
                    </td>
                    <td className="px-4 py-3">
                      <PriorityBadge priority={ticket.priority} />
                    </td>
                    <td className="px-4 py-3">
                      <SLABadge state={ticket.slaState} breached={ticket.slaBreached} />
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-xs text-muted-foreground">
                      {ticket.assigneeName ?? <span className="italic text-muted-foreground/60">Unassigned</span>}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-xs text-muted-foreground">
                      {formatRelative(ticket.createdAt)}
                    </td>

                    {/* Delete action button */}
                    {canDelete && (
                      <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setDeleteTarget(ticket)}
                          className="inline-flex items-center justify-center h-7 w-7 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                          aria-label={`Delete ticket ${ticket.id}`}
                          title="Delete ticket"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="px-4 py-3 border-t bg-muted/20 text-xs text-muted-foreground flex items-center justify-between">
            <span>
              Showing <strong className="text-foreground">{(page - 1) * pageSize + 1}</strong> to{' '}
              <strong className="text-foreground">{Math.min(page * pageSize, totalCount)}</strong> of{' '}
              <strong className="text-foreground">{totalCount}</strong> tickets
            </span>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs px-2"
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page <= 1}
              >
                <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                Previous
              </Button>
              <span className="font-mono text-2xs px-2">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs px-2"
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page >= totalPages}
              >
                Next
                <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
              Delete Ticket
            </DialogTitle>
            <DialogDescription className="pt-1 text-xs">
              Are you sure you want to permanently delete ticket <strong className="text-foreground">{deleteTarget?.id}</strong>? This action cannot be reversed.
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end gap-2 pt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteConfirm}
              loading={isDeleting}
            >
              Delete Ticket
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
