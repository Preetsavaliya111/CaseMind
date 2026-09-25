import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { memoryService, type CreateMemoryInput } from '../services/memoryService'


export const memoryKeys = { all: ['memory-items'] as const, list: (search: string) => ['memory-items', 'list', search] as const }

export function useMemoryItems(search: string) {
  return useQuery({ queryKey: memoryKeys.list(search), queryFn: () => memoryService.list(search) })
}

export function useCreateMemoryItem() {
  const queryClient = useQueryClient()
  return useMutation({ mutationFn: (input: CreateMemoryInput) => memoryService.create(input), onSuccess: () => queryClient.invalidateQueries({ queryKey: memoryKeys.all }) })
}

export function useVerifyMemoryItem() {
  const queryClient = useQueryClient()
  return useMutation({ mutationFn: (id: string) => memoryService.verify(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: memoryKeys.all }) })
}

export function useDeleteMemoryItem() {
  const queryClient = useQueryClient()
  return useMutation({ mutationFn: (id: string) => memoryService.remove(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: memoryKeys.all }) })
}
