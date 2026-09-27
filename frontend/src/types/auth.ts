/**
 * Six named roles from the spec.
 * admin       = System Administrator
 * manager     = Support Manager
 * agent       = Support Agent
 * engineer    = Engineering Team
 * product     = Product Manager
 * cs          = Customer Success
 * viewer      = read-only (legacy, kept for compat)
 */
export type UserRole = 'admin' | 'manager' | 'agent' | 'engineer' | 'product' | 'cs' | 'viewer'
export type WorkspaceRole = 'customer' | 'support_agent' | 'senior_agent' | 'team_lead' | 'support_manager' | 'knowledge_manager' | 'ai_manager' | 'org_admin' | 'super_admin'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  organizationId?: string
  organizationName?: string
  roles: WorkspaceRole[]
  permissions: string[]
  teams: Array<{ id: string; name: string; departmentId?: string }>
  departments: Array<{ id: string; name: string }>
  defaultWorkspace: string
  avatarUrl?: string
  department: string
  isActive: boolean
  mfaEnabled: boolean
  createdAt: string
  lastLoginAt?: string
  onboardingCompleted: boolean
  onboardingStep: number
  onboardingData: Record<string, unknown>
  toursViewed: string[]
  setupChecklistDismissed: boolean
}

export interface AuthTokens {
  accessToken: string
  refreshToken?: string
  expiresIn: number
}

export interface AuthState {
  user: User | null
  tokens: AuthTokens | null
  isAuthenticated: boolean
}
