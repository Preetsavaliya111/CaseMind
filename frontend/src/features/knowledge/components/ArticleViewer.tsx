import { ArrowLeft, Eye, ThumbsUp, Tag, Ticket } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button, Badge } from '@/components/ui'
import { formatDate } from '@/utils'
import type { KnowledgeArticle } from '@/types'

interface ArticleViewerProps {
  article: KnowledgeArticle
}

export function ArticleViewer({ article }: ArticleViewerProps) {
  const navigate = useNavigate()

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/knowledge')} aria-label="Back to knowledge base">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <Badge variant="secondary" className="mb-1">{article.category}</Badge>
          <h1 className="text-xl font-bold leading-snug">{article.title}</h1>
        </div>
      </div>

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground border-y py-3">
        <span>By <strong className="text-foreground">{article.authorName}</strong></span>
        <span>Updated {formatDate(article.updatedAt)}</span>
        <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{article.viewCount.toLocaleString()} views</span>
        <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" />{article.helpfulCount} found helpful</span>
      </div>

      {/* Content */}
      <div className="prose prose-sm dark:prose-invert max-w-none">
        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
          {article.content}
        </pre>
      </div>

      {/* Tags */}
      {article.tags.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap pt-2 border-t">
          <Tag className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
          {article.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
          ))}
        </div>
      )}

      {/* Related tickets */}
      {article.relatedTicketIds.length > 0 && (
        <div className="space-y-2 pt-2 border-t">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <Ticket className="h-3.5 w-3.5" aria-hidden="true" />
            Related Tickets
          </p>
          <div className="flex flex-wrap gap-2">
            {article.relatedTicketIds.map((id) => (
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
    </div>
  )
}
