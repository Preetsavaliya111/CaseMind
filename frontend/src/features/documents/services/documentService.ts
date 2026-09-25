import type { PaginatedResponse, SourceDocument, SourceDocumentDetail } from '@/types'
import { apiClient, del, get, post } from '@/services/apiClient'


interface ApiDocument {
  id: string
  original_filename: string
  extension: string
  media_type: string
  size_bytes: number
  status: SourceDocument['status']
  chunk_count: number
  extracted_characters: number
  error_code?: string
  error_message?: string
  uploaded_by_name: string
  created_at: string
  updated_at: string
  indexed_at?: string
  chunks?: Array<{
    id: string
    chunk_index: number
    content: string
    char_start: number
    char_end: number
    token_estimate: number
  }>
}

interface ApiDocumentList {
  items: ApiDocument[]
  total: number
  page: number
  page_size: number
  pages: number
}

function mapDocument(document: ApiDocument): SourceDocument {
  return {
    id: document.id,
    originalFilename: document.original_filename,
    extension: document.extension,
    mediaType: document.media_type,
    sizeBytes: document.size_bytes,
    status: document.status,
    chunkCount: document.chunk_count,
    extractedCharacters: document.extracted_characters,
    errorCode: document.error_code,
    errorMessage: document.error_message,
    uploadedByName: document.uploaded_by_name,
    createdAt: document.created_at,
    updatedAt: document.updated_at,
    indexedAt: document.indexed_at,
  }
}

export const documentService = {
  async list(page = 1, pageSize = 50): Promise<PaginatedResponse<SourceDocument>> {
    const response = await get<ApiDocumentList>('/documents', { params: { page, page_size: pageSize } })
    return {
      data: response.items.map(mapDocument),
      total: response.total,
      page: response.page,
      pageSize: response.page_size,
      totalPages: response.pages,
    }
  },

  async getById(id: string): Promise<SourceDocumentDetail> {
    const response = await get<ApiDocument>(`/documents/${id}`)
    return {
      ...mapDocument(response),
      chunks: (response.chunks ?? []).map((chunk) => ({
        id: chunk.id,
        chunkIndex: chunk.chunk_index,
        content: chunk.content,
        charStart: chunk.char_start,
        charEnd: chunk.char_end,
        tokenEstimate: chunk.token_estimate,
      })),
    }
  },

  async upload(file: File, onProgress?: (percent: number) => void): Promise<SourceDocument> {
    const form = new FormData()
    form.append('file', file)
    const response = await apiClient.post<ApiDocument>('/documents', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (event) => {
        if (event.total && onProgress) onProgress(Math.round((event.loaded / event.total) * 100))
      },
    })
    return mapDocument(response.data)
  },

  async reprocess(id: string): Promise<SourceDocument> {
    return mapDocument(await post<ApiDocument>(`/documents/${id}/reprocess`))
  },

  async remove(id: string): Promise<void> {
    await del(`/documents/${id}`)
  },
}
