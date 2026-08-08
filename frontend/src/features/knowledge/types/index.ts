export interface KnowledgeFilters {
  search?: string
  category?: string
  tag?: string
}

export interface ArticleFormData {
  title: string
  content: string
  summary: string
  category: string
  tags: string[]
}
