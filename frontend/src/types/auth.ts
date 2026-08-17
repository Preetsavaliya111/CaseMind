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

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  avatarUrl?: string
  department: string
  isActive: boolean
  createdAt: string
  lastLoginAt?: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface AuthState {
  user: User | null
  tokens: AuthTokens | null
  isAuthenticated: boolean
}
