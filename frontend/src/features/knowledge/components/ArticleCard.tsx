import { Eye, ThumbsUp, Tag } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@/components/ui'
import { formatDate } from '@/utils'
import type { KnowledgeArticle } from '@/types'

interface ArticleCardProps {
  article: KnowledgeArticle
  onClick?: () => void
  relevanceScore?: number
}

export function ArticleCard({ article, onClick, relevanceScore }: ArticleCardProps) {
  return (
    <Card
      className="hover:shadow-md transition-all cursor-pointer group border-border hover:border-primary/30"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
      aria-label={`Read article: ${article.title}`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-2">
            {article.title}
          </CardTitle>
          {relevanceScore !== undefined && (
            <Badge variant="info" className="shrink-0 text-2xs">
              {(relevanceScore * 100).toFixed(0)}% match
            </Badge>
          )}
        </div>
        <Badge variant="secondary" className="w-fit text-2xs">{article.category}</Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">{article.summary}</p>

        {article.tags.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            <Tag className="h-3 w-3 text-muted-foreground shrink-0" aria-hidden="true" />
            {article.tags.slice(0, 4).map((tag) => (
              <span key={tag} className="text-2xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t">
          <span className="truncate">{article.authorName}</span>
          <div className="flex items-center gap-3 shrink-0">
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" aria-hidden="true" />
              {article.viewCount.toLocaleString()}
            </span>
            <span className="flex items-center gap-1">
              <ThumbsUp className="h-3 w-3" aria-hidden="true" />
              {article.helpfulCount}
            </span>
          </div>
        </div>
        <p className="text-2xs text-muted-foreground">Updated {formatDate(article.updatedAt)}</p>
      </CardContent>
    </Card>
  )
}
