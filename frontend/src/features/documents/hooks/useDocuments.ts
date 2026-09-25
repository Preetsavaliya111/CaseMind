import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { documentService } from '../services/documentService'


export const documentKeys = {
  all: ['documents'] as const,
  list: () => [...documentKeys.all, 'list'] as const,
  detail: (id: string) => [...documentKeys.all, 'detail', id] as const,
}

export function useDocuments() {
  return useQuery({
    queryKey: documentKeys.list(),
    queryFn: () => documentService.list(),
    refetchInterval: (query) => query.state.data?.data.some((document) => ['uploaded', 'processing'].includes(document.status)) ? 2_000 : false,
  })
}

export function useDocument(id: string) {
  return useQuery({ queryKey: documentKeys.detail(id), queryFn: () => documentService.getById(id), enabled: Boolean(id) })
}

export function useUploadDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ file, onProgress }: { file: File; onProgress?: (percent: number) => void }) => documentService.upload(file, onProgress),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: documentKeys.all }),
  })
}

export function useReprocessDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => documentService.reprocess(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: documentKeys.all }),
  })
}

export function useDeleteDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => documentService.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: documentKeys.all }),
  })
}
