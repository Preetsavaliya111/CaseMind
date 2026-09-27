import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, AlertTriangle, CheckCircle2, Pencil, Play,
  RotateCcw, Trash2, Tag, MessageSquare, ShieldCheck, Flame, Clock, Paperclip, Download, Upload
} from 'lucide-react'
import {
  Button, Badge, Card, CardContent, CardHeader, CardTitle, Input, Skeleton, Textarea,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui'
import { PriorityBadge, StatusBadge, SLABadge } from '@/components/common'
import { AIAnalysisPanel } from '@/features/tickets/components/AIAnalysisPanel'
import { TicketCommentThread } from '@/features/tickets/components/TicketCommentThread'
import { useTicket, useUpdateTicket, useUpdateTicketStatus, useAddComment, useCaseAssignees, useDeleteTicket, useEscalateTicket, useUploadCaseAttachment, useDeleteCaseAttachment } from '@/features/tickets/hooks/useTickets'
import { ticketService } from '@/features/tickets/services/ticketService'
import { useAuth } from '@/app/providers'
import { hasApiPermission, usePermission } from '@/permissions'
import { formatDateTime } from '@/utils'
import type { TicketCategory, TicketPriority, TicketStatus } from '@/types'

export function TicketDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const canDelete = usePermission('tickets.delete')
  const canEdit = usePermission('tickets.edit')
  const canChangeStatus = usePermission('tickets.changeStatus')
  const canEscalate = hasApiPermission(user, 'ticket.escalate')
  const canAssign = hasApiPermission(user, 'ticket.assign') || hasApiPermission(user, 'ticket.reassign')

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [escalateOpen, setEscalateOpen] = useState(false)
  const [escalationReason, setEscalationReason] = useState('')
  const [escalationError, setEscalationError] = useState('')
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null)
  const [editDraft, setEditDraft] = useState({ title: '', description: '', priority: 'medium' as TicketPriority, category: 'other' as TicketCategory, assigneeId: 'unassigned', tags: '' })
  const [editErrors, setEditErrors] = useState<{ title?: string; description?: string; form?: string }>({})


  const { data: ticket, isLoading, isError } = useTicket(id ?? '')
  const { data: assignees = [], isError: assigneesFailed } = useCaseAssignees(canAssign)
  const { mutateAsync: updateTicket, isPending: isUpdating } = useUpdateTicket()
  const { mutate: updateStatus, isPending: isUpdatingStatus } = useUpdateTicketStatus()
  const { mutateAsync: addComment } = useAddComment()
  const { mutate: deleteTicket, isPending: isDeleting } = useDeleteTicket()
  const { mutateAsync: escalateTicket, isPending: isEscalating } = useEscalateTicket()
  const { mutateAsync: uploadAttachment, isPending: isUploadingAttachment } = useUploadCaseAttachment()
  const { mutate: deleteAttachment, isPending: isDeletingAttachment } = useDeleteCaseAttachment()

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
        <p className="font-semibold text-lg">Case not found</p>
        <p className="text-sm text-muted-foreground mt-1">Case {id} does not exist or has been archived.</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate('/tickets')}>
          Back to cases
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

  const openEdit = () => {
    if (!ticket) return
    setEditDraft({ title: ticket.title, description: ticket.description, priority: ticket.priority, category: ticket.category, assigneeId: ticket.assigneeId ?? 'unassigned', tags: ticket.tags.join(', ') })
    setEditErrors({})
    setEditOpen(true)
  }

  const saveEdit = async () => {
    if (!ticket) return
    const title = editDraft.title.trim()
    const description = editDraft.description.trim()
    const validation = {
      title: title.length < 5 ? 'Title must be at least 5 characters.' : undefined,
      description: description.length < 20 ? 'Description must be at least 20 characters.' : undefined,
    }
    if (validation.title || validation.description) { setEditErrors(validation); return }
    setEditErrors({})
    try {
      await updateTicket({ id: ticket.id, data: { title, description, priority: editDraft.priority, category: editDraft.category, ...(canAssign ? { assigneeId: editDraft.assigneeId === 'unassigned' ? '' : editDraft.assigneeId } : {}), tags: editDraft.tags.split(',').map((tag) => tag.trim()).filter(Boolean) } })
      setEditOpen(false)
    } catch (error) {
      setEditErrors({ form: typeof error === 'object' && error && 'message' in error ? String(error.message) : 'The case could not be updated.' })
    }
  }

  const escalate = async () => {
    if (!ticket) return
    if (escalationReason.trim().length < 10) { setEscalationError('Explain the escalation reason using at least 10 characters.'); return }
    setEscalationError('')
    try {
      await escalateTicket({ id: ticket.id, reason: escalationReason.trim() })
      setEscalationReason(''); setEscalateOpen(false)
    } catch (error) {
      setEscalationError(typeof error === 'object' && error && 'message' in error ? String(error.message) : 'The case could not be escalated.')
    }
  }

  const uploadCaseAttachment = async () => {
    if (!ticket || !attachmentFile) return
    await uploadAttachment({ id: ticket.id, file: attachmentFile })
    setAttachmentFile(null)
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
            aria-label="Back to cases"
            className="rounded-full h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-muted-foreground px-2 py-0.5 bg-muted rounded">
              {ticket.caseNumber}
            </span>
            <SLABadge state={ticket.slaState} breached={ticket.slaBreached} />
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {canEscalate && ticket.status !== 'resolved' && ticket.status !== 'closed' && ticket.escalationLevel < 3 && <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setEscalateOpen(true)}><Flame className="h-3.5 w-3.5" />Escalate L{ticket.escalationLevel + 1}</Button>}
          {canEdit && <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={openEdit}><Pencil className="h-3.5 w-3.5" />Edit case</Button>}
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
                  <Play className="h-3 w-3 text-muted-foreground" />
                  Start Progress
                </Button>
              )}

              {ticket.status !== 'resolved' && (
                <Button
                  size="sm"
                  className="h-8 gap-1.5 bg-success text-xs text-primary-foreground hover:bg-success/90"
                  onClick={() => handleStatusChange('resolved')}
                  disabled={isUpdatingStatus}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Resolve case
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
              Archive
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
          {/* Case Description */}
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


          <Card>
            <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-sm"><Paperclip className="h-4 w-4 text-primary" />Attachments</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input type="file" accept=".pdf,.txt,.md,.docx,.png,.jpg,.jpeg" onChange={(event) => setAttachmentFile(event.target.files?.[0] ?? null)} className="text-xs" />
                <Button size="sm" onClick={uploadCaseAttachment} disabled={!attachmentFile} loading={isUploadingAttachment}><Upload className="h-3.5 w-3.5" />Upload</Button>
              </div>
              <p className="text-2xs text-muted-foreground">PDF, text, Markdown, DOCX, PNG, or JPEG up to 15 MB.</p>
              {ticket.attachments.length === 0 ? <p className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">No files attached to this Case.</p> : <div className="divide-y rounded-lg border">{ticket.attachments.map((attachment) => <div key={attachment.id} className="flex items-center justify-between gap-3 p-3"><div className="min-w-0"><p className="truncate text-xs font-medium">{attachment.filename}</p><p className="text-2xs text-muted-foreground">{attachment.uploadedByName} · {(attachment.sizeBytes / 1024).toFixed(1)} KB · {formatDateTime(attachment.createdAt)}</p></div><div className="flex shrink-0 gap-1"><Button variant="ghost" size="icon" aria-label={`Download ${attachment.filename}`} onClick={() => ticketService.downloadAttachment(ticket.id, attachment)}><Download className="h-3.5 w-3.5" /></Button>{(attachment.uploadedById === user?.id || canDelete) && <Button variant="ghost" size="icon" aria-label={`Remove ${attachment.filename}`} disabled={isDeletingAttachment} onClick={() => deleteAttachment({ id: ticket.id, attachmentId: attachment.id })}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>}</div></div>)}</div>}
            </CardContent>
          </Card>

          {/* AI Analysis + Flagship Org Memory Component */}
          <AIAnalysisPanel ticket={ticket} />

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
                Case information
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
              <div className="flex justify-between items-center py-1 border-b border-border/50"><span className="text-muted-foreground">Escalation</span><span className="font-medium">Level {ticket.escalationLevel}</span></div>

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

          {ticket.escalations.length > 0 && <Card><CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground"><Flame className="h-4 w-4" />Escalation history</CardTitle></CardHeader><CardContent className="space-y-3">{ticket.escalations.map((event) => <div key={event.id} className="border-l-2 border-primary/50 pl-3"><p className="text-xs font-medium">Level {event.fromLevel} → {event.toLevel}</p><p className="mt-1 text-xs text-muted-foreground">{event.reason}</p><p className="mt-1 flex items-center gap-1 text-2xs text-muted-foreground"><Clock className="h-3 w-3" />{event.actorName} · {formatDateTime(event.createdAt)}</p></div>)}</CardContent></Card>}

          {/* Quick Access to Org Memory */}
          <Card className="border-border bg-card">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <ShieldCheck className="h-4 w-4" />
                Organizational Precedent
              </div>
              <p className="text-2xs text-muted-foreground leading-relaxed">
                Review previous solutions, root causes, and linked guides in Organizational Memory.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-full border-border text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
                onClick={() => navigate('/memory')}
              >
                Browse Organizational Memory
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Archive Confirmation Modal */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Archive case
            </DialogTitle>
            <DialogDescription className="pt-2 text-xs text-muted-foreground">
              Archive <span className="font-semibold text-foreground">{ticket.caseNumber}</span> ({ticket.title})? It will be removed from active views while its record remains retained.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" size="sm" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDelete} loading={isDeleting}>
              Archive case
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={(open) => { setEditOpen(open); if (!open) setEditErrors({}) }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader className="border-b pb-4"><DialogTitle>Edit case</DialogTitle><DialogDescription>Update the case context, classification, and ownership. Changes are recorded in the audit log.</DialogDescription></DialogHeader>
          <div className="grid gap-5 py-1 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2"><label htmlFor="edit-title" className="text-sm font-medium">Title <span className="text-destructive">*</span></label><Input id="edit-title" value={editDraft.title} aria-invalid={Boolean(editErrors.title)} onChange={(event) => { setEditDraft({ ...editDraft, title: event.target.value }); setEditErrors((current) => ({ ...current, title: undefined, form: undefined })) }} />{editErrors.title && <p className="text-xs font-medium text-destructive" role="alert">{editErrors.title}</p>}</div>
            <div className="space-y-2 sm:col-span-2"><label htmlFor="edit-description" className="text-sm font-medium">Description <span className="text-destructive">*</span></label><Textarea id="edit-description" rows={7} className="min-h-40 resize-y" value={editDraft.description} aria-invalid={Boolean(editErrors.description)} onChange={(event) => { setEditDraft({ ...editDraft, description: event.target.value }); setEditErrors((current) => ({ ...current, description: undefined, form: undefined })) }} />{editErrors.description && <p className="text-xs font-medium text-destructive" role="alert">{editErrors.description}</p>}</div>
            <div className="space-y-2"><label className="text-sm font-medium">Priority</label><Select value={editDraft.priority} onValueChange={(value) => setEditDraft({ ...editDraft, priority: value as TicketPriority })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="critical">Critical</SelectItem><SelectItem value="high">High</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="low">Low</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><label className="text-sm font-medium">Category</label><Select value={editDraft.category} onValueChange={(value) => setEditDraft({ ...editDraft, category: value as TicketCategory })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="bug">Bug</SelectItem><SelectItem value="feature_request">Feature request</SelectItem><SelectItem value="billing">Billing</SelectItem><SelectItem value="account">Account</SelectItem><SelectItem value="authentication">Authentication</SelectItem><SelectItem value="performance">Performance</SelectItem><SelectItem value="security">Security</SelectItem><SelectItem value="integration">Integration</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent></Select></div>
            {canAssign ? <div className="space-y-2"><label className="text-sm font-medium">Assignee</label><Select value={editDraft.assigneeId} onValueChange={(value) => setEditDraft({ ...editDraft, assigneeId: value })}><SelectTrigger aria-invalid={assigneesFailed}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="unassigned">Unassigned</SelectItem>{assignees.map((assignee) => <SelectItem key={assignee.id} value={assignee.id}>{assignee.name} · {assignee.role}</SelectItem>)}</SelectContent></Select>{assigneesFailed && <p className="text-xs text-destructive" role="alert">Assignable users could not be loaded.</p>}{!assigneesFailed && assignees.filter((person) => !['org_admin', 'super_admin'].includes(person.role_slug)).length === 0 && <p className="text-xs leading-5 text-muted-foreground">No support staff are active yet. Invite a Support Agent in People &amp; Roles, then ask them to accept the invitation.</p>}</div> : <div className="space-y-2"><p className="text-sm font-medium">Assignee</p><div className="flex h-9 items-center rounded-md border bg-muted/30 px-3 text-sm text-muted-foreground">{ticket.assigneeName ?? 'Unassigned'}</div></div>}
            <div className="space-y-2"><label htmlFor="edit-tags" className="text-sm font-medium">Tags</label><Input id="edit-tags" value={editDraft.tags} onChange={(event) => setEditDraft({ ...editDraft, tags: event.target.value })} placeholder="payments, timeout" /><p className="text-xs text-muted-foreground">Separate tags with commas.</p></div>
          </div>
          {editErrors.form && <p className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive" role="alert">{editErrors.form}</p>}
          <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end"><Button variant="outline" onClick={() => setEditOpen(false)} disabled={isUpdating}>Cancel</Button><Button onClick={saveEdit} loading={isUpdating}>Save changes</Button></div>
        </DialogContent>
      </Dialog>
      <Dialog open={escalateOpen} onOpenChange={(open) => { setEscalateOpen(open); if (!open) { setEscalationReason(''); setEscalationError('') } }}><DialogContent><DialogHeader><DialogTitle>Escalate case</DialogTitle><DialogDescription>Move this Case to escalation level {ticket.escalationLevel + 1}. The reason is retained in the Case history and audit log.</DialogDescription></DialogHeader><label className="space-y-1.5 text-sm">Escalation reason <span className="text-destructive">*</span><Textarea rows={5} value={escalationReason} aria-invalid={Boolean(escalationError)} onChange={(event) => { setEscalationReason(event.target.value); setEscalationError('') }} placeholder="Explain the blocker, customer impact, and required intervention…" /></label>{escalationError && <p className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive" role="alert">{escalationError}</p>}<Button onClick={escalate} loading={isEscalating}><Flame className="h-4 w-4" />Escalate case</Button></DialogContent></Dialog>
    </div>
  )
}
