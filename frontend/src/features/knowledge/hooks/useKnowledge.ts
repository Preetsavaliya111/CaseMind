import { useQuery } from '@tanstack/react-query'
import { knowledgeService } from '../services/knowledgeService'

export const knowledgeKeys = {
  all: ['knowledge'] as const,
  articles: () => [...knowledgeKeys.all, 'articles'] as const,
  article: (id: string) => [...knowledgeKeys.all, 'article', id] as const,
  search: (q: string) => [...knowledgeKeys.all, 'search', q] as const,
}

export function useKnowledgeArticles() {
  return useQuery({
    queryKey: knowledgeKeys.articles(),
    queryFn: knowledgeService.getArticles,
  })
}

export function useKnowledgeArticle(id: string) {
  return useQuery({
    queryKey: knowledgeKeys.article(id),
    queryFn: () => knowledgeService.getArticleById(id),
    enabled: Boolean(id),
  })
}

export function useKnowledgeSearch(query: string) {
  return useQuery({
    queryKey: knowledgeKeys.search(query),
    queryFn: () => knowledgeService.search(query),
    enabled: query.length >= 2,
  })
}
