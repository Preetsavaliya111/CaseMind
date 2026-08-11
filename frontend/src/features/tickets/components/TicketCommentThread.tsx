import { useState } from 'react'
import { Send, Lock } from 'lucide-react'
import { Button, Textarea, Avatar, AvatarFallback } from '@/components/ui'
import { formatDateTime, initials } from '@/utils'
import { cn } from '@/utils'
import type { TicketComment } from '@/types'

interface TicketCommentThreadProps {
  comments: TicketComment[]
  onAddComment?: (content: string, isInternal: boolean) => Promise<void>
}

export function TicketCommentThread({ comments, onAddComment }: TicketCommentThreadProps) {
  const [content, setContent] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!content.trim() || !onAddComment) return
    setSubmitting(true)
    try {
      await onAddComment(content.trim(), isInternal)
      setContent('')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm font-semibold">
        Comments <span className="text-muted-foreground font-normal">({comments.length})</span>
      </p>

      {comments.length === 0 && (
        <p className="text-sm text-muted-foreground py-4 text-center border rounded-lg">No comments yet.</p>
      )}

      {comments.map((comment) => (
        <div key={comment.id} className={cn('flex gap-3', comment.isInternal && 'opacity-80')}>
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="text-xs">{initials(comment.authorName)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium">{comment.authorName}</span>
              {comment.isInternal && (
                <span className="inline-flex items-center gap-1 text-2xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded">
                  <Lock className="h-2.5 w-2.5" />
                  Internal
                </span>
              )}
              <span className="text-xs text-muted-foreground">{formatDateTime(comment.createdAt)}</span>
            </div>
            <div className={cn(
              'rounded-lg px-3 py-2 text-sm',
              comment.isInternal
                ? 'bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800'
                : 'bg-muted',
            )}>
              {comment.content}
            </div>
          </div>
        </div>
      ))}

      {onAddComment && (
        <div className="space-y-2 pt-2 border-t">
          <Textarea
            placeholder="Add a comment…"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            aria-label="Comment text"
          />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={isInternal}
                onChange={(e) => setIsInternal(e.target.checked)}
                className="rounded border-input"
              />
              <Lock className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
              Internal note
            </label>
            <Button size="sm" onClick={handleSubmit} disabled={!content.trim() || submitting} loading={submitting}>
              <Send className="h-3.5 w-3.5" />
              Comment
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
