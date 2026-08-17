import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, AlertTriangle, CheckCircle2, Play,
  RotateCcw, Trash2, Tag, MessageSquare, ShieldCheck
} from 'lucide-react'
import {
  Button, Badge, Card, CardContent, CardHeader, CardTitle, Skeleton,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui'
import { PriorityBadge, StatusBadge, SLABadge } from '@/components/common'
import { AIAnalysisPanel } from '@/features/tickets/components/AIAnalysisPanel'
import { TicketCommentThread } from '@/features/tickets/components/TicketCommentThread'
import { useTicket, useUpdateTicketStatus, useAddComment, useDeleteTicket } from '@/features/tickets/hooks/useTickets'
import { useAuth } from '@/app/providers'
import { usePermission } from '@/permissions'
import { formatDateTime } from '@/utils'
import type { TicketStatus } from '@/types'

export function TicketDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const canDelete = usePermission('tickets.delete')
  const canChangeStatus = usePermission('tickets.changeStatus')

  const [deleteOpen, setDeleteOpen] = useState(false)


  const { data: ticket, isLoading, isError } = useTicket(id ?? '')
  const { mutate: updateStatus, isPending: isUpdatingStatus } = useUpdateTicketStatus()
  const { mutateAsync: addComment } = useAddComment()
  const { mutate: deleteTicket, isPending: isDeleting } = useDeleteTicket()

  if (isLoading) {
    return (
      <div className="p-6 space-y-4 max-w-6xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-72 w-full rounded-xl" />
          </div>
          <Skeleton className="h-80 w-full rounded-xl" />
        </div>
      </div>
    )
  }

  if (isError || !ticket) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[400px] text-center">
        <AlertTriangle className="h-10 w-10 text-destructive mb-3" />
        <p className="font-semibold text-lg">Ticket not found</p>
        <p className="text-sm text-muted-foreground mt-1">Ticket {id} does not exist or has been deleted.</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate('/tickets')}>
          Back to Tickets
        </Button>
      </div>
    )
  }

  const handleStatusChange = (newStatus: TicketStatus) => {
    if (!ticket) return
    updateStatus({ id: ticket.id, status: newStatus })
  }

  const handleAddComment = async (content: string, isInternal: boolean) => {
    if (!ticket) return
    await addComment({
      ticketId: ticket.id,
      content,
      isInternal,
      authorName: user?.name ?? 'Agent',
    })
  }

  const handleDelete = () => {
    if (!ticket) return
    deleteTicket(ticket.id, {
      onSuccess: () => {
        setDeleteOpen(false)
        navigate('/tickets')
      },
    })
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in max-w-6xl mx-auto">
      {/* Top Bar with Navigation & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/tickets')}
            aria-label="Back to tickets"
            className="rounded-full h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-muted-foreground px-2 py-0.5 bg-muted rounded">
              {ticket.id}
            </span>
            <SLABadge state={ticket.slaState} breached={ticket.slaBreached} />
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {canChangeStatus && (
            <>
              {ticket.status !== 'in_progress' && ticket.status !== 'resolved' && ticket.status !== 'closed' && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs gap-1.5"
                  onClick={() => handleStatusChange('in_progress')}
                  disabled={isUpdatingStatus}
                >
                  <Play className="h-3 w-3 text-amber-500" />
                  Start Progress
                </Button>
              )}

              {ticket.status !== 'resolved' && (
                <Button
                  size="sm"
                  className="h-8 text-xs gap-1.5 bg-success hover:bg-success/90 text-white"
                  onClick={() => handleStatusChange('resolved')}
                  disabled={isUpdatingStatus}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Resolve Ticket
                </Button>
              )}

              {ticket.status === 'resolved' && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs gap-1.5"
                  onClick={() => handleStatusChange('reopened')}
                  disabled={isUpdatingStatus}
                >
                  <RotateCcw className="h-3.5 w-3.5 text-warning" />
                  Reopen
                </Button>
              )}
            </>
          )}

          {canDelete && (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 text-xs text-destructive hover:bg-destructive/10"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Title & Metadata Badges */}
      <div className="space-y-2">
        <h1 className="text-xl md:text-2xl font-bold font-display tracking-tight text-foreground">
          {ticket.title}
        </h1>
        <div className="flex items-center gap-2.5 flex-wrap text-xs text-muted-foreground">
          <StatusBadge status={ticket.status} />
          <PriorityBadge priority={ticket.priority} />
          <span className="capitalize px-2 py-0.5 rounded bg-muted font-mono text-2xs">
            {ticket.category.replace('_', ' ')}
          </span>
          <span>·</span>
          <span>Created {formatDateTime(ticket.createdAt)}</span>
          {ticket.resolvedAt && (
            <>
              <span>·</span>
              <span className="text-success font-medium">Resolved {formatDateTime(ticket.resolvedAt)}</span>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ticket Description */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {ticket.description}
              </p>
            </CardContent>
          </Card>

          {/* AI Analysis + Flagship Org Memory Component */}
          <AIAnalysisPanel
            ticket={ticket}
            onApplyResolution={(resolution) => {
              handleAddComment(`[AI Suggested Action Applied]: ${resolution}`, true)
            }}
          />

          {/* Comments & Internal Thread */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                Activity & Conversation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TicketCommentThread
                comments={ticket.comments}
                onAddComment={handleAddComment}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar (1 Col) */}
        <div className="space-y-4">
          {/* Metadata Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Ticket Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3.5 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-border/50">
                <span className="text-muted-foreground">Assignee</span>
                <span className="font-medium text-foreground">{ticket.assigneeName ?? 'Unassigned'}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-border/50">
                <span className="text-muted-foreground">Reporter</span>
                <span className="font-medium text-foreground">{ticket.reporterName}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-border/50">
                <span className="text-muted-foreground">Category</span>
                <span className="font-medium capitalize text-foreground">{ticket.category.replace('_', ' ')}</span>
              </div>

              {ticket.slaDeadline && (
                <div className="flex justify-between items-center py-1 border-b border-border/50">
                  <span className="text-muted-foreground">SLA Target</span>
                  <span className={ticket.slaBreached ? 'text-destructive font-semibold' : 'font-medium text-foreground'}>
                    {formatDateTime(ticket.slaDeadline)}
                  </span>
                </div>
              )}

              {ticket.tags.length > 0 && (
                <div className="pt-1">
                  <p className="text-muted-foreground mb-2 flex items-center gap-1">
                    <Tag className="h-3 w-3" /> Tags
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {ticket.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-2xs font-mono">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Access to Org Memory */}
          <Card className="border-purple-500/20 bg-purple-950/10">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2 text-purple-400 text-xs font-semibold">
                <ShieldCheck className="h-4 w-4" />
                Organizational Precedent
              </div>
              <p className="text-2xs text-muted-foreground leading-relaxed">
                Check historical resolution patterns and linked runbooks in the Memory Engine.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs h-7 border-purple-500/30 text-purple-300 hover:bg-purple-500/10"
                onClick={() => navigate('/memory')}
              >
                Browse Memory Patterns
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Permanently Delete Ticket
            </DialogTitle>
            <DialogDescription className="pt-2 text-xs text-muted-foreground">
              Are you sure you want to delete <span className="font-semibold text-foreground">{ticket.id}</span> ({ticket.title})? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" size="sm" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDelete} loading={isDeleting}>
              Delete Ticket
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
