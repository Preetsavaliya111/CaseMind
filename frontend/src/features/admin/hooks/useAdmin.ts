import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  adminService,
  type InviteUserPayload,
  type CreateModelPayload,
  type CreateExperimentPayload,
} from '../services/adminService'
import type { UserRole, ModelConfig } from '@/types'

export const adminKeys = {
  all: ['admin'] as const,
  users: () => [...adminKeys.all, 'users'] as const,
  models: () => [...adminKeys.all, 'models'] as const,
  experiments: () => [...adminKeys.all, 'experiments'] as const,
}

export function useAdminUsers() {
  return useQuery({
    queryKey: adminKeys.users(),
    queryFn: () => adminService.getUsers(),
  })
}

export function useInviteUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: InviteUserPayload) => adminService.inviteUser(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users() })
    },
  })
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: UserRole }) =>
      adminService.updateUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users() })
    },
  })
}

export function useToggleUserStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
      adminService.toggleUserStatus(userId, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users() })
    },
  })
}

export function useAdminModels() {
  return useQuery({
    queryKey: adminKeys.models(),
    queryFn: () => adminService.getModels(),
  })
}

export function useCreateModel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateModelPayload) => adminService.createModel(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.models() })
    },
  })
}

export function useUpdateModelStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ modelId, status }: { modelId: string; status: ModelConfig['status'] }) =>
      adminService.updateModelStatus(modelId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.models() })
    },
  })
}

export function useAdminExperiments() {
  return useQuery({
    queryKey: adminKeys.experiments(),
    queryFn: () => adminService.getExperiments(),
  })
}

export function useCreateExperiment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateExperimentPayload) => adminService.createExperiment(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.experiments() })
    },
  })
}
