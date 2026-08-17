import { AlertTriangle, Clock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { PriorityBadge } from '@/components/common'
import { formatRelative } from '@/utils'
import type { Ticket } from '@/types'

interface RecentTicketsFeedProps {
  tickets: Ticket[]
}

export function RecentTicketsFeed({ tickets }: RecentTicketsFeedProps) {
  const navigate = useNavigate()
  const recent = tickets.slice(0, 5)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          Recent Tickets
          <button
            onClick={() => navigate('/tickets')}
            className="text-xs text-primary hover:underline font-normal"
          >
            View all
          </button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 p-0">
        {recent.map((ticket) => (
          <button
            key={ticket.id}
            onClick={() => navigate(`/tickets/${ticket.id}`)}
            className="w-full flex items-start gap-3 px-6 py-3 hover:bg-muted/30 transition-colors text-left"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-mono text-2xs text-muted-foreground">{ticket.id}</span>
                {ticket.slaBreached && (
                  <AlertTriangle className="h-3 w-3 text-red-500 shrink-0" aria-label="SLA breached" />
                )}
              </div>
              <p className="text-sm font-medium line-clamp-1">{ticket.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <PriorityBadge priority={ticket.priority} />
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" aria-hidden="true" />
                  {formatRelative(ticket.createdAt)}
                </span>
              </div>
            </div>
          </button>
        ))}
      </CardContent>
    </Card>
  )
}
