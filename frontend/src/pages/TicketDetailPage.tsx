import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Brain, AlertTriangle } from 'lucide-react'
import { Button, Badge, Card, CardContent, CardHeader, CardTitle, Skeleton } from '@/components/ui'
import { PriorityBadge, StatusBadge } from '@/components/common'
import { useTicket } from '@/features/tickets/hooks/useTickets'
import { formatDateTime } from '@/utils'

export function TicketDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: ticket, isLoading, isError } = useTicket(id ?? '')

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (isError || !ticket) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[400px] text-center">
        <AlertTriangle className="h-10 w-10 text-destructive mb-3" />
        <p className="font-semibold">Ticket not found</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate('/tickets')}>
          Back to Tickets
        </Button>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in max-w-5xl">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/tickets')} aria-label="Back to tickets">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs text-muted-foreground">{ticket.id}</span>
            {ticket.slaBreached && <Badge variant="critical">SLA Breached</Badge>}
          </div>
          <h1 className="text-xl font-semibold">{ticket.title}</h1>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
            <span className="text-xs text-muted-foreground">
              Created {formatDateTime(ticket.createdAt)}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader><CardTitle>Description</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
            </CardContent>
          </Card>

          {/* AI Analysis */}
          {ticket.aiAnalysis && (
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Brain className="h-4 w-4" aria-hidden="true" />
                  AI Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Category</p>
                    <p className="font-medium capitalize">{ticket.aiAnalysis.category.replace('_', ' ')}</p>
                    <p className="text-xs text-muted-foreground">{(ticket.aiAnalysis.categoryConfidence * 100).toFixed(0)}% confidence</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Sentiment</p>
                    <p className="font-medium capitalize">{ticket.aiAnalysis.sentiment}</p>
                    <p className="text-xs text-muted-foreground">Score: {ticket.aiAnalysis.sentimentScore.toFixed(2)}</p>
                  </div>
                </div>

                {ticket.aiAnalysis.suggestedResolutions.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Suggested Resolutions</p>
                    <ul className="space-y-1.5">
                      {ticket.aiAnalysis.suggestedResolutions.map((r, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span className="text-primary mt-0.5">•</span>
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {ticket.aiAnalysis.similarTickets.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Similar Tickets</p>
                    <div className="flex gap-2 flex-wrap">
                      {ticket.aiAnalysis.similarTickets.map((id) => (
                        <button
                          key={id}
                          onClick={() => navigate(`/tickets/${id}`)}
                          className="font-mono text-xs text-primary hover:underline"
                        >
                          {id}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Details</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Assignee</span>
                <span className="font-medium">{ticket.assigneeName ?? 'Unassigned'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reporter</span>
                <span className="font-medium">{ticket.reporterName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Category</span>
                <span className="font-medium capitalize">{ticket.category.replace('_', ' ')}</span>
              </div>
              {ticket.slaDeadline && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">SLA Deadline</span>
                  <span className={ticket.slaBreached ? 'text-red-600 dark:text-red-400 font-medium' : 'font-medium'}>
                    {formatDateTime(ticket.slaDeadline)}
                  </span>
                </div>
              )}
              {ticket.tags.length > 0 && (
                <div>
                  <p className="text-muted-foreground mb-1.5">Tags</p>
                  <div className="flex flex-wrap gap-1">
                    {ticket.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
