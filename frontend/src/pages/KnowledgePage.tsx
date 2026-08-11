import { useState } from 'react'
import { Search, BookOpen, Eye, ThumbsUp } from 'lucide-react'
import { Input, Card, CardContent, CardHeader, CardTitle, SkeletonCard } from '@/components/ui'
import { EmptyState } from '@/components/common'
import { useKnowledgeArticles, useKnowledgeSearch } from '@/features/knowledge/hooks/useKnowledge'
import { formatDate } from '@/utils'

export function KnowledgePage() {
  const [query, setQuery] = useState('')
  const isSearching = query.length >= 2

  const { data: articles, isLoading: articlesLoading } = useKnowledgeArticles()
  const { data: searchResults, isLoading: searchLoading } = useKnowledgeSearch(query)

  const isLoading = isSearching ? searchLoading : articlesLoading
  const displayArticles = isSearching
    ? searchResults?.map((r) => r.article) ?? []
    : articles ?? []

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Search */}
      <div className="max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <Input
            placeholder="Search knowledge base…"
            className="pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search knowledge base"
          />
        </div>
        {isSearching && (
          <p className="text-xs text-muted-foreground mt-1.5">
            {searchLoading ? 'Searching…' : `${displayArticles.length} results for "${query}"`}
          </p>
        )}
      </div>

      {/* Articles */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : displayArticles.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No articles found"
          description={isSearching ? `No results for "${query}". Try different keywords.` : 'No knowledge articles available yet.'}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayArticles.map((article) => (
            <Card key={article.id} className="hover:shadow-md transition-shadow cursor-pointer group">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-sm font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-2">
                    {article.title}
                  </CardTitle>
                </div>
                <p className="text-xs text-muted-foreground">{article.category}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground line-clamp-3">{article.summary}</p>
                <div className="flex flex-wrap gap-1">
                  {article.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="text-2xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{tag}</span>
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t">
                  <span>{article.authorName}</span>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{article.viewCount}</span>
                    <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" />{article.helpfulCount}</span>
                  </div>
                </div>
                <p className="text-2xs text-muted-foreground">Updated {formatDate(article.updatedAt)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
