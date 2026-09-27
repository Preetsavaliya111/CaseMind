import type { User } from '@/types'
import type { LoginRequest, LoginResponse, LoginResult, RegisterRequest } from '../types'
import { get, patch, post } from '@/services/apiClient'

interface ApiUser {
  id: string
  organization_id: string
  name: string
  email: string
  role: User['role']
  department: string
  is_active: boolean
  mfa_enabled: boolean
  created_at: string
  last_login_at?: string
  organization: { id: string; name: string }
  roles: User['roles']
  permissions: string[]
  teams: Array<{ id: string; name: string; department_id?: string }>
  departments: User['departments']
  default_workspace: string
  onboarding_completed: boolean
  onboarding_step: number
  onboarding_data: Record<string, unknown>
  tours_viewed: string[]
  setup_checklist_dismissed: boolean
}

interface ApiTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  user: ApiUser
}

interface ApiMFAChallenge { mfa_required: true; challenge_token: string; expires_in: number }

export interface InvitationPreview {
  email: string
  name: string
  organization_name: string
  role: string
  role_name: string
  department: string
  expires_at: string
}

function mapUser(user: ApiUser): User {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    organizationId: user.organization.id,
    organizationName: user.organization.name,
    roles: user.roles,
    permissions: user.permissions,
    teams: user.teams.map((team) => ({ id: team.id, name: team.name, departmentId: team.department_id })),
    departments: user.departments,
    defaultWorkspace: user.default_workspace,
    department: user.department,
    isActive: user.is_active,
    mfaEnabled: user.mfa_enabled,
    createdAt: user.created_at,
    lastLoginAt: user.last_login_at,
    onboardingCompleted: user.onboarding_completed,
    onboardingStep: user.onboarding_step,
    onboardingData: user.onboarding_data ?? {},
    toursViewed: user.tours_viewed ?? [],
    setupChecklistDismissed: user.setup_checklist_dismissed,
  }
}

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResult> {
    const result = await post<ApiTokenResponse | ApiMFAChallenge>('/auth/login', credentials)
    if ('mfa_required' in result) return { mfaRequired: true, challengeToken: result.challenge_token, expiresIn: result.expires_in }
    return {
      user: mapUser(result.user),
      accessToken: result.access_token,
      expiresIn: result.expires_in,
    }
  },

  async verifyMFA(challengeToken: string, code: string): Promise<LoginResponse> {
    const result = await post<ApiTokenResponse>('/auth/mfa/verify', { challenge_token: challengeToken, code })
    return { user: mapUser(result.user), accessToken: result.access_token, expiresIn: result.expires_in }
  },

  mfaStatus: () => get<{ enabled: boolean }>('/auth/mfa/status'),
  mfaSetup: (currentPassword: string) => post<{ secret: string; otpauth_uri: string }>('/auth/mfa/setup', { current_password: currentPassword }),
  mfaEnable: (code: string) => post<{ recovery_codes: string[] }>('/auth/mfa/enable', { code }),
  mfaDisable: (currentPassword: string, code: string) => post<void>('/auth/mfa/disable', { current_password: currentPassword, code }),

  async logout(): Promise<void> {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  },

  async getCurrentUser(): Promise<User> {
    return mapUser(await get<ApiUser>('/auth/me'))
  },

  async updateProfile(name: string): Promise<User> {
    return mapUser(await patch<ApiUser>('/auth/profile', { name }))
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<LoginResponse> {
    const result = await post<ApiTokenResponse>('/auth/password', { current_password: currentPassword, new_password: newPassword })
    return { user: mapUser(result.user), accessToken: result.access_token, expiresIn: result.expires_in }
  },

  requestPasswordReset: (email: string) => post<{ message: string }>('/auth/password-reset/request', { email }),

  confirmPasswordReset: (token: string, newPassword: string) => post<{ message: string }>('/auth/password-reset/confirm', {
    token,
    new_password: newPassword,
  }),

  async registerAccount(data: RegisterRequest): Promise<User> {
    const user = await post<ApiUser>('/auth/register', {
      name: data.name,
      email: data.email,
      password: data.password,
      department: data.department,
      organization_name: data.organizationName,
      organization_domain: data.organizationDomain || null,
    })
    return mapUser(user)
  },

  async updateOnboarding(data: {
    step?: number
    completed?: boolean
    data?: Record<string, unknown>
    tourViewed?: string
    checklistDismissed?: boolean
  }): Promise<User> {
    return mapUser(await patch<ApiUser>('/auth/onboarding', {
      step: data.step,
      completed: data.completed,
      data: data.data,
      tour_viewed: data.tourViewed,
      checklist_dismissed: data.checklistDismissed,
    }))
  },

  async restartOnboarding(): Promise<User> {
    return mapUser(await post<ApiUser>('/auth/onboarding/restart'))
  },

  invitation: (token: string) => get<InvitationPreview>(`/auth/invitations/${encodeURIComponent(token)}`),

  async acceptInvitation(token: string, password: string): Promise<LoginResponse> {
    const result = await post<ApiTokenResponse>(`/auth/invitations/${encodeURIComponent(token)}/accept`, { password })
    return {
      user: mapUser(result.user),
      accessToken: result.access_token,
      expiresIn: result.expires_in,
    }
  },
}
