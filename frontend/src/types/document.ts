export type DocumentStatus = 'uploaded' | 'processing' | 'ready_for_indexing' | 'indexed' | 'failed'

export interface SourceDocument {
  id: string
  originalFilename: string
  extension: string
  mediaType: string
  sizeBytes: number
  status: DocumentStatus
  chunkCount: number
  extractedCharacters: number
  errorCode?: string
  errorMessage?: string
  uploadedByName: string
  createdAt: string
  updatedAt: string
  indexedAt?: string
}

export interface DocumentChunk {
  id: string
  chunkIndex: number
  content: string
  charStart: number
  charEnd: number
  tokenEstimate: number
}

export interface SourceDocumentDetail extends SourceDocument {
  chunks: DocumentChunk[]
}
