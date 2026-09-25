import { del, get, patch, post, put } from '@/services/apiClient'

export interface Department { id: string; name: string; description?: string; is_active: boolean }
export interface TeamMember { id: string; name: string; email: string; is_lead: boolean }
export interface Team { id: string; name: string; description?: string; department_id?: string; department_name?: string; is_active: boolean; members: TeamMember[] }

export const teamService = {
  departments: () => get<Department[]>('/organization/departments'),
  createDepartment: (data: { name: string; description?: string }) => post<Department>('/organization/departments', data),
  teams: () => get<Team[]>('/organization/teams'),
  createTeam: (data: { name: string; description?: string; department_id: string }) => post<Team>('/organization/teams', data),
  updateTeam: (id: string, data: { name?: string; description?: string; department_id?: string; is_active?: boolean }) => patch<Team>(`/organization/teams/${id}`, data),
  addMember: (teamId: string, userId: string, isLead = false) => put<Team>(`/organization/teams/${teamId}/members/${userId}`, { is_lead: isLead }),
  removeMember: (teamId: string, userId: string) => del<Team>(`/organization/teams/${teamId}/members/${userId}`),
}
