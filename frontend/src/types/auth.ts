export type UserRole = 'admin' | 'manager' | 'agent' | 'viewer'

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
