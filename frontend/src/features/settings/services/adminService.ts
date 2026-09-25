import { del, get, patch, post } from '@/services/apiClient'
import type { UserRole, WorkspaceRole } from '@/types/auth'

export interface AdminUser {
  id: string
  name: string
  email: string
  role: UserRole
  workspace_role: WorkspaceRole
  department: string
  is_active: boolean
  created_at: string
}

export interface AIConfiguration {
  chat_provider: string
  chat_model: string
  chat_configured: boolean
  embedding_provider: string
  embedding_model: string
  embedding_configured: boolean
  vector_store: string
  vector_collection: string
  secrets_location: string
}

export interface Invitation {
  id: string
  name: string
  email: string
  role: WorkspaceRole
  role_name: string
  department: string
  status: 'pending' | 'accepted' | 'expired' | 'revoked'
  expires_at: string
  created_at: string
  invited_by_name?: string
  token?: string
}

export interface InvitationCreate {
  name: string
  email: string
  role: Exclude<WorkspaceRole, 'super_admin'>
  department: string
}

export const adminService = {
  users: () => get<AdminUser[]>('/admin/users'),
  updateUser: (id: string, data: { workspace_role?: Exclude<WorkspaceRole, 'super_admin'>; department?: string; is_active?: boolean }) => patch<AdminUser>(`/admin/users/${id}`, data),
  passwordResetLink: (id: string) => post<{ reset_link: string; expires_at: string }>(`/admin/users/${id}/password-reset`),
  invitations: () => get<Invitation[]>('/admin/invitations'),
  createInvitation: (data: InvitationCreate) => post<Invitation>('/admin/invitations', data),
  revokeInvitation: (id: string) => del<void>(`/admin/invitations/${id}`),
  aiConfiguration: () => get<AIConfiguration>('/admin/ai-configuration'),
}
