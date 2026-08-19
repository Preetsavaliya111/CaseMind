import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { memoryService, type MemoryFilterParams } from '../services/memoryService'
import type { OrganizationalMemory } from '@/types'

export const memoryKeys = {
  all: ['memory'] as const,
  lists: () => [...memoryKeys.all, 'list'] as const,
  list: (filters?: MemoryFilterParams) => [...memoryKeys.lists(), filters] as const,
  detail: (id: string) => [...memoryKeys.all, 'detail', id] as const,
  simulate: (q: string) => [...memoryKeys.all, 'simulate', q] as const,
}

export function useMemoryRecords(filters?: MemoryFilterParams) {
  return useQuery({
    queryKey: memoryKeys.list(filters),
    queryFn: () => memoryService.getMemoryRecords(filters),
  })
}

export function useMemoryRecord(id: string) {
  return useQuery({
    queryKey: memoryKeys.detail(id),
    queryFn: () => memoryService.getMemoryRecordById(id),
    enabled: Boolean(id),
  })
}

export function useMemorySimulator() {
  return useMutation({
    mutationFn: (query: string) => memoryService.simulateMatch(query),
  })
}

export function useCreateMemoryRecord() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<OrganizationalMemory>) => memoryService.createMemoryRecord(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memoryKeys.lists() })
    },
  })
}
